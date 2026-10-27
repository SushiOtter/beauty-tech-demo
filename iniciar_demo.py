"""Arranque robusto de Beauty Tech sin Node ni dependencias externas."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import socket
import stat
import threading
import time
import webbrowser

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

class QuietHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self._range_to_send = None
        range_header = self.headers.get("Range")
        if not range_header:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.isfile(path):
            return super().send_head()

        try:
            file = open(path, "rb")
        except OSError:
            return super().send_head()

        file_stat = os.fstat(file.fileno())
        if not stat.S_ISREG(file_stat.st_mode):
            file.close()
            return super().send_head()

        last_modified = self.date_time_string(file_stat.st_mtime)
        if_range = self.headers.get("If-Range")
        if if_range and if_range != last_modified:
            file.close()
            return super().send_head()

        unit, separator, range_value = range_header.partition("=")
        if separator != "=" or unit.strip().lower() != "bytes" or "," in range_value:
            file.close()
            return super().send_head()

        try:
            first, last = range_value.strip().split("-", 1)
            if first:
                start = int(first)
                end = int(last) if last else file_stat.st_size - 1
            else:
                suffix_length = int(last)
                if suffix_length <= 0:
                    raise ValueError
                start = max(0, file_stat.st_size - suffix_length)
                end = file_stat.st_size - 1
        except ValueError:
            file.close()
            return super().send_head()

        if start < 0 or start >= file_stat.st_size or start > end:
            file.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{file_stat.st_size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        end = min(end, file_stat.st_size - 1)
        self._range_to_send = (start, end)
        self.send_response(206)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{file_stat.st_size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", last_modified)
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        return file

    def copyfile(self, source, outputfile):
        byte_range = self._range_to_send
        try:
            if byte_range is None:
                return super().copyfile(source, outputfile)

            start, end = byte_range
            source.seek(start)
            remaining = end - start + 1
            while remaining:
                chunk = source.read(min(64 * 1024, remaining))
                if not chunk:
                    break
                outputfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            self.log_message("client closed the connection during file transfer")

    def log_message(self, fmt, *args):
        print("[HTTP] " + (fmt % args))

try:
    server = ThreadingHTTPServer(("127.0.0.1", 8000), QuietHandler)
except OSError:
    server = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)

port = server.server_address[1]
url = f"http://127.0.0.1:{port}/"
print("=" * 58)
print(" BEAUTY TECH · DEMO LOCAL")
print("=" * 58)
print(f"Carpeta: {ROOT}")
print(f"Abre:    {url}")
print("Deja esta ventana abierta mientras utilizas la demo.")
print("Para detener el servidor, pulsa Ctrl+C.\n")
threading.Timer(0.8, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nCerrando el servidor de Beauty Tech...")
finally:
    server.server_close()
