# TRINITY Backend

FastAPI backend for the TRINITY adaptive AI interviewer. It integrates:

- candidate profile loading from `backend/data/candidate.json`
- curriculum-grounded retrieval from `backend/data/curriculum.json`
- candidate-aware topic selection
- adaptive question generation
- answer evaluation with bluff/superficial detection
- in-memory interview sessions
- final structured feedback and Interview DNA

The backend supports both required API styles:

- Hackathon spec: `POST /api/interview`
- Frozen frontend contract: `/api/interviews/...`

## Setup

```bash
cd backend
python -m pip install -r requirements.txt
copy .env.example .env
```

`GEMINI_API_KEY` is optional. Without it, TRINITY uses deterministic local question and evaluation fallbacks.

## Environment

```env
GEMINI_API_KEY=
MODEL_NAME=gemini-2.5-flash
EMBEDDING_MODEL=local-tfidf
HOST=0.0.0.0
PORT=8000
```

## Run

```bash
cd backend
python main.py
```

Equivalent:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

For the existing Vite frontend, set:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Main APIs

- `POST /api/interview` - official conversational endpoint
- `GET /api/interviews/configuration` - frontend setup options
- `POST /api/interviews` - start frontend interview
- `GET /api/interviews/{id}` - load interview state
- `POST /api/interviews/{id}/questions/{questionId}/answer` - submit answer and generate next adaptive question
- `POST /api/interviews/{id}/complete` - complete interview
- `GET /api/interviews/{id}/result` - structured result
- `GET /api/interviews/history` - in-memory history
- `GET /api/candidates` - candidate profiles
- `GET /api/personas` - interviewer personas

## Verify Full Interview Flow

Run the engine-level simulation without needing a network LLM:

```bash
cd backend
python -c "from app.services.orchestrator import orchestrator_engine; from app.services.rag_service import knowledge_engine; sid='verify'; cand=knowledge_engine.get_candidate_by_id('CAND-002'); print(orchestrator_engine.handle_turn(sid,cand,None)['reply'].splitlines()[0]); answers=['I would create embeddings for chunks, store vectors with metadata, compare query vectors by similarity, and measure recall and latency because retrieval quality controls final answer quality.','Vector databases store AI knowledge.','I would debug query text, embedding versions, dimensions, metadata filters, index rebuilds, and retrieval logs.','Prompt engineering needs constraints, examples, schema validation, and retry handling.','Function calling needs typed schemas, server validation, timeouts, and tool error handling.','Chat state should separate recent turns, summary memory, retrieved context, and user profile.','Agents need capability routing, budgets, logs, and approval gates.','Deployment needs env secrets, health checks, logs, metrics, and rollback planning.']; [print(orchestrator_engine.handle_turn(sid,None,a)['done']) for a in answers]"
```
