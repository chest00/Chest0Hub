#!/usr/bin/env python3
"""Référencement Chest0 Hub : plan du site et page Livres lisible par tous les moteurs.

À lancer après toute modification de data/books.json ou ajout de page publique :
    python3 scripts/seo_build.py
Ensuite : git add -A && git commit && git push, puis scripts/indexnow.py.
"""
from __future__ import annotations

import html
import json
import subprocess
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://chest0.fr/"

# (chemin du fichier, adresse publique)
PAGES = [
    ("index.html", ""),
    ("pages/livres.html", "pages/livres.html"),
    ("pages/produits.html", "pages/produits.html"),
    ("pages/blog.html", "pages/blog.html"),
    ("outils/index.html", "outils/"),
    ("outils/equilibre-quotidien/index.html", "outils/equilibre-quotidien/"),
    ("outils/journal-sommeil/index.html", "outils/journal-sommeil/"),
    ("outils/pauses-actives/index.html", "outils/pauses-actives/"),
    ("outils/chest0-clip/index.html", "outils/chest0-clip/"),
    ("jeux/games-studio/index.html", "jeux/games-studio/"),
    *[(f"jeux/games-studio/fiches/{n}.html", f"jeux/games-studio/fiches/{n}.html")
      for n in ("circuit", "gravity", "fusion", "skyline", "pulse", "memory")],
    *[(f"jeux/games-studio/guides/{n}.html", f"jeux/games-studio/guides/{n}.html")
      for n in ("logique", "circuit", "gravity", "scores", "sauvegardes")],
    ("pages/projets.html", "pages/projets.html"),
    ("pages/apropos.html", "pages/apropos.html"),
    ("pages/contact.html", "pages/contact.html"),
]

BOOKS_START, BOOKS_END = "<!-- LIVRES:DEBUT (généré par scripts/seo_build.py) -->", "<!-- LIVRES:FIN -->"
LD_START, LD_END = "<!-- LIVRES-LD:DEBUT -->", "<!-- LIVRES-LD:FIN -->"


def lastmod(path: str) -> str:
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", path], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        out = ""
    return out or date.today().isoformat()


def build_sitemap() -> str:
    rows = []
    for path, url in PAGES:
        if not (ROOT / path).is_file():
            raise SystemExit(f"Page absente : {path}")
        rows.append(f"  <url>\n    <loc>{BASE}{url}</loc>\n    <lastmod>{lastmod(path)}</lastmod>\n  </url>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rows) + "\n</urlset>\n")


def _replace_between(text: str, start: str, end: str, inner: str) -> str:
    a, b = text.index(start), text.index(end)
    return text[:a + len(start)] + inner + text[b:]


def books_html(data: dict) -> tuple[str, str]:
    e = lambda s: html.escape(str(s or ""), quote=True)
    cards, ld_items = [], []
    for i, item in enumerate(x for x in data.get("items", []) if x.get("enabled", True)):
        cover = item.get("cover", "")
        links = []
        if item.get("amazonUrl"):
            links.append((item["amazonUrl"], item.get("amazonLabel") or "Voir sur Amazon"))
        if item.get("audioUrl"):
            links.append((item["audioUrl"], "Livre audio — Gumroad" if item.get("koboUrl") else "Livre audio"))
        if item.get("koboUrl"):
            links.append((item["koboUrl"], "Livre audio — Kobo"))
        a = "".join(f'<a class="product-button" href="{e(u)}" target="_blank" rel="noopener noreferrer">{e(t)}</a>' for u, t in links)
        img = f'<img class="book-cover" src="../{e(cover)}" alt="Couverture du livre {e(item.get("title"))}" loading="lazy">' if cover else ""
        cards.append(f'\n<article class="book-card{" has-cover" if cover else ""}">{img}<div class="book-content">'
                     f'<h2>{e(item.get("title"))}</h2><p>{e(item.get("description"))}</p>{a}</div></article>')
        book = {"@type": "Book", "name": item.get("title", "").capitalize() if item.get("title", "").isupper() else item.get("title", ""),
                "author": {"@type": "Person", "name": data.get("author", "Chest0 JM.S.")},
                "description": item.get("description", ""), "inLanguage": "fr-FR"}
        if item.get("amazonUrl"):
            book["url"] = item["amazonUrl"]
        if cover:
            book["image"] = BASE + cover
        ld_items.append({"@type": "ListItem", "position": i + 1, "item": book})
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "Livres de Chest0 JM.S.", "itemListElement": ld_items}
    return "".join(cards) + "\n", '\n    <script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False, indent=2) + "\n    </script>\n    "


def main() -> int:
    (ROOT / "sitemap.xml").write_text(build_sitemap(), encoding="utf-8")
    data = json.loads((ROOT / "data/books.json").read_text(encoding="utf-8"))
    page = ROOT / "pages/livres.html"
    text = page.read_text(encoding="utf-8")
    cards, ld = books_html(data)
    text = _replace_between(text, BOOKS_START, BOOKS_END, cards)
    text = _replace_between(text, LD_START, LD_END, ld)
    page.write_text(text, encoding="utf-8")
    print(f"Plan du site : {len(PAGES)} pages. Page Livres : {cards.count('<article')} livres écrits dans la page.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
