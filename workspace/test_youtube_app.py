import unittest
import json
from app import SAMPLE_VIDEOS

class TestYouTubeApp(unittest.TestCase):
    def test_sample_videos_loaded(self):
        self.assertGreaterEqual(len(SAMPLE_VIDEOS), 4)

    def test_video_fields(self):
        for v in SAMPLE_VIDEOS:
            self.assertIn("id", v)
            self.assertIn("title", v)
            self.assertIn("videoUrl", v)
            self.assertIn("channel", v)
            self.assertTrue(v["videoUrl"].startswith("http"))

    def test_video_comments(self):
        v = SAMPLE_VIDEOS[0]
        self.assertIn("comments", v)
        self.assertIsInstance(v["comments"], list)

    def test_search_logic(self):
        query = "compose"
        results = [v for v in SAMPLE_VIDEOS if query in v["title"].lower()]
        self.assertGreater(len(results), 0)

if __name__ == "__main__":
    unittest.main()
