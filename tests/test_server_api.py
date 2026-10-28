import json
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen
import unittest

from server_app import ROOT, create_server


class MediaApiTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = TemporaryDirectory()
        self.store_path = Path(self.temporary_directory.name)
        self.server, self.admin_pin = create_server(
            host="127.0.0.1",
            port=0,
            root=ROOT,
            store_dir=self.store_path,
            admin_pin="TEST1234",
        )
        self.base_url = f"http://127.0.0.1:{self.server.server_address[1]}"
        self.origin = self.base_url
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temporary_directory.cleanup()

    def request(self, path, method="GET", body=None, headers=None):
        request = Request(f"{self.base_url}{path}", data=body, method=method, headers=headers or {})
        try:
            with urlopen(request) as response:
                return response.status, response.headers, response.read()
        except HTTPError as error:
            with error:
                return error.code, error.headers, error.read()

    def test_upload_requires_admin_pin_and_persists_media(self):
        section = "makeup"
        video_bytes = b"\x00\x00\x00\x18ftypisomvideo-data"
        status, _, _ = self.request(
            f"/api/videos?section={section}&name=look.mp4",
            method="POST",
            body=video_bytes,
            headers={"Content-Type": "video/mp4", "Origin": self.origin},
        )
        self.assertEqual(status, 401)

        status, _, body = self.request(
            f"/api/videos?section={section}&name=look.mp4",
            method="POST",
            body=video_bytes,
            headers={
                "Authorization": f"Bearer {self.admin_pin}",
                "Content-Type": "video/mp4",
                "Origin": self.origin,
            },
        )
        self.assertEqual(status, 201)
        video = json.loads(body)["video"]
        self.assertEqual(video["name"], "look.mp4")

        status, _, body = self.request(f"/api/videos?section={section}")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)["videos"][0]["id"], video["id"])

        status, _, body = self.request(video["url"])
        self.assertEqual(status, 200)
        self.assertEqual(body, video_bytes)

        status, headers, body = self.request(
            video["url"], headers={"Range": "bytes=1-3"}
        )
        self.assertEqual(status, 206)
        self.assertEqual(headers["Content-Range"], "bytes 1-3/22")
        self.assertEqual(body, video_bytes[1:4])

        status, _, _ = self.request(
            f"/api/videos/{video['id']}",
            method="DELETE",
            headers={"Authorization": f"Bearer {self.admin_pin}", "Origin": self.origin},
        )
        self.assertEqual(status, 200)
        self.assertFalse((self.store_path / "videos" / f"{video['id']}.mp4").exists())

    def test_rejects_unknown_section_and_unsupported_video(self):
        headers = {
            "Authorization": f"Bearer {self.admin_pin}",
            "Content-Type": "video/mp4",
            "Origin": self.origin,
        }
        status, _, _ = self.request(
            "/api/videos?section=unknown&name=look.mp4",
            method="POST",
            body=b"\x00\x00\x00\x18ftypisomvideo-data",
            headers=headers,
        )
        self.assertEqual(status, 400)

        status, _, _ = self.request(
            f"/api/videos?section=makeup&name={quote('script.html')}",
            method="POST",
            body=b"<script>",
            headers=headers,
        )
        self.assertEqual(status, 415)

        status, _, _ = self.request(
            "/api/videos?section=makeup&name=not-a-video.mp4",
            method="POST",
            body=b"not a video file",
            headers=headers,
        )
        self.assertEqual(status, 415)

    def test_write_requests_require_local_origin_and_rate_limit_bad_pins(self):
        path = "/api/videos?section=makeup&name=look.mp4"
        status, _, _ = self.request(
            path,
            method="POST",
            body=b"\x00\x00\x00\x18ftypisom",
            headers={
                "Authorization": f"Bearer {self.admin_pin}",
                "Content-Type": "video/mp4",
            },
        )
        self.assertEqual(status, 403)

        headers = {
            "Authorization": "Bearer WRONG",
            "Content-Type": "video/mp4",
            "Origin": self.origin,
        }
        for _ in range(5):
            status, _, _ = self.request(
                path, method="POST", body=b"\x00\x00\x00\x18ftypisom", headers=headers
            )
            self.assertEqual(status, 401)
        status, _, _ = self.request(
            path, method="POST", body=b"\x00\x00\x00\x18ftypisom", headers=headers
        )
        self.assertEqual(status, 429)

    def test_static_server_hides_project_and_test_files(self):
        status, headers, body = self.request("/")
        self.assertEqual(status, 200)
        self.assertIn(b"Beauty Tech", body)
        self.assertEqual(headers["X-Frame-Options"], "DENY")
        self.assertIn("frame-ancestors 'none'", headers["Content-Security-Policy"])

        for path in ("/server_app.py", "/iniciar_demo.py", "/tests/test_server_api.py", "/.git/config"):
            with self.subTest(path=path):
                status, _, _ = self.request(path)
                self.assertEqual(status, 404)


if __name__ == "__main__":
    unittest.main()
