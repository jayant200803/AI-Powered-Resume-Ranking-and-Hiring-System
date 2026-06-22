# app/config.py
from dotenv import load_dotenv
load_dotenv()

import os

# MongoDB
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/hiring_system")
MONGODB_DB = os.environ.get("MONGODB_DB", "hiring_system")

# TF-IDF / Ranking tuning
TFIDF_MAX_FEATURES = int(os.environ.get("TFIDF_MAX_FEATURES", 5000))
TFIDF_NGRAM = (1, 2)
SKILL_BOOST_WEIGHT = float(os.environ.get("SKILL_BOOST_WEIGHT", 0.20))
TOP_K = int(os.environ.get("TOP_K", 10))

# CORS / Frontend
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

# Node.js API server URL (used for resume links in HTML report)
NODE_SERVER_URL = os.environ.get("NODE_SERVER_URL", "http://localhost:5000")
