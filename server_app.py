"""Local network server and persistent media store for the Beauty Tech demo."""

from __future__ import annotations

from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlsplit
import hmac
import ipaddress
import json
import os
import re
import secrets
import socket
import sqlite3
import ssl
import stat
import threading
import time
import uuid


ROOT = Path(__file__).resolve().parent
MAX_UPLOAD_BYTES = 500 * 1024 * 1024
GLOBAL_VIDEO_SECTION_ID = "global"
ALLOWED_EXTENSIONS = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogv": "video/ogg",
    ".ogg": "video/ogg",
}
AUTH_FAILURES: dict[str, list[float]] = {}
AUTH_FAILURES_LOCK = threading.Lock()
AUTH_FAILURE_WINDOW_SECONDS = 60
AUTH_FAILURE_LIMIT = 5


@contextmanager
def store_connection(data_dir: Path):
    connection = sqlite3.connect(data_dir / "beauty-tech.sqlite3")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def default_data_dir() -> Path:
    configured = os.environ.get("BEAUTY_TECH_DATA_DIR")
    if configured:
        return Path(configured).expanduser().resolve()
    if os.name == "nt":
        return Path(os.environ.get("LOCALAPPDATA") or Path.home()) / "BeautyTech"
    return Path.home() / ".local" / "share" / "beauty-tech"


def initialize_store(data_dir: Path) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "videos").mkdir(exist_ok=True)
    with store_connection(data_dir) as connection:
        connection.execute(
            """CREATE TABLE IF NOT EXISTS videos (
                id TEXT PRIMARY KEY,
                section_id TEXT NOT NULL,
                name TEXT NOT NULL,
                filename TEXT NOT NULL UNIQUE,
                mime_type TEXT NOT NULL,
                size INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"""
        )


def load_section_ids(root: Path) -> set[str]:
    with (root / "data" / "contenido.json").open(encoding="utf-8") as file:
        data = json.load(file)
    return {GLOBAL_VIDEO_SECTION_ID} | {
        station["id"]
        for station in data.get("stations", [])
        if isinstance(station.get("id"), str)
        and re.fullmatch(r"[a-z0-9-]{1,48}", station["id"])
    }


