from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote
from datetime import datetime
import json
import shutil
import tempfile


HOST = "127.0.0.1"
PORT = 8090

ADMIN_DIR = Path(__file__).resolve().parent
PROJECT_DIR = ADMIN_DIR.parent

TEMPLATES_DIR = ADMIN_DIR / "templates"
STATIC_DIR = ADMIN_DIR / "static"
DATA_DIR = PROJECT_DIR / "data"
BACKUP_DIR = PROJECT_DIR / "backups" / "admin"


CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


ALLOWED_DATA_FILES = {
    "profile.json",
    "social.json",
    "products.json",
    "books.json",
    "projects.json",
    "blog.json",
}


MAX_REQUEST_SIZE = 2 * 1024 * 1024


class AdminHandler(BaseHTTPRequestHandler):

    def do_GET(self):

        path = unquote(
            self.path.split("?", 1)[0]
        )

        if path in ("/", "/index.html"):

            self.send_file(
                TEMPLATES_DIR / "index.html"
            )
            return

        if path.startswith("/static/"):

            relative_path = path.removeprefix(
                "/static/"
            )

            target = (
                STATIC_DIR / relative_path
            ).resolve()

            try:
                target.relative_to(
                    STATIC_DIR.resolve()
                )
            except ValueError:
                self.send_error(
                    403,
                    "Accès interdit"
                )
                return

            self.send_file(target)
            return

        if path == "/api/status":

            self.send_json(
                {
                    "application": "Chest0 Hub Admin",
                    "version": "1.0.0-dev",
                    "status": "ok",
                    "project": str(PROJECT_DIR),
                    "mode": "local",
                }
            )
            return

        if path == "/api/data":

            self.send_json(
                self.load_all_data()
            )
            return

        self.send_error(
            404,
            "Ressource introuvable"
        )


    def do_POST(self):

        path = unquote(
            self.path.split("?", 1)[0]
        )

        prefix = "/api/save/"

        if not path.startswith(prefix):

            self.send_json(
                {
                    "ok": False,
                    "error": "Route inconnue."
                },
                status=404
            )
            return

        file_name = path.removeprefix(
            prefix
        )

        if file_name not in ALLOWED_DATA_FILES:

            self.send_json(
                {
                    "ok": False,
                    "error": "Fichier non autorisé."
                },
                status=403
            )
            return

        self.save_data_file(
            file_name
        )


    def load_all_data(self):

        result = {}

        for file_name in sorted(
            ALLOWED_DATA_FILES
        ):

            path = DATA_DIR / file_name

            try:

                with path.open(
                    encoding="utf-8"
                ) as file:

                    result[file_name] = (
                        json.load(file)
                    )

            except Exception as error:

                result[file_name] = {
                    "error": str(error)
                }

        return result


    def save_data_file(
        self,
        file_name
    ):

        content_length = self.headers.get(
            "Content-Length"
        )

        try:

            content_length = int(
                content_length or "0"
            )

        except ValueError:

            self.send_json(
                {
                    "ok": False,
                    "error": "Taille de requête invalide."
                },
                status=400
            )
            return


        if (
            content_length <= 0
            or content_length > MAX_REQUEST_SIZE
        ):

            self.send_json(
                {
                    "ok": False,
                    "error":
                        "Requête vide ou trop volumineuse."
                },
                status=400
            )
            return


        try:

            raw_body = self.rfile.read(
                content_length
            )

            payload = json.loads(
                raw_body.decode("utf-8")
            )

        except Exception as error:

            self.send_json(
                {
                    "ok": False,
                    "error":
                        f"JSON reçu invalide : {error}"
                },
                status=400
            )
            return


        validation_error = (
            self.validate_data_shape(
                file_name,
                payload
            )
        )


        if validation_error:

            self.send_json(
                {
                    "ok": False,
                    "error": validation_error
                },
                status=400
            )
            return


        target = DATA_DIR / file_name


        if not target.exists():

            self.send_json(
                {
                    "ok": False,
                    "error":
                        "Le fichier source n'existe pas."
                },
                status=404
            )
            return


        try:

            backup_path = (
                self.create_backup(
                    target
                )
            )


            self.atomic_json_write(
                target,
                payload
            )


            self.send_json(
                {
                    "ok": True,
                    "file": file_name,
                    "backup":
                        str(
                            backup_path.relative_to(
                                PROJECT_DIR
                            )
                        ),
                    "message":
                        "Enregistrement effectué."
                }
            )


        except Exception as error:

            self.send_json(
                {
                    "ok": False,
                    "error":
                        f"Échec de l'enregistrement : {error}"
                },
                status=500
            )


    def validate_data_shape(
        self,
        file_name,
        payload
    ):

        list_files = {
            "social.json",
            "products.json",
            "projects.json",
        }


        object_files = {
            "profile.json",
            "books.json",
            "blog.json",
        }


        if (
            file_name in list_files
            and not isinstance(
                payload,
                list
            )
        ):

            return (
                f"{file_name} doit contenir "
                "une liste JSON."
            )


        if (
            file_name in object_files
            and not isinstance(
                payload,
                dict
            )
        ):

            return (
                f"{file_name} doit contenir "
                "un objet JSON."
            )


        if file_name == "books.json":

            items = payload.get(
                "items"
            )

            if not isinstance(
                items,
                list
            ):

                return (
                    "books.json doit contenir "
                    "un champ items de type liste."
                )


        if file_name == "blog.json":

            articles = payload.get(
                "articles"
            )

            if not isinstance(
                articles,
                list
            ):

                return (
                    "blog.json doit contenir "
                    "un champ articles de type liste."
                )


        return None


    def create_backup(
        self,
        target
    ):

        BACKUP_DIR.mkdir(
            parents=True,
            exist_ok=True
        )


        timestamp = datetime.now().strftime(
            "%Y-%m-%d_%H-%M-%S-%f"
        )


        backup_name = (
            f"{target.stem}_"
            f"{timestamp}"
            f"{target.suffix}"
        )


        backup_path = (
            BACKUP_DIR / backup_name
        )


        shutil.copy2(
            target,
            backup_path
        )


        return backup_path


    def atomic_json_write(
        self,
        target,
        payload
    ):

        serialized = json.dumps(
            payload,
            ensure_ascii=False,
            indent=2
        ) + "\n"


        temporary_path = None


        try:

            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=target.parent,
                prefix=f".{target.stem}_",
                suffix=".tmp",
                delete=False
            ) as temporary_file:

                temporary_file.write(
                    serialized
                )

                temporary_file.flush()

                temporary_path = Path(
                    temporary_file.name
                )


            with temporary_path.open(
                encoding="utf-8"
            ) as file:

                json.load(file)


            temporary_path.replace(
                target
            )


        finally:

            if (
                temporary_path
                and temporary_path.exists()
            ):

                temporary_path.unlink()


    def send_file(
        self,
        path: Path
    ):

        if (
            not path.exists()
            or not path.is_file()
        ):

            self.send_error(
                404,
                "Fichier introuvable"
            )
            return


        content_type = (
            CONTENT_TYPES.get(
                path.suffix.lower(),
                "application/octet-stream"
            )
        )


        try:

            content = path.read_bytes()

        except OSError:

            self.send_error(
                500,
                "Impossible de lire le fichier"
            )
            return


        self.send_response(200)

        self.send_header(
            "Content-Type",
            content_type
        )

        self.send_header(
            "Content-Length",
            str(len(content))
        )

        self.send_security_headers()

        self.end_headers()

        self.wfile.write(content)


    def send_json(
        self,
        data,
        status=200
    ):

        content = json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ).encode("utf-8")


        self.send_response(
            status
        )

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Content-Length",
            str(len(content))
        )

        self.send_security_headers()

        self.end_headers()

        self.wfile.write(content)


    def send_security_headers(self):

        self.send_header(
            "Cache-Control",
            "no-store"
        )

        self.send_header(
            "X-Content-Type-Options",
            "nosniff"
        )

        self.send_header(
            "X-Frame-Options",
            "DENY"
        )

        self.send_header(
            "Referrer-Policy",
            "no-referrer"
        )


    def log_message(
        self,
        format_string,
        *args
    ):

        message = (
            format_string % args
        )

        print(
            f"[Chest0 Admin] "
            f"{self.address_string()} "
            f"{message}"
        )


def main():

    BACKUP_DIR.mkdir(
        parents=True,
        exist_ok=True
    )


    server = ThreadingHTTPServer(
        (HOST, PORT),
        AdminHandler
    )


    print()
    print(
        "======================================"
    )
    print(
        "       Chest0 Hub Admin"
    )
    print(
        "======================================"
    )
    print()
    print(
        "Interface locale :"
    )
    print(
        f"http://{HOST}:{PORT}"
    )
    print()
    print(
        "Sauvegardes automatiques :"
    )
    print(
        str(
            BACKUP_DIR.relative_to(
                PROJECT_DIR
            )
        )
    )
    print()
    print(
        "Pour arrêter :"
    )
    print(
        "Control + C"
    )
    print()
    print(
        "======================================"
    )
    print()


    try:

        server.serve_forever()

    except KeyboardInterrupt:

        print()
        print(
            "Arrêt de Chest0 Hub Admin..."
        )

    finally:

        server.server_close()

        print(
            "Chest0 Hub Admin arrêté."
        )


if __name__ == "__main__":
    main()