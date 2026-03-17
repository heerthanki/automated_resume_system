from dotenv import load_dotenv
import os

load_dotenv()

GROQ_API_KEY        = os.getenv("GROQ_API_KEY")
GROQ_MODEL          = os.getenv("GROQ_MODEL", "llama3-8b-8192")

MONGODB_URL         = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB          = os.getenv("MONGODB_DB", "talentos")

REDIS_URL           = os.getenv("REDIS_URL", "redis://localhost:6379")

SHORTLIST_THRESHOLD = int(os.getenv("SHORTLIST_THRESHOLD", 70))

# Scoring weights (must sum to 100)
SCORE_WEIGHTS = {
    "skills_match":      40,
    "experience_match":  30,
    "education":         15,
    "domain_relevance":  15,
}