class BeautyTechHandler(SimpleHTTPRequestHandler):
    server_version = "BeautyTechDemo/1.0"
    store_dir = default_data_dir()
    admin_pin = ""
    section_ids: set[str] = set()
    public_directories = {"assets", "css", "data", "js", "models", "vendor"}

    def translate_path(self, path: str) -> str:
        root = Path(self.directory).resolve()
        translated = Path(super().translate_path(path)).resolve()
        try:
            relative = translated.relative_to(root)
        except ValueError:
            return str(root / "__not_found__")
        if relative in (Path("."), Path("index.html")):
            return str(translated)
        if relative.parts and relative.parts[0] in self.public_directories:
            if relative.parts[0] != "data" or relative == Path("data/contenido.json"):
                return str(translated)
        return str(root / "__not_found__")

    def list_directory(self, path: str):
        self.send_error(404)
        return None

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(self), microphone=()")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Content-Security-Policy", (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; media-src 'self' https://*.supabase.co; "
            "connect-src 'self' https://*.supabase.co; font-src 'self'; "
            "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
        ))
        if getattr(self.server, "is_tls", False):
            self.send_header("Strict-Transport-Security", "max-age=31536000")
        route = urlsplit(self.path).path
        if not route.startswith("/media/"):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        print("[HTTP] " + (fmt % args))

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorized(self) -> bool:
        if not self.is_local_admin_request():
            return False
        client = str(self.client_address[0])
        now = time.monotonic()
        supplied = self.headers.get("Authorization", "")
        scheme, _, value = supplied.partition(" ")
        if scheme.lower() == "bearer" and hmac.compare_digest(value, self.admin_pin):
            with AUTH_FAILURES_LOCK:
                AUTH_FAILURES.pop(client, None)
            return True
        with AUTH_FAILURES_LOCK:
            AUTH_FAILURES.setdefault(client, []).append(now)
        return False

    def is_local_admin_request(self) -> bool:
        try:
            peer_is_local = ipaddress.ip_address(self.client_address[0]).is_loopback
            origin = urlsplit(self.headers.get("Origin", ""))
            origin_host = (origin.hostname or "").casefold()
            origin_ip = ipaddress.ip_address(origin_host) if origin_host else None
            origin_is_local = origin_host == "localhost" or bool(origin_ip and origin_ip.is_loopback)
        except ValueError:
            return False
        return (
            peer_is_local
            and origin_is_local
            and origin.scheme in {"http", "https"}
            and origin.netloc.casefold() == self.headers.get("Host", "").casefold()
        )

    def require_admin(self) -> bool:
        if not self.is_local_admin_request():
            self.send_json(403, {
                "error": "Por seguridad, las cargas y eliminaciones solo se permiten desde el PC del servidor."
            })
            return False
        client = str(self.client_address[0])
        now = time.monotonic()
        with AUTH_FAILURES_LOCK:
            recent = [
                attempt for attempt in AUTH_FAILURES.get(client, [])
                if now - attempt < AUTH_FAILURE_WINDOW_SECONDS
            ]
            AUTH_FAILURES[client] = recent
            blocked = len(recent) >= AUTH_FAILURE_LIMIT
        if blocked:
            self.send_json(429, {
                "error": "Demasiados intentos. Espera un minuto antes de volver a probar."
            })
            return False
        if self.authorized():
            return True
        self.send_json(401, {"error": "Código de administración incorrecto o ausente."})
        return False

    def do_GET(self) -> None:
        route = urlsplit(self.path)
        if route.path == "/api/videos":
            section_id = parse_qs(route.query).get("section", [""])[0]
            if section_id not in self.section_ids:
                self.send_json(400, {"error": "La sección indicada no existe."})
                return
            with store_connection(self.store_dir) as connection:
                connection.row_factory = sqlite3.Row
                rows = connection.execute(
                    "SELECT id, section_id, name, mime_type, size, created_at "
                    "FROM videos WHERE section_id = ? ORDER BY rowid",
                    (section_id,),
                ).fetchall()
            self.send_json(200, {
                "videos": [
                    {
                        **dict(row),
                        "url": f"/media/{quote(row['id'])}",
                    }
                    for row in rows
                ]
            })
            return
        if route.path.startswith("/media/"):
            self.serve_media(route.path.removeprefix("/media/"))
            return
        super().do_GET()

    def do_POST(self) -> None:
        route = urlsplit(self.path)
        if route.path != "/api/videos":
            self.send_json(404, {"error": "Ruta no encontrada."})
            return
        if not self.require_admin():
            return

        query = parse_qs(route.query)
        section_id = query.get("section", [""])[0]
        if section_id not in self.section_ids:
            self.send_json(400, {"error": "La sección indicada no existe."})
            return
        raw_name = query.get("name", [""])[0]
        name = self.safe_video_name(raw_name)
        if not name:
            self.send_json(400, {"error": "El archivo debe tener un nombre válido."})
            return
        extension = Path(name).suffix.lower()
        mime_type = ALLOWED_EXTENSIONS.get(extension)
        if not mime_type:
            self.send_json(415, {"error": "Formato no admitido. Usa MP4, WebM u Ogg."})
            return
        content_type = self.headers.get_content_type()
        if content_type not in (mime_type, "application/octet-stream"):
            self.send_json(415, {"error": "El tipo de archivo no coincide con su extensión."})
            return
        try:
            size = int(self.headers.get("Content-Length", ""))
        except ValueError:
            size = 0
        if size <= 0 or size > MAX_UPLOAD_BYTES:
            self.send_json(413, {"error": "El vídeo debe pesar entre 1 byte y 500 MB."})
            return

        video_id = uuid.uuid4().hex
        filename = f"{video_id}{extension}"
        videos_dir = self.store_dir / "videos"
        temporary_path = videos_dir / f".{video_id}.upload"
        final_path = videos_dir / filename
        received = 0
        try:
            with temporary_path.open("xb") as output:
                while received < size:
                    chunk = self.rfile.read(min(1024 * 1024, size - received))
                    if not chunk:
                        raise OSError("La carga terminó antes de tiempo.")
                    output.write(chunk)
                    received += len(chunk)
            if not self.valid_video_signature(temporary_path, extension):
                temporary_path.unlink(missing_ok=True)
                self.send_json(415, {"error": "El archivo no parece contener un vídeo válido."})
                return
            os.replace(temporary_path, final_path)
            with store_connection(self.store_dir) as connection:
                connection.execute(
                    "INSERT INTO videos(id, section_id, name, filename, mime_type, size) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (video_id, section_id, name, filename, mime_type, received),
                )
            self.send_json(201, {
                "video": {
                    "id": video_id,
                    "section_id": section_id,
                    "name": name,
                    "mime_type": mime_type,
                    "size": received,
                    "url": f"/media/{video_id}",
                }
            })
        except (OSError, sqlite3.Error) as error:
            temporary_path.unlink(missing_ok=True)
            final_path.unlink(missing_ok=True)
            print(f"[ERROR] No se pudo guardar el vídeo: {error}")
            self.send_json(500, {"error": "No se pudo guardar el vídeo en el PC."})

    def do_DELETE(self) -> None:
        route = urlsplit(self.path)
        if not route.path.startswith("/api/videos/"):
            self.send_json(404, {"error": "Ruta no encontrada."})
            return
        if not self.require_admin():
            return
        video_id = route.path.removeprefix("/api/videos/")
        if not re.fullmatch(r"[0-9a-f]{32}", video_id):
            self.send_json(400, {"error": "Identificador de vídeo no válido."})
            return
        with store_connection(self.store_dir) as connection:
            row = connection.execute(
                "SELECT filename FROM videos WHERE id = ?", (video_id,)
            ).fetchone()
            if not row:
                self.send_json(404, {"error": "El vídeo ya no existe."})
                return
            try:
                (self.store_dir / "videos" / row[0]).unlink(missing_ok=True)
            except OSError as error:
                print(f"[ERROR] No se pudo eliminar el archivo de vídeo: {error}")
                self.send_json(500, {"error": "No se pudo eliminar el archivo del PC."})
                return
            connection.execute("DELETE FROM videos WHERE id = ?", (video_id,))
        self.send_json(200, {"deleted": video_id})

    @staticmethod
    def safe_video_name(raw_name: str) -> str:
        name = Path(unquote(raw_name).replace("\\", "/")).name
        name = "".join(character for character in name if character.isprintable())
        name = name.strip()[:180]
        return name if name and name not in {".", ".."} else ""

    @staticmethod
    def valid_video_signature(path: Path, extension: str) -> bool:
        with path.open("rb") as file:
            header = file.read(32)
        if extension == ".mp4":
            return b"ftyp" in header[4:16]
        if extension == ".webm":
            return header.startswith(b"\x1a\x45\xdf\xa3")
        if extension in {".ogv", ".ogg"}:
            return header.startswith(b"OggS")
        return False

    def serve_media(self, video_id: str) -> None:
        if not re.fullmatch(r"[0-9a-f]{32}", video_id):
            self.send_error(404)
            return
        with store_connection(self.store_dir) as connection:
            row = connection.execute(
                "SELECT filename, mime_type FROM videos WHERE id = ?", (video_id,)
            ).fetchone()
        if not row:
            self.send_error(404)
            return
        path = self.store_dir / "videos" / row[0]
        try:
            file = path.open("rb")
        except OSError:
            self.send_error(404)
            return
        file_stat = os.fstat(file.fileno())
        if not stat.S_ISREG(file_stat.st_mode):
            file.close()
            self.send_error(404)
            return

        range_header = self.headers.get("Range")
        byte_range = None
        if range_header:
            unit, separator, value = range_header.partition("=")
            if separator == "=" and unit.strip().lower() == "bytes" and "," not in value:
                try:
                    first, last = value.strip().split("-", 1)
                    if first:
                        start = int(first)
                        end = int(last) if last else file_stat.st_size - 1
                    else:
                        suffix_length = int(last)
                        if suffix_length <= 0:
                            raise ValueError
                        start = max(0, file_stat.st_size - suffix_length)
                        end = file_stat.st_size - 1
                    if start < 0 or start >= file_stat.st_size or start > end:
                        raise ValueError
                    byte_range = (start, min(end, file_stat.st_size - 1))
                except ValueError:
                    file.close()
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{file_stat.st_size}")
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return

        if byte_range:
            start, end = byte_range
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_stat.st_size}")
            self.send_header("Content-Length", str(end - start + 1))
            self._range_to_send = byte_range
        else:
            self.send_response(200)
            self.send_header("Content-Length", str(file_stat.st_size))
            self._range_to_send = None
        self.send_header("Content-Type", row[1])
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.send_header("Last-Modified", self.date_time_string(file_stat.st_mtime))
        self.end_headers()
        try:
            if self._range_to_send:
                start, end = self._range_to_send
                file.seek(start)
                remaining = end - start + 1
            else:
                remaining = file_stat.st_size
            while remaining:
                chunk = file.read(min(64 * 1024, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            self.log_message("client closed the video stream")
        finally:
            file.close()


def create_server(
    host: str = "0.0.0.0",
    port: int = 8000,
    root: Path = ROOT,
    store_dir: Path | None = None,
    admin_pin: str | None = None,
) -> tuple[ThreadingHTTPServer, str]:
    data_dir = (store_dir or default_data_dir()).resolve()
    initialize_store(data_dir)
    pin = admin_pin or secrets.token_hex(16).upper()
    sections = load_section_ids(root)

    class ConfiguredHandler(BeautyTechHandler):
        store_dir = data_dir
        admin_pin = pin
        section_ids = sections

        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

    certificate = os.environ.get("BEAUTY_TECH_TLS_CERT")
    private_key = os.environ.get("BEAUTY_TECH_TLS_KEY")
    if bool(certificate) != bool(private_key):
        raise ValueError("Configura tanto BEAUTY_TECH_TLS_CERT como BEAUTY_TECH_TLS_KEY.")
    context = None
    if certificate and private_key:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.load_cert_chain(certificate, private_key)
    server = ThreadingHTTPServer((host, port), ConfiguredHandler)
    server.daemon_threads = True
    if context:
        server.socket = context.wrap_socket(server.socket, server_side=True)
        server.is_tls = True
    else:
        server.is_tls = False
    return server, pin


def local_network_ip() -> str:
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("192.0.2.1", 80))
        return probe.getsockname()[0]
    except OSError:
        return "IP_LOCAL_DEL_PC"
    finally:
        probe.close()
