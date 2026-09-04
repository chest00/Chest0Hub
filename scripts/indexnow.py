#!/usr/bin/env python3
"""Notification IndexNow pour Chest0 Hub.

Ce script ne publie pas le site. Il doit être exécuté uniquement après
le déploiement effectif des URL sur https://chest0.fr/.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
HOST = "chest0.fr"
BASE_URL = f"https://{HOST}"
ENDPOINT = "https://api.indexnow.org/indexnow"
KEY_FILE = ROOT / "954547a5fa2b42ae978850ce2eae5c57.txt"
KEY_LOCATION = f"{BASE_URL}/{KEY_FILE.name}"
MAX_URLS = 10_000


def load_key() -> str:
    """Lit et valide la clé publique IndexNow."""
    if not KEY_FILE.is_file():
        raise ValueError(f"Clé IndexNow absente : {KEY_FILE}")

    key = KEY_FILE.read_text(encoding="utf-8").strip()

    if not key or len(key) > 128:
        raise ValueError("Clé IndexNow invalide.")

    if not all(char.isalnum() or char == "-" for char in key):
        raise ValueError("Format de clé IndexNow invalide.")

    return key


def normalize_url(value: str) -> str:
    """Valide une URL publique Chest0 Hub et renvoie sa forme normalisée."""
    value = value.strip()
    parsed = urlparse(value)

    if parsed.scheme != "https":
        raise ValueError(f"HTTPS obligatoire : {value}")

    if parsed.hostname != HOST:
        raise ValueError(f"Domaine interdit : {value}")

    if parsed.username or parsed.password or parsed.port:
        raise ValueError(f"Autorité URL interdite : {value}")

    if parsed.fragment:
        raise ValueError(f"Fragment interdit : {value}")

    return value


def prepare_urls(values: list[str]) -> list[str]:
    """Valide, déduplique et limite les URL à notifier."""
    urls: list[str] = []

    for value in values:
        url = normalize_url(value)
        if url not in urls:
            urls.append(url)

    if not urls:
        raise ValueError("Aucune URL à notifier.")

    if len(urls) > MAX_URLS:
        raise ValueError(
            f"Trop d'URL : {len(urls)} (maximum {MAX_URLS})."
        )

    return urls


def build_payload(urls: list[str]) -> bytes:
    """Construit la charge JSON officielle IndexNow."""
    payload = {
        "host": HOST,
        "key": load_key(),
        "keyLocation": KEY_LOCATION,
        "urlList": prepare_urls(urls),
    }
    return json.dumps(payload).encode("utf-8")


def submit(urls: list[str]) -> int:
    """Envoie les URL à IndexNow et renvoie le code HTTP."""
    request = urllib.request.Request(
        ENDPOINT,
        data=build_payload(urls),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status
    except urllib.error.HTTPError as exc:
        return exc.code


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Notifie IndexNow après publication effective sur chest0.fr."
        )
    )
    parser.add_argument(
        "urls",
        nargs="+",
        help="URL HTTPS publiques de chest0.fr à notifier.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Valide la requête sans contacter IndexNow.",
    )
    args = parser.parse_args()

    try:
        urls = prepare_urls(args.urls)

        if args.dry_run:
            payload = json.loads(build_payload(urls))
            print("DRY-RUN — aucune requête IndexNow envoyée.")
            print(json.dumps(payload, indent=2, ensure_ascii=False))
            return 0

        status = submit(urls)

        if status == 200:
            print("PASS — IndexNow a accepté la notification (HTTP 200).")
            return 0

        if status == 202:
            print(
                "PASS — IndexNow a reçu la notification "
                "(HTTP 202, validation de clé en cours)."
            )
            return 0

        messages = {
            400: "requête invalide",
            403: "clé invalide ou non autorisée",
            422: "URL ou clé incompatible avec l'hôte",
            429: "trop de requêtes",
        }
        detail = messages.get(status, "réponse inattendue")
        print(
            f"FAIL — IndexNow HTTP {status} : {detail}.",
            file=sys.stderr,
        )
        return 1

    except (ValueError, OSError) as exc:
        print(f"FAIL — {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
