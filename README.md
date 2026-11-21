# ECO-SMART-2.0
# 🌍 ECO-SMART 2.0
### AI-Powered Environmental Awareness & Waste Management Platform

ECO-SMART 2.0 is a modern environmental platform designed to promote responsible waste management, recycling, sustainability and environmental awareness.

It combines an interactive dashboard, waste classification, an environmental AI assistant, community reporting and educational challenges in one platform.

## ✨ Features

- **Smart Waste Classifier** — Get waste-category and disposal guidance.
- **Environmental AI Assistant** — Ask questions about recycling, pollution, sustainability and climate action.
- **Environmental Dashboard** — View community reports and participation statistics.
- **Community Reporting** — Submit environmental issue reports.
- **Eco Quiz** — Test environmental knowledge and earn points.
- **Leaderboard** — Display quiz participation and scores.
- **Eco Challenges** — Discover practical sustainability activities.
- **Responsive Interface** — Designed for desktop and mobile screens.
- **Local AI Fallback** — Basic environmental answers work without an external AI API key.

## 🛠️ Technology Stack

**Frontend**
- HTML5
- CSS3
- JavaScript
- GSAP
- Three.js
- Chart.js

**Backend**
- Python
- Flask
- SQLite
- Gunicorn

## 📁 Project Structure

```text
ECO-SMART-2.0/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .gitignore
├── render.yaml
└── README.md
```

## 🚀 Run Locally

Clone the repository:

```bash
git clone https://github.com/nilutpalkonch88-pixel/ECO-SMART-2.0.git
cd ECO-SMART-2.0
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Start the application:

```bash
python backend/app.py
```

Open:

`http://127.0.0.1:5000`

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Server health |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/guide` | Waste guidance |
| POST | `/api/classify` | Waste classification |
| POST | `/api/ai/chat` | Environmental assistant |
| POST | `/api/reports` | Submit a report |
| GET | `/api/quiz` | Retrieve quiz |
| POST | `/api/quiz/submit` | Submit quiz answers |
| GET | `/api/leaderboard` | Leaderboard |
| GET | `/api/challenges` | Eco challenges |

## ☁️ Deployment

The project is configured for deployment as a Python web service on Render.

- Build command: `pip install -r backend/requirements.txt`
- Start command: `gunicorn --chdir backend app:app`
- Health check: `/api/health`

SQLite storage on a standard ephemeral hosting filesystem may not persist across deployments or restarts. Use persistent storage or a managed database for production.

## 🔐 Privacy & Safety

- Do not submit personal or sensitive information in public reports.
- Use a nickname on the leaderboard.
- Keep API keys in hosting environment variables, never in frontend code or GitHub.
- This is an educational project; reports are demonstration submissions, not an emergency-response service.

## 👨‍💻 Developer

**Developed by Nilutpal Konch**

*Innovator | Developer | Tech Enthusiast*

---

ECO-SMART 2.0 — Small actions. Cleaner communities. A greener future. 🌱
