# JobAlign

CV & Job Offer Analyzer with Local AI

## Quick Start

### Requirements

- Version python : **3.11**
- Ollama with 1 model

**Backend:**

```bash
cd backend
pip install -r requirements.txt
venv\Scripts\activate
python main.py
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Ollama:**

```bash
ollama serve
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

## Pipeline

```mermaid
flowchart TD
	A[Upload PDF] --> B["Save PDF (uploads/)"]
	B --> C["Extract text (pypdf)"]
	C --> D["Normalize text\n(collapse spaces, fix hyphens, rejoin letters)"]
	D --> E["NLP analyse (spaCy)\n- hard skills\n- soft skills\n- diplômes\n- expériences"]
	D --> H["Semantic matching (sentence-transformers)\n- embeddings CV\n- embeddings offre\n- similarité cosinus"]
	E --> H
	H --> F[Return structured JSON]
	F --> G[Frontend: display cleaned text + NLP results + semantic score]
	style A fill:#f9f,stroke:#333,stroke-width:1px
	style C fill:#ffefc6,stroke:#333
	style D fill:#ffe0e0,stroke:#333
	style E fill:#e0ffe0,stroke:#333
	style H fill:#e6ddff,stroke:#333
	style G fill:#cfe7ff,stroke:#333
```
