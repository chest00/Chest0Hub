from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from functools import partial
import hashlib
import http.client
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest


ROOT = Path(__file__).resolve().parent.parent

PUBLIC_PAGES = [
    ROOT / "index.html",
    *sorted((ROOT / "pages").glob("*.html")),
]

ACTIVE_JSON = {
    "profile.json",
    "social.json",
    "products.json",
    "books.json",
    "projects.json",
    "blog.json",
}

DORMANT_JSON = {
    "links.json",
    "navigation.json",
    "settings.json",
}


class HtmlInspector(HTMLParser):

    def __init__(self):
        super().__init__()
        self.references = []
        self.ids = []


    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)

        if "id" in attributes:
            self.ids.append(attributes["id"])

        for key in ("href", "src"):
            if key in attributes:
                self.references.append(
                    attributes[key]
                )


class QuietPublicHandler(SimpleHTTPRequestHandler):

    def log_message(self, format, *args):
        pass


def load_admin_module():
    specification = (
        importlib.util.spec_from_file_location(
            "chest0hub_admin_server_test",
            ROOT / "admin" / "server.py"
        )
    )
    module = importlib.util.module_from_spec(
        specification
    )
    specification.loader.exec_module(module)
    return module


def sha256(path):
    return hashlib.sha256(
        path.read_bytes()
    ).hexdigest()


