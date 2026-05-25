from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import uuid
import re

from services.pdf_text_extractor import extract_text_from_pdf_bytes

app = FastAPI(title="JobAlign API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = "uploads"
ALLOWED_CONTENT_TYPES = ["application/pdf"]
MAX_FILE_SIZE = 10 * 1024 * 1024

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "JobAlign API running", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    """
    Endpoint pour télécharger un CV en PDF.
    Valide:
    - La présence du fichier
    - Le type MIME (application/pdf)
    - La taille du fichier
    """
    
    if not file:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")
    
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier invalide. Attendu: PDF, reçu: {file.content_type}"
        )
    
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Le fichier doit avoir une extension .pdf"
        )

    def sanitize_filename(filename: str) -> str:
        """Return a safe filename by stripping path components and
        replacing unsafe characters with underscores.
        """
        name = os.path.basename(filename)
        return re.sub(r'[^A-Za-z0-9._-]', '_', name)
    
    try:
        contents = await file.read()
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Le fichier dépasse la limite de 10 MB. Taille reçue: {len(contents) / 1024 / 1024:.2f} MB"
            )

        safe_name = sanitize_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex}_{safe_name}"

        file_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(file_path, "wb") as f:
            f.write(contents)
        
        return JSONResponse(
            status_code=201,
            content={
                "message": "CV téléchargé avec succès",
                "original_filename": file.filename,
                "stored_filename": unique_name,
                "size": len(contents),
                "path": file_path
            }
        )

    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du traitement du fichier: {str(e)}"
        )


@app.post("/extract-cv-text")
async def extract_cv_text(file: UploadFile = File(...)):
    """Extrait et normalise le texte d'un CV PDF."""

    if not file:
        raise HTTPException(status_code=400, detail="Aucun fichier fourni.")

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier invalide. Attendu: PDF, reçu: {file.content_type}"
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Le fichier doit avoir une extension .pdf"
        )

    try:
        pdf_bytes = await file.read()
        extracted_text = extract_text_from_pdf_bytes(pdf_bytes)

        return JSONResponse(
            status_code=200,
            content={
                "message": "Texte extrait avec succès",
                "filename": file.filename,
                "text": extracted_text,
            },
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'extraction du texte: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
