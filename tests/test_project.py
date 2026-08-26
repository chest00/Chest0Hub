from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
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
                status, _ = request(
                    "GET",
                    "/api/status"
                )
                self.assertEqual(status, 200)

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
