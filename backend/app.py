
from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import sqlite3
import os
import urllib.request
import urllib.error
import json

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DB_PATH = Path(os.getenv("DB_PATH", str(BASE_DIR / "backend" / "eco_smart.db")))

app = Flask(__name__, static_folder=str(FRONTEND_DIR))
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024

def connect_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                location TEXT,
                issue TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS quiz_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                score INTEGER NOT NULL,
                points INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

QUIZ = [
    {
        "question": "Which bin is generally used for fruit and vegetable peels?",
        "options": ["Blue", "Green", "Red", "Black"],
        "answer": 1,
        "explanation": "Organic kitchen waste is generally placed in the green wet-waste bin."
    },
    {
        "question": "Which action helps reduce plastic pollution?",
        "options": ["Use reusable bags", "Burn plastic", "Throw plastic in rivers", "Use more disposable items"],
        "answer": 0,
        "explanation": "Reusable bags reduce the need for single-use plastic."
    },
    {
        "question": "What does the 3R principle mean?",
        "options": ["Read, Run, Rest", "Reduce, Reuse, Recycle", "Repair, Remove, Return", "None"],
        "answer": 1,
        "explanation": "The 3Rs are Reduce, Reuse and Recycle."
    },
    {
        "question": "Which waste should be handled separately?",
        "options": ["Paper", "Food scraps", "Batteries", "Leaves"],
        "answer": 2,
        "explanation": "Batteries require special collection and disposal."
    },
    {
        "question": "Which gas is a major contributor to human-caused climate change?",
        "options": ["Oxygen", "Carbon dioxide", "Helium", "Neon"],
        "answer": 1,
        "explanation": "Carbon dioxide is a major greenhouse gas."
    }
]

CHALLENGES = [
    {"icon": "🌱", "title": "Plant a Tree", "description": "Care for a native plant.", "points": 20},
    {"icon": "♻️", "title": "Recycle Right", "description": "Sort your household waste.", "points": 15},
    {"icon": "🚰", "title": "Save Water", "description": "Avoid wasting clean water.", "points": 10},
    {"icon": "🛍️", "title": "Plastic-Free Day", "description": "Try reusable alternatives.", "points": 15}
]

GUIDES = {
    "organic": "Keep food scraps and garden waste separate. Compost suitable organic waste.",
    "plastic": "Reuse suitable containers and send clean recyclable plastics to an authorised collection point.",
    "paper": "Keep paper clean and dry before recycling.",
    "electronic": "Take electronic waste to an authorised e-waste collection centre. Do not dismantle batteries.",
    "metal": "Separate recyclable metal and use an authorised recycling collection service.",
    "glass": "Keep glass separate and follow local collection instructions. Handle broken glass only with adult help."
}

@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@app.get("/api/health")
def health():
    return jsonify(status="ok", ai_mode="hybrid" if os.getenv("OPENAI_API_KEY") else "local")

@app.get("/api/stats")
def stats():
    with connect_db() as conn:
        reports = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
        attempts = conn.execute("SELECT COUNT(*) FROM quiz_results").fetchone()[0]
        participants = conn.execute("SELECT COUNT(DISTINCT username) FROM quiz_results").fetchone()[0]
        categories = conn.execute(
            "SELECT issue, COUNT(*) AS total FROM reports GROUP BY issue"
        ).fetchall()

    return jsonify(
        reports=reports,
        quiz_attempts=attempts,
        participants=participants,
        categories=[dict(row) for row in categories]
    )

@app.get("/api/guide")
def guide():
    return jsonify(guides=GUIDES)

@app.post("/api/classify")
def classify():
    data = request.get_json(silent=True) or {}
    item = str(data.get("item", "")).strip().lower()[:100]

    if not item:
        return jsonify(error="Enter a waste item first."), 400

    rules = [
        (["banana", "vegetable", "food", "leaves", "fruit", "peel"], "Organic", "Green bin"),
        (["bottle", "plastic", "wrapper", "polythene"], "Plastic", "Dry recyclable collection"),
        (["paper", "cardboard", "newspaper"], "Paper", "Dry recyclable collection"),
        (["battery", "phone", "charger", "computer", "electronic"], "E-waste", "Authorised e-waste collection"),
        (["can", "metal", "aluminium", "tin"], "Metal", "Metal recycling collection"),
        (["glass", "jar"], "Glass", "Separate glass collection")
    ]

    for keywords, category, bin_name in rules:
        if any(word in item for word in keywords):
            key = category.lower().replace("-", "")
            return jsonify(
                category=category,
                bin=bin_name,
                advice=GUIDES.get(key, "Follow your local waste collection rules."),
                matched=True
            )

    return jsonify(
        category="Needs checking",
        bin="Check local waste guidelines",
        advice="The item could not be confidently classified. Ask your local waste collection service.",
        matched=False
    )

