from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, parse_qs, urlparse
from datetime import datetime
import ipaddress
import json
import shutil
import tempfile
import hashlib
import re
import unicodedata


HOST = "127.0.0.1"
PORT = 8090

ALLOWED_HOST_HEADERS = {
    "127.0.0.1",
    f"127.0.0.1:{PORT}",
    "localhost",
    f"localhost:{PORT}",
}

ALLOWED_ORIGINS = {
    f"http://127.0.0.1:{PORT}",
    f"http://localhost:{PORT}",
}

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

# MEDIA_UPLOAD_MARKER_V110

MEDIA_DESTINATIONS = {
    "avatar": PROJECT_DIR / "assets" / "images" / "avatar",
    "logo": PROJECT_DIR / "assets" / "icons",
    "product": PROJECT_DIR / "assets" / "images" / "products",
    "book": PROJECT_DIR / "assets" / "images" / "books",
}


MEDIA_LIMITS = {
    "avatar": 5 * 1024 * 1024,
    "logo": 5 * 1024 * 1024,
    "product": 8 * 1024 * 1024,
    "book": 8 * 1024 * 1024,
}


ALLOWED_MEDIA_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}


ALLOWED_MEDIA_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
}



class AdminHandler(BaseHTTPRequestHandler):

    def is_local_request_allowed(self):

        try:

            client_is_loopback = ipaddress.ip_address(
                self.client_address[0]
            ).is_loopback

        except ValueError:

            client_is_loopback = False


        host = self.headers.get(
            "Host",
            ""
        ).strip().lower()


        origin = self.headers.get(
            "Origin"
        )


        origin_is_allowed = (
            origin is None
            or origin in ALLOWED_ORIGINS
        )


        return (
            client_is_loopback
            and host in ALLOWED_HOST_HEADERS
            and origin_is_allowed
        )


    def reject_non_local_request(self):

        self.send_json(
            {
                "ok": False,
                "error": "Accès local uniquement."
            },
            status=403
        )


    def do_GET(self):

        if not self.is_local_request_allowed():

            self.reject_non_local_request()
            return

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

        if path.startswith("/project-assets/"):

            relative_path = path.removeprefix(
                "/project-assets/"
            )

            assets_root = (
                PROJECT_DIR / "assets"
            ).resolve()

            target = (
                assets_root / relative_path
            ).resolve()

            try:

                target.relative_to(
                    assets_root
                )

            except ValueError:

                self.send_error(
                    403,
                    "Accès interdit"
                )
                return

            self.send_file(
                target
            )
            return


        if path == "/api/status":

            self.send_json(
                {
                    "application": "Chest0 Hub Admin",
                    "version": "1.2.0",
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

        if not self.is_local_request_allowed():

            self.reject_non_local_request()
            return

        path = unquote(
            self.path.split("?", 1)[0]
        )

        parsed_url = urlparse(
            self.path
        )

        if parsed_url.path == "/api/media/upload":

            parameters = parse_qs(
                parsed_url.query
            )

            media_kind = (
                parameters.get(
                    "kind",
                    [""]
                )[0]
            )

            original_name = (
                parameters.get(
                    "filename",
                    [""]
                )[0]
            )

            self.upload_media(
                media_kind,
                original_name
            )
            return


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


    def upload_media(
        self,
        media_kind,
        original_name
    ):

        if media_kind not in MEDIA_DESTINATIONS:

            self.send_json(
                {
                    "ok": False,
                    "error":
                        "Catégorie de média non autorisée."
                },
                status=400
            )
            return


        if not original_name:

            self.send_json(
                {
                    "ok": False,
                    "error":
                        "Nom de fichier manquant."
                },
                status=400
            )
            return


        extension = Path(
            original_name
        ).suffix.lower()


        if extension not in ALLOWED_MEDIA_EXTENSIONS:

            self.send_json(
                {
                    "ok": False,
                    "error":
                        "Format non autorisé. "
                        "Formats acceptés : PNG, JPG, JPEG, WEBP."
                },
                status=400
            )
            return


        content_type = (
            self.headers.get(
                "Content-Type",
                ""
            )
            .split(
                ";",
                1
            )[0]
            .strip()
            .lower()
        )


        if content_type not in ALLOWED_MEDIA_TYPES:

            self.send_json(
                {
                    "ok": False,
                    "error":
                        "Type de fichier non autorisé."
                },
                status=400
            )
            return


        try:

            content_length = int(
                self.headers.get(
                    "Content-Length",
                    "0"
                )
            )

        except ValueError:

            self.send_json(
                {
                    "ok": False,
                    "error":
                        "Taille du fichier invalide."
                },
                status=400
            )
            return


        maximum_size = MEDIA_LIMITS[
            media_kind
        ]


        if (
            content_length <= 0
            or content_length > maximum_size
        ):

            maximum_mb = (
                maximum_size
                // (1024 * 1024)
            )

            self.send_json(
                {
                    "ok": False,
                    "error":
                        f"Fichier vide ou supérieur à "
                        f"{maximum_mb} Mo."
                },
                status=400
            )
            return


        content = self.rfile.read(
            content_length
        )


        if not self.is_valid_image_signature(
            extension,
            content
        ):

            self.send_json(
                {
                    "ok": False,
                    "error":
                        "Le contenu du fichier ne correspond "
                        "pas à une image valide."
                },
                status=400
            )
            return


        clean_name = self.build_media_filename(
            original_name,
            content
        )


        destination_dir = MEDIA_DESTINATIONS[
            media_kind
        ]


        destination_dir.mkdir(
            parents=True,
            exist_ok=True
        )


        destination = (
            destination_dir
            / clean_name
        ).resolve()


        try:

            destination.relative_to(
                destination_dir.resolve()
            )

        except ValueError:

            self.send_json(
                {
                    "ok": False,
                    "error":
                        "Chemin de destination non autorisé."
                },
                status=400
            )
            return


        if not destination.exists():

            temporary_path = None

            try:

                with tempfile.NamedTemporaryFile(
                    mode="wb",
                    dir=destination_dir,
                    prefix=".media_",
                    suffix=".tmp",
                    delete=False
                ) as temporary_file:

                    temporary_file.write(
                        content
                    )

                    temporary_file.flush()

                    temporary_path = Path(
                        temporary_file.name
                    )


                temporary_path.replace(
                    destination
                )


            finally:

                if (
                    temporary_path
                    and temporary_path.exists()
                ):

                    temporary_path.unlink()


        relative_path = (
            destination.relative_to(
                PROJECT_DIR
            )
            .as_posix()
        )


        self.send_json(
            {
                "ok": True,
                "kind": media_kind,
                "filename": clean_name,
                "path": relative_path,
                "previewUrl":
                    "/project-assets/"
                    + destination.relative_to(
                        PROJECT_DIR / "assets"
                    ).as_posix(),
                "size": len(content),
                "message":
                    "Image importée avec succès."
            }
        )


    def build_media_filename(
        self,
        original_name,
        content
    ):

        original_path = Path(
            original_name
        )


        extension = (
            original_path.suffix
            .lower()
        )


        base_name = (
            original_path.stem
        )


        normalized = unicodedata.normalize(
            "NFKD",
            base_name
        )


        ascii_name = (
            normalized
            .encode(
                "ascii",
                "ignore"
            )
            .decode(
                "ascii"
            )
        )


        slug = re.sub(
            r"[^a-zA-Z0-9]+",
            "-",
            ascii_name
        )


        slug = (
            slug
            .strip("-")
            .lower()
        )


        if not slug:

            slug = "image"


        digest = hashlib.sha256(
            content
        ).hexdigest()[:8]


        return (
            f"{slug}-{digest}"
            f"{extension}"
        )


    def is_valid_image_signature(
        self,
        extension,
        content
    ):

        if extension == ".png":

            return content.startswith(
                b"\x89PNG\r\n\x1a\n"
            )


        if extension in {
            ".jpg",
            ".jpeg",
        }:

            return (
                len(content) >= 3
                and content[:3]
                == b"\xff\xd8\xff"
            )


        if extension == ".webp":

            return (
                len(content) >= 12
                and content[:4] == b"RIFF"
                and content[8:12] == b"WEBP"
            )


        return False


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


        validation_error = (
            self.validate_required_fields(
                file_name,
                payload
            )
        )


        if validation_error:

            return validation_error


        return None


    def validate_required_fields(
        self,
        file_name,
        payload
    ):

        profile_fields = {
            "brand": (str, False),
            "authorName": (str, False),
            "siteName": (str, False),
            "tagline": (str, False),
            "description": (str, False),
            "email": (str, False),
            "copyright": (str, False),
            "logo": (str, False),
            "avatar": (str, False),
        }


        list_item_fields = {
            "social.json": {
                "id": (str, False),
                "name": (str, False),
                "username": (str, False),
                "url": (str, False),
                "description": (str, False),
                "enabled": (bool, False),
            },
            "products.json": {
                "id": (str, False),
                "name": (str, False),
                "platform": (str, False),
                "description": (str, False),
                "url": (str, True),
                "image": (str, True),
                "featured": (bool, False),
                "enabled": (bool, False),
            },
            "projects.json": {
                "id": (str, False),
                "name": (str, False),
                "status": (str, False),
                "description": (str, False),
                "url": (str, True),
                "enabled": (bool, False),
            },
            "books.json": {
                "id": (str, False),
                "title": (str, False),
                "description": (str, False),
                "amazonUrl": (str, True),
                "cover": (str, True),
                "enabled": (bool, False),
            },
            "blog.json": {
                "id": (str, False),
                "title": (str, False),
                "description": (str, False),
                "url": (str, True),
                "enabled": (bool, False),
            },
        }


        if file_name == "profile.json":

            error = self.validate_object_fields(
                payload,
                profile_fields,
                "profile.json"
            )


            if error:
                return error


            if not re.fullmatch(
                r"[^\s@]+@[^\s@]+\.[^\s@]+",
                payload["email"]
            ):

                return "profile.json contient un email invalide."


            for media_field in (
                "logo",
                "avatar",
            ):

                error = self.validate_media_path(
                    payload[media_field],
                    f"profile.json.{media_field}"
                )


                if error:
                    return error


            return None


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


            error = self.validate_object_fields(
                payload,
                {
                    "author": (str, False),
                    "amazonAuthorPage": (str, False),
                    "items": (list, False),
                },
                "books.json"
            )


            if error:
                return error


            error = self.validate_web_url(
                payload["amazonAuthorPage"],
                "books.json.amazonAuthorPage"
            )


            if error:
                return error


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


            error = self.validate_object_fields(
                payload,
                {
                    "name": (str, False),
                    "platform": (str, False),
                    "url": (str, False),
                    "description": (str, False),
                    "articles": (list, False),
                },
                "blog.json"
            )


            if error:
                return error


            error = self.validate_web_url(
                payload["url"],
                "blog.json.url"
            )


            if error:
                return error


        items = payload


        if file_name == "books.json":
            items = payload["items"]


        if file_name == "blog.json":
            items = payload["articles"]


        fields = list_item_fields.get(
            file_name
        )


        if fields is not None:

            identifiers = set()


            for index, item in enumerate(items):

                context = (
                    f"{file_name}[{index}]"
                )


                if not isinstance(item, dict):

                    return (
                        f"{context} doit contenir "
                        "un objet JSON."
                    )


                error = self.validate_object_fields(
                    item,
                    fields,
                    context
                )


                if error:
                    return error


                identifier = item["id"].strip()


                if identifier in identifiers:

                    return (
                        f"{file_name} contient "
                        f"un identifiant dupliqué : {identifier}."
                    )


                identifiers.add(identifier)


                for url_field in (
                    "url",
                    "amazonUrl",
                ):

                    if (
                        url_field in item
                        and item[url_field]
                    ):

                        error = self.validate_web_url(
                            item[url_field],
                            f"{context}.{url_field}"
                        )


                        if error:
                            return error


                for media_field in (
                    "image",
                    "cover",
                ):

                    if (
                        media_field in item
                        and item[media_field]
                    ):

                        error = self.validate_media_path(
                            item[media_field],
                            f"{context}.{media_field}"
                        )


                        if error:
                            return error


        return None


    def validate_object_fields(
        self,
        payload,
        fields,
        context
    ):

        for field_name, configuration in fields.items():

            expected_type, allow_empty = configuration


            if field_name not in payload:

                return (
                    f"{context} doit contenir "
                    f"le champ {field_name}."
                )


            value = payload[field_name]


            if type(value) is not expected_type:

                return (
                    f"{context}.{field_name} "
                    "a un type incompatible."
                )


            if (
                expected_type is str
                and not allow_empty
                and not value.strip()
            ):

                return (
                    f"{context}.{field_name} "
                    "ne peut pas être vide."
                )


        return None


    def validate_web_url(
        self,
        value,
        context
    ):

        parsed = urlparse(value)


        if (
            parsed.scheme not in {
                "http",
                "https",
            }
            or not parsed.netloc
        ):

            return (
                f"{context} doit contenir "
                "une URL HTTP ou HTTPS valide."
            )


        return None


    def validate_media_path(
        self,
        value,
        context
    ):

        path = Path(value)


        if (
            not value.startswith("assets/")
            or ".." in path.parts
            or path.is_absolute()
        ):

            return (
                f"{context} doit contenir "
                "un chemin relatif dans assets/."
            )


        target = (
            PROJECT_DIR / path
        ).resolve()


        try:

            target.relative_to(
                (PROJECT_DIR / "assets").resolve()
            )

        except ValueError:

            return (
                f"{context} sort du dossier assets/."
            )


        if not target.is_file():

            return (
                f"{context} référence "
                "un média introuvable."
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
