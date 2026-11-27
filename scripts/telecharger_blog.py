#!/usr/bin/env python3
"""Télécharge les articles du blog Blogger et toutes leurs images vers Chest0Hub.

À lancer une seule fois depuis le Terminal :
    python3 ~/Applications/Chest0Hub/scripts/telecharger_blog.py
"""
import hashlib
import json
import os
import re
import sys
import time
import urllib.request

BLOG = "https://bien-et-etre.blogspot.com"
HUB = os.path.expanduser("~/Applications/Chest0Hub")
OUT = os.path.join(HUB, "_migration_blog")
IMG_DIR = os.path.join(HUB, "assets", "blog")
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) Chest0-migration"}


def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read(), r.headers.get("Content-Type", "")
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                raise
            time.sleep(2)


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(IMG_DIR, exist_ok=True)

    print("1/2  Récupération des articles…")
    raw, _ = get(BLOG + "/feeds/posts/default?alt=json&max-results=500")
    feed = json.loads(raw)
    entries = feed["feed"].get("entry", [])
    posts = []
    for e in entries:
        posts.append({
            "title": e["title"]["$t"],
            "published": e["published"]["$t"],
            "updated": e.get("updated", {}).get("$t", ""),
            "url": next(l["href"] for l in e["link"] if l["rel"] == "alternate"),
            "labels": [c["term"] for c in e.get("category", [])],
            "html": e["content"]["$t"],
            "thumb": e.get("media$thumbnail", {}).get("url", ""),
        })
    print(f"     {len(posts)} articles trouvés.")

    print("2/2  Téléchargement des images…")
    urls = set()
    pat = re.compile(r'(?:src|href)="(https?://[^"]+?\.(?:jpe?g|png|gif|webp)(?:\?[^"]*)?|https?://(?:blogger\.googleusercontent\.com|\d\.bp\.blogspot\.com)/[^"]+)"', re.I)
    for p in posts:
        urls.update(pat.findall(p["html"]))
        if p["thumb"]:
            urls.add(p["thumb"])
    mapping, fails = {}, []
    for n, u in enumerate(sorted(urls), 1):
        h = hashlib.sha1(u.encode()).hexdigest()[:16]
        try:
            data, ctype = get(u)
            ext = ".png" if "png" in ctype else ".webp" if "webp" in ctype else ".gif" if "gif" in ctype else ".jpg"
            if not ctype.startswith("image/"):
                fails.append(u)
                continue
            name = h + ext
            with open(os.path.join(IMG_DIR, name), "wb") as f:
                f.write(data)
            mapping[u] = name
        except Exception as e:  # noqa: BLE001
            fails.append(u)
        if n % 20 == 0:
            print(f"     {n}/{len(urls)} images…")

    with open(os.path.join(OUT, "posts.json"), "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False)
    with open(os.path.join(OUT, "images.json"), "w", encoding="utf-8") as f:
        json.dump({"map": mapping, "fails": fails}, f, ensure_ascii=False, indent=1)

    print()
    print(f"TERMINÉ : {len(posts)} articles, {len(mapping)} images téléchargées, {len(fails)} échec(s).")
    print("Tu peux maintenant écrire « fait » à Claude.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print("ERREUR :", e)
        sys.exit(1)
