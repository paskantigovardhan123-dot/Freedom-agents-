"""YouTube Clone - Streaming Video Server & Catalog API."""
import os
import sys
import json
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("YOUTUBE_PORT", 5000))
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

SAMPLE_VIDEOS = [
    {
        "id": "vid-1",
        "title": "Building Autonomous AI Coding Agents with Ollama & Jetpack Compose",
        "channel": "Freedom AI Studio",
        "subscribers": "240K",
        "views": "184,200 views",
        "timestamp": "2 days ago",
        "duration": "14:28",
        "category": "AI & Tech",
        "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=640&q=80",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "description": "Step-by-step masterclass on architecting local offline multi-agent software development teams with zero data leakage.",
        "likes": 8420,
        "comments": [
            {"user": "Alex Chen", "avatar": "A", "time": "1 day ago", "text": "This privacy-first approach is exactly what the industry needs!"},
            {"user": "Sarah Dev", "avatar": "S", "time": "8 hours ago", "text": "The Jetpack Compose companion app integration is super slick."}
        ]
    },
    {
        "id": "vid-2",
        "title": "Tears of Steel - 4K Sci-Fi Open Source Visual Effects Showcase",
        "channel": "Blender Foundation",
        "subscribers": "1.8M",
        "views": "920,400 views",
        "timestamp": "1 week ago",
        "duration": "12:14",
        "category": "Sci-Fi",
        "thumbnail": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=640&q=80",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "description": "Explore the dystopian futuristic open-source short film combining VFX, live action, and open cinematography.",
        "likes": 34100,
        "comments": [
            {"user": "VFX Artist", "avatar": "V", "time": "5 days ago", "text": "The tracking and camera stabilization in Blender is insane."},
            {"user": "CinemaLover", "avatar": "C", "time": "2 days ago", "text": "Still one of the greatest open-source cinematic feats."}
        ]
    },
    {
        "id": "vid-3",
        "title": "Jetpack Compose M3 Masterclass: Adaptive Architecture for 2026",
        "channel": "Android Developers",
        "subscribers": "1.2M",
        "views": "452,100 views",
        "timestamp": "3 weeks ago",
        "duration": "22:45",
        "category": "Mobile Dev",
        "thumbnail": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&q=80",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "description": "Deep dive into Material 3, WindowSizeClass, dynamic theming, and ExoPlayer Media3 video integration in modern Android.",
        "likes": 19400,
        "comments": [
            {"user": "KotlinDev", "avatar": "K", "time": "2 weeks ago", "text": "The ViewModel + StateFlow patterns shown here are textbook perfect."}
        ]
    },
    {
        "id": "vid-4",
        "title": "Sintel: The Dragon Hunt - Open Movie Project",
        "channel": "Durian Studio",
        "subscribers": "940K",
        "views": "3,410,000 views",
        "timestamp": "1 year ago",
        "duration": "15:22",
        "category": "Animation",
        "thumbnail": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=640&q=80",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        "description": "The legendary fantasy animated short film about friendship, devotion, and courage in a sweeping mythological world.",
        "likes": 142000,
        "comments": [
            {"user": "EpicGamer", "avatar": "E", "time": "6 months ago", "text": "The emotional punch of the ending never fades."}
        ]
    },
    {
        "id": "vid-5",
        "title": "Designing Ultra-Fast Reactive Web Applications in 2026",
        "channel": "FullStack Weekly",
        "subscribers": "310K",
        "views": "78,900 views",
        "timestamp": "4 days ago",
        "duration": "18:10",
        "category": "Coding",
        "thumbnail": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640&q=80",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "description": "How to achieve 60fps buttery smooth UI animations, dark mode themes, and instant client-side video playback.",
        "likes": 4820,
        "comments": [
            {"user": "FrontendNinja", "avatar": "F", "time": "2 days ago", "text": "Pure CSS grid + responsive flexbox is truly undefeated."}
        ]
    },
    {
        "id": "vid-6",
        "title": "Cosmos Laundromat - First Cycle Open Movie",
        "channel": "Gooseberry Project",
        "subscribers": "580K",
        "views": "1,240,000 views",
        "timestamp": "2 years ago",
        "duration": "12:08",
        "category": "Animation",
        "thumbnail": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&q=80",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        "description": "On a desolate island, a suicidal sheep named Franck meets a quirky salesman who offers him the gift of a lifetime.",
        "likes": 68000,
        "comments": [
            {"user": "ArtLover", "avatar": "A", "time": "1 year ago", "text": "The fur and lighting tech developed for this project was groundbreaking."}
        ]
    }
]

class YouTubeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/videos":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(SAMPLE_VIDEOS).encode("utf-8"))
            return

        if path.startswith("/api/videos/"):
            vid_id = path.split("/")[-1]
            video = next((v for v in SAMPLE_VIDEOS if v["id"] == vid_id), None)
            if video:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(video).encode("utf-8"))
            else:
                self.send_error(404, "Video not found")
            return

        if path == "/api/search":
            qs = urllib.parse.parse_qs(parsed.query)
            query = qs.get("q", [""])[0].lower()
            filtered = [
                v for v in SAMPLE_VIDEOS
                if query in v["title"].lower() or query in v["channel"].lower() or query in v["category"].lower()
            ]
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(filtered).encode("utf-8"))
            return

        # Serve static files (HTML, CSS, JS)
        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if "/like" in path:
            parts = path.split("/")
            vid_id = parts[3] if len(parts) > 3 else ""
            video = next((v for v in SAMPLE_VIDEOS if v["id"] == vid_id), None)
            if video:
                video["likes"] += 1
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "likes": video["likes"]}).encode("utf-8"))
                return
            self.send_error(404)
            return

        if "/comment" in path:
            parts = path.split("/")
            vid_id = parts[3] if len(parts) > 3 else ""
            video = next((v for v in SAMPLE_VIDEOS if v["id"] == vid_id), None)
            if video:
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len).decode("utf-8")
                try:
                    payload = json.loads(body)
                    text = payload.get("text", "").strip()
                    if text:
                        new_c = {"user": "You", "avatar": "Y", "time": "Just now", "text": text}
                        video["comments"].insert(0, new_c)
                        self.send_response(200)
                        self.send_header("Content-Type", "application/json")
                        self.send_header("Access-Control-Allow-Origin", "*")
                        self.end_headers()
                        self.wfile.write(json.dumps({"success": True, "comment": new_c}).encode("utf-8"))
                        return
                except Exception:
                    pass
            self.send_error(400)
            return

        self.send_error(404)

def main():
    print("=" * 60)
    print("  FREEDOM TUBE: YOUTUBE STREAMING APPLICATION")
    print(f"  URL: http://127.0.0.1:{PORT}")
    print("=" * 60)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), YouTubeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down server.")

if __name__ == "__main__":
    main()
