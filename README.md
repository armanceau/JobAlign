# JobAlign

CV & Job Offer Analyzer with Local AI

## Quick Start

### Requirements

- Version python : **3.11**
- Ollama with 1 model

## Lancement avec Docker

Le plus simple pour démarrer le projet en conteneurs est:

```bash
docker compose up --build
```

Cette commande démarre:

- le backend FastAPI sur `http://localhost:8000`
- le frontend Vite sur `http://localhost:5173`

Variables d'environnement minimales prises en compte par le compose:

- Frontend: `VITE_API_URL=http://localhost:8000`
- Backend: `OLLAMA_BASE_URL=http://host.docker.internal:11434`, `OLLAMA_MODEL=qwen3.5`

Les autres paramètres conservent leurs valeurs par défaut (`OLLAMA_TIMEOUT_SECONDS`, `OLLAMA_LETTER_MODEL`, `JOBALIGN_EMBEDDING_MODEL`) et ne sont à changer que si vous voulez ajuster le comportement du modèle local.

Le backend attend toujours une instance Ollama locale accessible depuis l'hôte. Sur Docker Desktop, `host.docker.internal` permet au conteneur de joindre Ollama lancé sur la machine.

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

## Variables d'environnement

Pour un lancement natif sans Docker:

- Backend: `BACKEND_HOST=localhost`, `BACKEND_PORT=8000`, `OLLAMA_BASE_URL=http://localhost:11434`, `OLLAMA_TIMEOUT_SECONDS=60`, `OLLAMA_MODEL=qwen3.5`, `OLLAMA_LETTER_MODEL=qwen3.5`
- Frontend: `VITE_FRONTEND_PORT=5173`, `VITE_API_URL=http://localhost:8000`

Les modèles Ollama restent locaux et aucun appel API externe n'est utilisé.

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
	H --> L["LLM suggestions\n- reformuler CV et points clés\n- suggérer mots-clés pertinents\n- proposer améliorations de phrasing"]
	E --> L
	L --> F[Return structured JSON]
	F --> G[Frontend: display cleaned text + NLP results + semantic score]
	style A fill:#f9f,stroke:#333,stroke-width:1px
	style C fill:#ffefc6,stroke:#333
	style D fill:#ffe0e0,stroke:#333
	style E fill:#e0ffe0,stroke:#333
	style H fill:#e6ddff,stroke:#333
	style L fill:#fff7cc,stroke:#333
	style G fill:#cfe7ff,stroke:#333
```
