"""Génère les pages des calculateurs de pass à partir de template.html."""
import html
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "dist"
BASE = "https://chest0.fr/outils/pass-annuel/"
ANALYTICS_TOKEN = "da47366b38854facbcf7a561aade9a47"  # Cloudflare Web Analytics (chest0.fr)

PAGES = {
    "disney": dict(slug="disneyland", tab="Disneyland Paris",
        title="Pass annuel Disneyland Paris : rentable ou pas ? Calculateur 2026",
        desc="Bronze, Silver ou Gold : le pass annuel Disneyland Paris est-il rentable pour votre famille ? Nombre de visites, période, parking, RER : le calcul en 1 minute.",
        h1="Pass annuel Disneyland Paris : est-ce rentable pour vous ?",
        lead="Indiquez combien vous êtes et combien de fois vous comptez venir. Le calcul compare billets datés et pass Bronze, Silver et Gold, parking compris.",
        og="Pass Disneyland : rentable ou pas ?"),
    "asterix": dict(slug="parc-asterix", tab="Parc Astérix",
        title="Pass Saison Parc Astérix : rentable ou pas ? Calculateur 2026",
        desc="Pass Découverte, Gaulois ou Premium : le Pass Saison du Parc Astérix est-il rentable pour votre famille ? Visites, Billet Futé, parking, transports : le calcul en 1 minute.",
        h1="Pass Saison Parc Astérix : est-ce rentable pour vous ?",
        lead="Indiquez combien vous êtes et combien de fois vous comptez venir. Le calcul compare Billet Futé, Liberté Flex et Pass Saison, parking compris.",
        og="Pass Astérix : rentable ou pas ?"),
    "beauval": dict(slug="beauval", tab="ZooParc de Beauval",
        title="ZooPass Beauval : rentable ou pas ? Calculateur 2026",
        desc="Le ZooPass du ZooParc de Beauval est-il rentable pour votre famille ? Comparez avec les billets à la journée selon le nombre de visites : le calcul en 1 minute.",
        h1="ZooPass Beauval : est-ce rentable pour vous ?",
        lead="Indiquez combien vous êtes et combien de fois vous comptez venir. Le calcul compare billets 1 jour et ZooPass annuel.",
        og="ZooPass Beauval : rentable ou pas ?"),
    "musees": dict(slug="paris-museum-pass", tab="Paris Museum Pass",
        title="Paris Museum Pass : rentable ou pas ? Calculateur 2026",
        desc="Louvre, Orsay, Versailles, Sainte-Chapelle… Le Paris Museum Pass 2, 4 ou 6 jours est-il rentable pour vous ? Gratuité des jeunes et tarifs hors UE inclus.",
        h1="Paris Museum Pass : est-ce rentable pour vous ?",
        lead="Cochez les lieux que vous comptez visiter : le calcul compare billets à l'unité et Paris Museum Pass, jeunes gratuits compris.",
        og="Paris Museum Pass : rentable ou pas ?"),
}
FAQ = json.loads((HERE / "faq.json").read_text(encoding="utf-8"))
TEMPLATE = (HERE / "template.html").read_text(encoding="utf-8")
FONT_B = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"


def nb(t):
    return t.replace(" ?", "\u00a0?").replace(" :", "\u00a0:")


def strip_tags(t):
    return re.sub(r"<[^>]+>", "", t)


def og_image(text, path):
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), "#111111")
    d = ImageDraw.Draw(im)
    # billet doré
    x0, y0, x1, y1 = 70, 70, 1130, 520
    d.rounded_rectangle((x0, y0, x1, y1), 36, fill="#d4a72c")
    for cx in (x0, x1):
        d.ellipse((cx - 30, 330 - 30, cx + 30, 330 + 30), fill="#111111")
    d.line((x0 + 50, 330, x1 - 50, 330), fill="#8a6d1c", width=4)
    f_small = ImageFont.truetype(FONT_B, 34, index=0)
    d.text((x0 + 60, y0 + 50), "CALCULATEUR GRATUIT · 2026", font=f_small, fill="#141414")
    size = 80
    while size > 40:
        f = ImageFont.truetype(FONT_B, size, index=0)
        if d.textlength(text, font=f) <= (x1 - x0 - 120):
            break
        size -= 4
    d.text((x0 + 60, y0 + 120), text, font=f, fill="#141414")
    d.text((x0 + 60, 370), "Visites, période, parking, transports :", font=f_small, fill="#141414")
    d.text((x0 + 60, 420), "la réponse en chiffres, en 1 minute.", font=f_small, fill="#141414")
    f_brand = ImageFont.truetype(FONT_B, 40, index=0)
    d.text((x0, 555), "chest0.fr", font=f_brand, fill="#d4a72c")
    im.save(path, "PNG", optimize=True)


def tabs(active):
    out = []
    for k, p in PAGES.items():
        cur = ' aria-current="page"' if k == active else ""
        out.append(f'<a href="../{p["slug"]}/" id="tab-{k}"{cur}>{p["tab"]}</a>')
    return "".join(out)


