
# 🌍 ECO-SMART 2.0

### Environmental Intelligence & Smart Waste Management

ECO-SMART is a full-stack environmental awareness platform that promotes responsible waste segregation, recycling and community participation.

## Features

- Futuristic dark responsive interface
- Animated scrolling with GSAP
- Interactive Three.js Earth
- Waste classification engine
- Hybrid AI environmental assistant
- Community reporting
- Environmental statistics dashboard
- Eco knowledge quiz
- Points and leaderboard
- Daily environmental challenges
- English, Hindi and Assamese navigation

## Technology

Frontend: HTML, CSS, JavaScript  
Backend: Python Flask  
Database: SQLite  
Animation: GSAP  
3D: Three.js  
Charts: Chart.js  
Deployment: Render

## Local installation

```powershell
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python backend/app.py
```

Open http://127.0.0.1:5000

## Render

Build command:

```bash
pip install -r backend/requirements.txt
```

Start command:

```bash
gunicorn --chdir backend app:app
```

Health check:

```text
/api/health
```

## AI setup

The local environmental knowledge engine works without an API key.

Optional generative AI configuration:

- OPENAI_API_KEY
- OPENAI_BASE_URL
- OPENAI_MODEL

Set these as private environment variables in Render.

## API

GET /api/health  
GET /api/stats  
GET /api/guide  
POST /api/classify  
POST /api/ai/chat  
POST /api/reports  
GET /api/quiz  
POST /api/quiz/submit  
GET /api/leaderboard  
GET /api/challenges

## Data and privacy

The report form and quiz store submitted information in SQLite. Use a nickname rather than personal identifying details in the public leaderboard.

The application is an educational demonstration. Reports are not automatically sent to government or municipal authorities.

## Developer

Nilutpal Konch  
ECO-SMART 2.0 · 2026
