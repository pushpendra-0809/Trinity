# 🚀 InterviewOS Backend - Adaptive AI Technical Interviewer

Backend API engine for **InterviewOS** built with FastAPI and Google Gemini API.

---

## 🛠️ Tech Stack & Features

- **Framework:** Python, FastAPI, Uvicorn, Pydantic
- **AI Integration:** Google Gemini API (`google-generativeai` / `google-genai`) with fallback heuristic evaluator
- **State Management:** Session-based conversation memory & difficulty adaptation engine
- **Submission Spec Compliance:** Exposes `POST /api/interview` complying strictly with `technical.md`

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment (Optional)
Add your Gemini API Key to `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If no API key is set, the backend automatically uses its built-in heuristic evaluation engine so you can test immediately without any blocking dependencies!)*

### 3. Run Server
```bash
python app/main.py
```
Or:
```bash
uvicorn app.main:app --reload --port 8000
```

Access Interactive Documentation at: **http://localhost:8000/docs**

---

## 📡 API Endpoints

### 1. Official Submission Endpoint
`POST /api/interview`

#### Turn 1: Start Interview
```json
POST /api/interview
{
  "sessionId": "session-101",
  "candidate": {
    "member": {
      "id": "CAND-001",
      "name": "Sarah Johnson",
      "jobRole": "Senior Data Engineer"
    }
  }
}
```

#### Turn 2..N: Conversation Turn
```json
POST /api/interview
{
  "sessionId": "session-101",
  "message": "I used FAISS vector database with HNSW indexing for low latency search."
}
```

### 2. Additional Helper Endpoints
- `GET /api/candidates` - Get list of candidates for Frontend selection dropdown
- `GET /api/personas` - Get available interviewer personas
- `GET /api/interview/{sessionId}/state` - View live session memory state