def analytics():
    if not ANALYTICS_TOKEN:
        return ""
    return ("<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' "
            f"data-cf-beacon='{{\"token\": \"{ANALYTICS_TOKEN}\"}}'></script><!-- End Cloudflare Web Analytics -->")


def page(key):
    p = PAGES[key]
    url = BASE + p["slug"] + "/"
    img = url + "apercu.png"
    og = "\n".join([
        f'<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="Chest0">',
        f'<meta property="og:title" content="{html.escape(p["title"])}">',
        f'<meta property="og:description" content="{html.escape(p["desc"])}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{img}">',
        '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
    ])
    faq_items = FAQ[key]
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": strip_tags(a)}} for q, a in faq_items]}
    jsonld = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>"
    faq_html = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in faq_items)
    s = TEMPLATE
    for k, v in {"PARK": key, "TITLE": html.escape(p["title"]), "DESC": html.escape(p["desc"]), "URL": url,
                 "OG": og, "JSONLD": jsonld, "ANALYTICS": analytics(), "H1": nb(p["h1"]), "LEAD": p["lead"],
                 "TABS": tabs(key), "FAQ": faq_html}.items():
        s = s.replace("{{" + k + "}}", v)
    assert "{{" not in s
    d = OUT / p["slug"]
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(s, encoding="utf-8")
    og_image(p["og"], d / "apercu.png")


def hub():
    cards = "".join(
        f'<a class="card" href="{p["slug"]}/"><span>{p["tab"]}</span><b>{nb(p["og"])}</b><i>Faire le calcul →</i></a>'
        for p in PAGES.values())
    desc = "4 calculateurs gratuits : pass annuel Disneyland Paris, Pass Saison Parc Astérix, ZooPass Beauval et Paris Museum Pass. Rentable ou pas pour votre famille ?"
    s = f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pass annuels : rentable ou pas ? 4 calculateurs gratuits</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{BASE}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Chest0">
<meta property="og:title" content="Pass annuels : rentable ou pas ?"><meta property="og:description" content="{desc}">
<meta property="og:url" content="{BASE}"><meta property="og:image" content="{BASE}apercu.png">
<meta name="twitter:card" content="summary_large_image">
<script>{{const m={{"#disney":"disneyland","#asterix":"parc-asterix","#beauval":"beauval","#musees":"paris-museum-pass"}}[location.hash];if(m)location.replace(m+"/"+location.search);}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap" rel="stylesheet">
<style>
/* VOICE: sommaire clair d'un service conso ; IDEA: un présentoir de billets ; PICTURE: 4 billets dorés ;
   COLOUR: noir Chest0, or #d4a72c ; TYPE/LAYOUT: Manrope, grille de 4 billets */
:root{{color-scheme:light dark;--bg:light-dark(#fbfaf6,#0e0e0e);--ink:light-dark(#141414,#f2efe6)}}
*{{box-sizing:border-box;min-width:0}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 Manrope,system-ui,sans-serif}}
header{{background:#111;color:#f2efe6;padding:clamp(28px,5vw,64px) max(5vw,16px)}}h1{{font-size:clamp(30px,4.6vw,48px);line-height:1.05;margin:0 0 12px;max-width:20ch}}
header p{{color:#cfc9b8;max-width:60ch;margin:0}}main{{padding:clamp(24px,4vw,56px) max(5vw,16px);max-width:1180px;margin:0 auto}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}}
.card{{display:grid;gap:8px;background:#d4a72c;color:#141414;border-radius:18px;padding:24px;text-decoration:none;min-height:180px}}
.card span{{font-size:13px;font-weight:700;opacity:.8}}.card b{{font-size:24px;line-height:1.15}}.card i{{font-style:normal;font-weight:800;align-self:end}}
.card:focus-visible{{outline:3px solid var(--ink);outline-offset:3px}}footer{{padding:0 max(5vw,16px) 40px;max-width:1180px;margin:0 auto;font-size:13px;opacity:.75}}footer a{{color:inherit}}
</style></head><body>
<header><h1>Pass annuels : rentable ou pas pour votre famille ?</h1>
<p>Choisissez votre sortie : le calculateur compare billets et pass selon votre nombre de visites, la période, le parking et les transports.</p></header>
<main><div class="grid">{cards}</div></main>
<footer><p><a href="../">← Tous les outils gratuits Chest0</a></p><p>Outil gratuit et indépendant, édité par Chest0. Prix 2026 relevés le 19 novembre 2026 : vérifiez toujours le prix exact sur le site officiel avant d'acheter.</p></footer>
{analytics()}
</body></html>"""
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.html").write_text(s, encoding="utf-8")
    og_image("Pass annuels : rentable ou pas ?", OUT / "apercu.png")


if __name__ == "__main__":
    for k in PAGES:
        page(k)
    hub()
    print("pages générées dans", OUT)
