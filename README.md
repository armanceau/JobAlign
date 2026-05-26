# JobAlign

CV & Job Offer Analyzer with Local AI

## Quick Start

### Requirements

- Version python : **3.11** (⚠️ required)

**Backend:**

```bash
cd backend
pip install -r requirements.txt
venv\Scripts\activate
python main.py
```

Before running the backend, make sure Ollama is available locally and that the local models are installed:

```bash
ollama serve
ollama pull nomic-embed-text
ollama pull llama3.2:1b
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Structure

```
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── CONTEXT.md
├── FEATURES.md
└── LOGBOOK.md
```

See CONTEXT.md, FEATURES.md for more details.