class Chest0HubTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.admin_module = load_admin_module()
        cls.handler = cls.admin_module.AdminHandler.__new__(
            cls.admin_module.AdminHandler
        )


    def test_01_nine_json_files_are_valid(self):
        files = sorted(
            (ROOT / "data").glob("*.json")
        )
        self.assertEqual(len(files), 9)

        for path in files:
            with self.subTest(path=path.name):
                json.loads(
                    path.read_text(encoding="utf-8")
                )


    def test_02_active_json_are_public_and_administrable(self):
        engine = (
            ROOT / "assets/js/data-engine.js"
        ).read_text(encoding="utf-8")
        admin_js = (
            ROOT / "admin/static/admin.js"
        ).read_text(encoding="utf-8")

        for file_name in ACTIVE_JSON:
            with self.subTest(file=file_name):
                self.assertIn(file_name, engine)
                self.assertIn(file_name, admin_js)
                self.assertIn(
                    file_name,
                    self.admin_module.ALLOWED_DATA_FILES
                )

        public_effect_markers = {
            "profile.json": "renderProfile",
            "social.json": "social-description",
            "products.json": "item.featured",
            "books.json": "[data-books-author]",
            "projects.json": "project-card",
            "blog.json": "[data-blog]",
        }

        for file_name, marker in (
            public_effect_markers.items()
        ):
            with self.subTest(effect=file_name):
                self.assertIn(marker, engine)


    def test_03_dormant_json_are_not_presented_in_admin(self):
        admin_js = (
            ROOT / "admin/static/admin.js"
        ).read_text(encoding="utf-8")

        for file_name in DORMANT_JSON:
            with self.subTest(file=file_name):
                self.assertNotIn(file_name, admin_js)
                self.assertNotIn(
                    file_name,
                    self.admin_module.ALLOWED_DATA_FILES
                )


    def test_04_profile_has_public_bindings(self):
        combined_html = "\n".join(
            path.read_text(encoding="utf-8")
            for path in PUBLIC_PAGES
        )

        for field in (
            "brand",
            "authorName",
            "siteName",
            "tagline",
            "description",
            "email",
            "copyright",
            "logo",
            "avatar",
        ):
            with self.subTest(field=field):
                self.assertRegex(
                    combined_html,
                    rf'data-profile(?:-link|-image)?="{field}"'
                )


    def test_05_current_admin_json_pass_validation(self):
        for file_name in ACTIVE_JSON:
            payload = json.loads(
                (ROOT / "data" / file_name)
                .read_text(encoding="utf-8")
            )

            with self.subTest(file=file_name):
                self.assertIsNone(
                    self.handler.validate_data_shape(
                        file_name,
                        payload
                    )
                )


    def test_06_incompatible_admin_json_is_rejected(self):
        profile = json.loads(
            (ROOT / "data/profile.json")
            .read_text(encoding="utf-8")
        )
        del profile["brand"]

        self.assertIsNotNone(
            self.handler.validate_data_shape(
                "profile.json",
                profile
            )
        )
        self.assertIsNotNone(
            self.handler.validate_data_shape(
                "products.json",
                {"not": "a list"}
            )
        )

        products = json.loads(
            (ROOT / "data/products.json")
            .read_text(encoding="utf-8")
        )
        products[1]["id"] = products[0]["id"]
        self.assertIsNotNone(
            self.handler.validate_data_shape(
                "products.json",
                products
            )
        )

        products = json.loads(
            (ROOT / "data/products.json")
            .read_text(encoding="utf-8")
        )
        products[0]["image"] = "../private.png"
        self.assertIsNotNone(
            self.handler.validate_data_shape(
                "products.json",
                products
            )
        )

        social = json.loads(
            (ROOT / "data/social.json")
            .read_text(encoding="utf-8")
        )
        social[0]["url"] = "javascript:alert(1)"
        self.assertIsNotNone(
            self.handler.validate_data_shape(
                "social.json",
                social
            )
        )


    def test_07_admin_http_protections_and_safe_writes(self):
        module = self.admin_module

        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory) / "repository"
            shutil.copytree(
                ROOT,
                project,
                ignore=shutil.ignore_patterns(
                    ".git",
                    "backups",
                    "__pycache__"
                )
            )

            module.PROJECT_DIR = project
            module.DATA_DIR = project / "data"
            module.BACKUP_DIR = project / "backups/admin"
            module.STATIC_DIR = project / "admin/static"
            module.TEMPLATES_DIR = project / "admin/templates"

            original_ecosystem_manager = module.ECOSYSTEM_MANAGER

            class StubEcosystemManager:
                def __init__(self):
                    self.actions = []

                def statuses(self):
                    return [{
                        "id": "chest0-quiz-studio", "label": "Chest0 Quiz Studio",
                        "version": "1.1.0", "head": "12345678", "port": 8501,
                        "url": "http://127.0.0.1:8501", "state": "arrêté",
                        "owned": False, "message": "Application prête à être lancée.",
                    }]

                def start(self, identifier):
                    self.actions.append(("start", identifier))
                    return {**self.statuses()[0], "state": "opérationnel", "owned": True}

                def stop(self, identifier):
                    self.actions.append(("stop", identifier))
                    return self.statuses()[0]

            stub_ecosystem = StubEcosystemManager()
            module.ECOSYSTEM_MANAGER = stub_ecosystem

            server = module.ThreadingHTTPServer(
                ("127.0.0.1", 0),
                module.AdminHandler
            )
            thread = threading.Thread(
                target=server.serve_forever,
                daemon=True
            )
            thread.start()

            port = server.server_address[1]

            def request(
                method,
                path,
                body=None,
                headers=None
            ):
                connection = http.client.HTTPConnection(
                    "127.0.0.1",
                    port,
                    timeout=5
                )
                request_headers = {
                    "Host": "127.0.0.1:8090",
                    **(headers or {}),
                }
                connection.request(
                    method,
                    path,
                    body=body,
                    headers=request_headers
                )
                response = connection.getresponse()
                content = response.read()
                connection.close()
                return response.status, content

            try:
                status, content = request(
                    "GET",
                    "/api/status"
                )
                self.assertEqual(status, 200)
                status_payload = json.loads(content)
                csrf_token = status_payload["csrfToken"]
                self.assertNotIn("project", status_payload)

                status, content = request("GET", "/api/ecosystem/status")
                self.assertEqual(status, 200)
                self.assertNotIn(str(project), content.decode("utf-8"))

                action_body = json.dumps({
                    "applicationId": "chest0-quiz-studio"
                }).encode("utf-8")
                status, _ = request(
                    "POST", "/api/ecosystem/start", body=action_body,
                    headers={
                        "Content-Type": "application/json",
                        "Origin": "http://127.0.0.1:8090",
                        "X-CSRF-Token": csrf_token,
                    },
                )
                self.assertEqual(status, 200)
                self.assertEqual(stub_ecosystem.actions, [("start", "chest0-quiz-studio")])

                status, _ = request(
                    "GET",
                    "/api/status",
                    headers={"Host": "attacker.example"}
                )
                self.assertEqual(status, 403)

                status, _ = request(
                    "GET",
                    "/api/status",
                    headers={
                        "Origin":
                            "https://attacker.example"
                    }
                )
                self.assertEqual(status, 403)

                status, _ = request(
                    "GET",
                    "/project-assets/%2e%2e/data/profile.json"
                )
                self.assertEqual(status, 403)

                profile_path = project / "data/profile.json"
                original_hash = sha256(profile_path)

                status, _ = request(
                    "POST",
                    "/api/save/profile.json",
                    body=b'{"brand":"incomplet"}',
                    headers={
                        "Content-Type": "application/json",
                        "Origin": "http://127.0.0.1:8090",
                    }
                )
                self.assertEqual(status, 403)
                self.assertEqual(sha256(profile_path), original_hash)

                status, _ = request(
                    "POST",
                    "/api/save/profile.json",
                    body=b'{"brand":"incomplet"}',
                    headers={
                        "Content-Type": "application/json",
                        "Origin": "http://127.0.0.1:8090",
                        "X-CSRF-Token": csrf_token,
                    }
                )
                self.assertEqual(status, 400)
                self.assertEqual(
                    sha256(profile_path),
                    original_hash
                )
                self.assertFalse(
                    module.BACKUP_DIR.exists()
                )

                valid_payload = profile_path.read_bytes()
                status, _ = request(
                    "POST",
                    "/api/save/profile.json",
                    body=valid_payload,
                    headers={
                        "Content-Type": "application/json",
                        "Origin": "http://127.0.0.1:8090",
                        "X-CSRF-Token": csrf_token,
                    }
                )
                self.assertEqual(status, 200)
                self.assertEqual(
                    sha256(profile_path),
                    original_hash
                )
                self.assertEqual(
                    len(list(
                        module.BACKUP_DIR.glob(
                            "profile_*.json"
                        )
                    )),
                    1
                )

            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)
                module.ECOSYSTEM_MANAGER = original_ecosystem_manager


    def test_08_seven_pages_and_internal_references(self):
        self.assertEqual(len(PUBLIC_PAGES), 7)

        for page in PUBLIC_PAGES:
            inspector = HtmlInspector()
            inspector.feed(
                page.read_text(encoding="utf-8")
            )

            with self.subTest(page=page.name):
                self.assertEqual(
                    len(inspector.ids),
                    len(set(inspector.ids))
                )

                for reference in inspector.references:
                    url = urlsplit(reference)

                    if (
                        url.scheme
                        or reference.startswith(
                            ("#", "data:")
                        )
                        or not url.path
                    ):
                        continue

                    target = (
                        page.parent / url.path
                    ).resolve()
                    self.assertTrue(
                        target.exists(),
                        f"Référence absente : {reference}"
                    )


    def test_09_service_worker_shell_exists(self):
        source = (ROOT / "sw.js").read_text(
            encoding="utf-8"
        )
        shell = source.split(
            "const APP_SHELL = [",
            1
        )[1].split("];", 1)[0]
        references = re.findall(
            r'"(\./[^"]+)"',
            shell
        )

        for reference in references:
            if reference == "./":
                continue
            self.assertTrue(
                (ROOT / reference[2:]).exists(),
                reference
            )


    def test_10_bloc3_guards_remain_present(self):
        service_worker = (
            ROOT / "sw.js"
        ).read_text(encoding="utf-8")
        development_script = (
            ROOT / "run_dev.sh"
        ).read_text(encoding="utf-8")
        admin_server = (
            ROOT / "admin/server.py"
        ).read_text(encoding="utf-8")

        self.assertIn("CACHE_PREFIX", service_worker)
        self.assertIn(
            "cacheName.startsWith",
            service_worker
        )
        self.assertIn(
            "--bind 127.0.0.1",
            development_script
        )
        self.assertIn('HOST = "127.0.0.1"', admin_server)
        self.assertIn("ALLOWED_HOST_HEADERS", admin_server)
        self.assertIn("ALLOWED_ORIGINS", admin_server)


    def test_11_historical_script_is_blocked_by_default(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "finalize_sprint1.py"
            shutil.copy2(
                ROOT / "scripts/finalize_sprint1.py",
                target
            )
            before = sha256(target)
            result = subprocess.run(
                [sys.executable, str(target)],
                cwd=directory,
                capture_output=True,
                text=True,
                check=False
            )

            self.assertEqual(result.returncode, 2)
            self.assertEqual(sha256(target), before)
            self.assertFalse(
                (Path(directory) / "backups").exists()
            )


    def test_12_javascript_static_check(self):
        deno = shutil.which("deno")
        self.assertIsNotNone(
            deno,
            "Deno est nécessaire au contrôle JavaScript."
        )

        with tempfile.TemporaryDirectory() as cache:
            environment = {
                **os.environ,
                "DENO_DIR": cache,
            }
            subprocess.run(
                [
                    deno,
                    "check",
                    "--no-config",
                    "assets/js/app.js",
                    "assets/js/data-engine.js",
                    "admin/static/admin.js",
                    "sw.js",
                    "tests/test_data_engine.js",
                    "tests/test_service_worker.js",
                ],
                cwd=ROOT,
                env=environment,
                check=True,
                capture_output=True,
                text=True
            )


    def test_13_no_secret_or_credential(self):
        expression = re.compile(
            r"(gh[pousr]_[A-Za-z0-9_]{20,}"
            r"|sk-[A-Za-z0-9_-]{20,}"
            r"|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)"
        )

        for path in ROOT.rglob("*"):
            if (
                not path.is_file()
                or ".git" in path.parts
                or "backups" in path.parts
                or path.suffix.lower() in {
                    ".png",
                    ".jpg",
                    ".jpeg",
                    ".webp",
                }
            ):
                continue

            with self.subTest(path=path):
                content = path.read_text(
                    encoding="utf-8",
                    errors="ignore"
                )
                self.assertIsNone(
                    expression.search(content)
                )


    def test_14_git_diff_check(self):
        subprocess.run(
            ["git", "diff", "--check"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True
        )


    def test_15_public_site_is_served_on_loopback(self):
        handler = partial(
            QuietPublicHandler,
            directory=str(ROOT)
        )
        server = ThreadingHTTPServer(
            ("127.0.0.1", 0),
            handler
        )
        thread = threading.Thread(
            target=server.serve_forever,
            daemon=True
        )
        thread.start()
        port = server.server_address[1]
        required_paths = [
            "/index.html",
            *[
                f"/pages/{path.name}"
                for path in PUBLIC_PAGES[1:]
            ],
            "/assets/css/style.css",
            "/assets/js/app.js",
            "/assets/js/data-engine.js",
            "/manifest.webmanifest",
            "/sw.js",
            *[
                f"/data/{path.name}"
                for path in sorted(
                    (ROOT / "data").glob("*.json")
                )
            ],
        ]

        try:
            for path in required_paths:
                with self.subTest(path=path):
                    connection = http.client.HTTPConnection(
                        "127.0.0.1",
                        port,
                        timeout=5
                    )
                    connection.request("GET", path)
                    response = connection.getresponse()
                    response.read()
                    connection.close()
                    self.assertEqual(response.status, 200)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)
            self.assertFalse(thread.is_alive())


    def test_16_manifest_is_valid_and_references_exist(self):
        manifest = json.loads(
            (ROOT / "manifest.webmanifest").read_text(
                encoding="utf-8"
            )
        )

        for field in (
            "name",
            "short_name",
            "start_url",
            "scope",
            "display",
            "icons",
        ):
            with self.subTest(field=field):
                self.assertIn(field, manifest)

        self.assertIsInstance(manifest["icons"], list)
        self.assertTrue(manifest["icons"])

        for icon in manifest["icons"]:
            with self.subTest(icon=icon.get("src")):
                self.assertTrue(
                    (ROOT / icon["src"]).exists()
                )


    def test_17_dormant_json_status_is_documented(self):
        documentation = "\n".join(
            [
                (ROOT / "README.md").read_text(
                    encoding="utf-8"
                ),
                (ROOT / "docs/ARCHITECTURE.md").read_text(
                    encoding="utf-8"
                ),
            ]
        )

        for file_name in DORMANT_JSON:
            with self.subTest(file=file_name):
                self.assertIn(file_name, documentation)

        self.assertIn("dormant", documentation.lower())


    def test_18_publication_scope_excludes_internal_files(self):
        configuration = (
            ROOT / "_config.yml"
        ).read_text(encoding="utf-8")
        excluded = set(
            re.findall(
                r"^\s+-\s+(.+?)\s*$",
                configuration,
                flags=re.MULTILINE
            )
        )
        expected_internal_paths = {
            "admin",
            "backups",
            "docs",
            "scripts",
            "tests",
            "README.md",
            "CHANGELOG.md",
            "run_admin.sh",
            "run_dev.sh",
            *{
                f"data/{file_name}"
                for file_name in DORMANT_JSON
            },
        }

        self.assertTrue(
            expected_internal_paths.issubset(excluded)
        )

        service_worker = (
            ROOT / "sw.js"
        ).read_text(encoding="utf-8")
        shell = service_worker.split(
            "const APP_SHELL = [",
            1
        )[1].split("];", 1)[0]

        for file_name in DORMANT_JSON:
            with self.subTest(file=file_name):
                self.assertNotIn(file_name, shell)

        for page in PUBLIC_PAGES:
            with self.subTest(page=page.name):
                self.assertNotIn(
                    "admin/",
                    page.read_text(encoding="utf-8")
                )


    def test_19_active_release_versions_are_consistent(self):
        expected_version = "1.3.0"

        admin_server = (
            ROOT / "admin/server.py"
        ).read_text(encoding="utf-8")
        service_worker = (
            ROOT / "sw.js"
        ).read_text(encoding="utf-8")
        readme = (
            ROOT / "README.md"
        ).read_text(encoding="utf-8")
        changelog = (
            ROOT / "CHANGELOG.md"
        ).read_text(encoding="utf-8")
        projects = json.loads(
            (ROOT / "data/projects.json").read_text(
                encoding="utf-8"
            )
        )
        chest0_hub = next(
            item
            for item in projects
            if item["id"] == "chest0-hub"
        )

        self.assertIn(
            f'"version": "{expected_version}"',
            admin_server
        )
        self.assertIn(
            f"`${{CACHE_PREFIX}}v{expected_version}`",
            service_worker
        )
        self.assertIn(
            f"Chest0 Hub Admin — V{expected_version}",
            readme
        )
        self.assertRegex(
            changelog,
            rf"(?m)^## Version {re.escape(expected_version)}\b"
        )
        self.assertIn(
            f"Version actuelle : V{expected_version}.",
            chest0_hub["description"]
        )
        self.assertNotIn("1.0.0-dev", admin_server)



    def test_20_public_pages_have_complete_core_seo(self):
        expected_urls = {
            "index.html": "https://chest0.fr/",
            "apropos.html": "https://chest0.fr/pages/apropos.html",
            "blog.html": "https://chest0.fr/pages/blog.html",
            "contact.html": "https://chest0.fr/pages/contact.html",
            "livres.html": "https://chest0.fr/pages/livres.html",
            "produits.html": "https://chest0.fr/pages/produits.html",
            "projets.html": "https://chest0.fr/pages/projets.html",
        }
        for page in PUBLIC_PAGES:
            with self.subTest(page=page.name):
                text = page.read_text(encoding="utf-8")
                expected_url = expected_urls[page.name]
                self.assertIn(
                    f'<link rel="canonical" href="{expected_url}">',
                    text
                )
                self.assertIn(
                    f'<meta property="og:url" content="{expected_url}">',
                    text
                )
                for marker in (
                    'property="og:title"',
                    'property="og:description"',
                    'property="og:type"',
                    'property="og:site_name"',
                    'property="og:locale"',
                    'name="twitter:card"',
                    'name="twitter:title"',
                    'name="twitter:description"',
                    'type="application/ld+json"',
                ):
                    self.assertIn(marker, text)
                self.assertNotIn(
                    "https://chest00.github.io/Chest0Hub/",
                    text
                )

    def test_21_sitemap_robots_and_404_are_consistent(self):
        sitemap = (ROOT / "sitemap.xml").read_text(
            encoding="utf-8"
        )
        robots = (ROOT / "robots.txt").read_text(
            encoding="utf-8"
        )
        not_found = (ROOT / "404.html").read_text(
            encoding="utf-8"
        )
        expected_urls = {
            "https://chest0.fr/",
            "https://chest0.fr/pages/apropos.html",
            "https://chest0.fr/pages/blog.html",
            "https://chest0.fr/pages/contact.html",
            "https://chest0.fr/pages/livres.html",
            "https://chest0.fr/pages/produits.html",
            "https://chest0.fr/pages/projets.html",
        }
        for url in expected_urls:
            with self.subTest(url=url):
                self.assertIn(f"<loc>{url}</loc>", sitemap)
        self.assertEqual(sitemap.count("<url>"), 7)
        self.assertIn(
            "Sitemap: https://chest0.fr/sitemap.xml",
            robots
        )
        self.assertIn("User-agent: *", robots)
        self.assertIn("Allow: /", robots)
        self.assertIn(
            'name="robots" content="noindex, follow"',
            not_found
        )
        self.assertIn('href="/"', not_found)

    def test_22_public_chest0_hub_url_uses_custom_domain(self):
        projects = json.loads(
            (ROOT / "data/projects.json").read_text(
                encoding="utf-8"
            )
        )
        chest0_hub = next(
            item
            for item in projects
            if item["id"] == "chest0-hub"
        )
        self.assertEqual(
            chest0_hub["url"],
            "https://chest0.fr/"
        )
        readme = (ROOT / "README.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("https://chest0.fr/", readme)
        self.assertNotIn(
            "https://chest00.github.io/Chest0Hub/",
            readme
        )


    def test_23_indexnow_key_is_publishable(self):
        key_files = list(ROOT.glob("*.txt"))
        indexnow_keys = [
            path
            for path in key_files
            if len(path.stem) == 32
            and path.stem.isalnum()
        ]
        self.assertEqual(len(indexnow_keys), 1)

        key_file = indexnow_keys[0]
        key = key_file.read_text(encoding="utf-8").strip()

        self.assertEqual(key_file.stem, key)
        self.assertEqual(len(key), 32)
        self.assertTrue(key.isalnum())

        config = (ROOT / "_config.yml").read_text(
            encoding="utf-8"
        )
        self.assertNotIn(key_file.name, config)

        sitemap = (ROOT / "sitemap.xml").read_text(
            encoding="utf-8"
        )
        self.assertNotIn(key_file.name, sitemap)

    def test_24_indexnow_script_has_safety_guards(self):
        script_path = ROOT / "scripts/indexnow.py"
        self.assertTrue(script_path.is_file())

        script = script_path.read_text(encoding="utf-8")

        for marker in (
            'HOST = "chest0.fr"',
            'BASE_URL = f"https://{HOST}"',
            'ENDPOINT = "https://api.indexnow.org/indexnow"',
            'MAX_URLS = 10_000',
            'parsed.scheme != "https"',
            'parsed.hostname != HOST',
            'parsed.fragment',
            '"--dry-run"',
            '"keyLocation": KEY_LOCATION',
            '"urlList": prepare_urls(urls)',
            'status == 200',
            'status == 202',
            '400: "requête invalide"',
            '403: "clé invalide ou non autorisée"',
            '422: "URL ou clé incompatible avec l\'hôte"',
            '429: "trop de requêtes"',
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, script)



if __name__ == "__main__":
    unittest.main(verbosity=2)
