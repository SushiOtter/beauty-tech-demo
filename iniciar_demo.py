"""Arranque de Beauty Tech en la red local, con almacenamiento persistente."""

from threading import Timer
from urllib.parse import urlsplit
import webbrowser
import os

from server_app import create_server, local_network_ip


try:
    server, admin_pin = create_server()
except (OSError, ValueError) as error:
    raise SystemExit(
        f"No se pudo iniciar Beauty Tech: {error}\n"
        "Comprueba que el puerto 8000 esté libre y que el certificado HTTPS esté bien configurado."
    ) from error

port = server.server_address[1]
scheme = "https" if server.is_tls else "http"
local_url = f"{scheme}://127.0.0.1:{port}/"
network_url = f"{scheme}://{local_network_ip()}:{port}/"
tablet_url = os.environ.get("BEAUTY_TECH_TABLET_URL", "").strip()
if tablet_url:
    parsed_tablet_url = urlsplit(tablet_url)
    if (
        parsed_tablet_url.scheme != scheme
        or not parsed_tablet_url.netloc
        or parsed_tablet_url.path not in ("", "/")
        or parsed_tablet_url.query
        or parsed_tablet_url.fragment
        or parsed_tablet_url.username
        or parsed_tablet_url.password
    ):
        server.server_close()
        raise SystemExit(
            "BEAUTY_TECH_TABLET_URL debe ser una URL de origen válida y usar "
            f"{scheme.upper()} como el servidor."
        )
    network_url = tablet_url.rstrip("/") + "/"
print("=" * 62)
print(" BEAUTY TECH · SERVIDOR LOCAL DE TIENDA")
print("=" * 62)
print(f"En este PC:       {local_url}")
print(f"En tablets Wi-Fi: {network_url}")
if server.is_tls:
    print("HTTPS activo con el certificado configurado.")
elif os.environ.get("BEAUTY_TECH_TLS_CERT") or os.environ.get("BEAUTY_TECH_TLS_KEY"):
    print("HTTPS no se pudo habilitar; revisa certificado y clave.")
else:
    print("AVISO: modo HTTP de demostración. La cámara en tablets requiere HTTPS.")
print(f"Código admin:     {admin_pin}")
print("Guarda el código: se renueva cada vez que se reinicia el servidor.")
print("Los vídeos se guardan en la carpeta local de datos de Beauty Tech.")
print("Mantén esta ventana abierta. Para detenerlo, pulsa Ctrl+C.\n")
Timer(0.8, lambda: webbrowser.open(local_url)).start()

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nCerrando el servidor de Beauty Tech...")
finally:
    server.server_close()