def local_answer(message):
    text = message.lower()

    if any(word in text for word in ["plastic", "bottle", "polythene"]):
        return "Reduce single-use plastics. Reuse suitable containers and recycle accepted plastics through an authorised collection service."
    if any(word in text for word in ["compost", "food waste", "organic"]):
        return "Separate suitable food and garden waste. Compost it where safe and practical."
    if any(word in text for word in ["electronic", "battery", "phone", "ewaste"]):
        return "Keep electronic waste separate and take it to an authorised e-waste collection centre. Do not dismantle batteries."
    if any(word in text for word in ["water", "river"]):
        return "Avoid dumping waste into drains and rivers. Reduce water wastage and report pollution to the appropriate local authority."
    if any(word in text for word in ["tree", "plant", "forest"]):
        return "Protect native plants, avoid damaging trees and support local planting activities."
    return "I am ECO-SMART's environmental assistant. Ask me about recycling, composting, plastic pollution, e-waste, water conservation or climate action."

def remote_answer(message):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    url = base if base.endswith("/chat/completions") else base + "/chat/completions"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are ECO-SMART, a concise environmental education assistant. Give safe, practical waste-management and sustainability advice."
            },
            {"role": "user", "content": message[:1500]}
        ],
        "temperature": 0.5
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"]
    except Exception:
        return None

@app.post("/api/ai/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()

    if not message:
        return jsonify(error="Please enter a message."), 400

    answer = remote_answer(message)
    if answer:
        return jsonify(answer=answer, mode="hybrid")

    return jsonify(answer=local_answer(message), mode="local")

@app.post("/api/reports")
def create_report():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "Anonymous")).strip()[:40] or "Anonymous"
    location = str(data.get("location", "")).strip()[:100]
    issue = str(data.get("issue", "")).strip()[:50]
    description = str(data.get("description", "")).strip()[:500]

    if not issue or not description:
        return jsonify(error="Issue and description are required."), 400

    with connect_db() as conn:
        conn.execute(
            "INSERT INTO reports (name, location, issue, description) VALUES (?, ?, ?, ?)",
            (name, location, issue, description)
        )

    return jsonify(message="Your demo report has been submitted successfully.")

@app.get("/api/quiz")
def get_quiz():
    questions = [
        {"question": q["question"], "options": q["options"]}
        for q in QUIZ
    ]
    return jsonify(questions=questions)

@app.post("/api/quiz/submit")
def submit_quiz():
    data = request.get_json(silent=True) or {}
    answers = data.get("answers", [])

    if not isinstance(answers, list) or len(answers) != len(QUIZ):
        return jsonify(error="Please submit all quiz answers."), 400

    score = 0
    explanations = []

    for index, question in enumerate(QUIZ):
        correct = isinstance(answers[index], int) and answers[index] == question["answer"]
        if correct:
            score += 1
        explanations.append({
            "correct": correct,
            "explanation": question["explanation"]
        })

    username = str(data.get("username", "Guest")).strip()[:30] or "Guest"
    points = score * 10

    with connect_db() as conn:
        conn.execute(
            "INSERT INTO quiz_results (username, score, points) VALUES (?, ?, ?)",
            (username, score, points)
        )

    return jsonify(score=score, total=len(QUIZ), points=points, explanations=explanations)

@app.get("/api/leaderboard")
def leaderboard():
    with connect_db() as conn:
        rows = conn.execute("""
            SELECT username, COUNT(*) AS attempts, SUM(points) AS points
            FROM quiz_results
            GROUP BY username
            ORDER BY points DESC, attempts DESC
            LIMIT 10
        """).fetchall()

    return jsonify(leaders=[dict(row) for row in rows])

@app.get("/api/challenges")
def challenges():
    return jsonify(challenges=CHALLENGES)

init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
