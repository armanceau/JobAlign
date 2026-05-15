from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

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
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Créer le dossier uploads s'il n'existe pas
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
    
    try:
        contents = await file.read()
        
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Le fichier dépasse la limite de 10 MB. Taille reçue: {len(contents) / 1024 / 1024:.2f} MB"
            )
        
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(contents)
        
        return JSONResponse(
            status_code=201,
            content={
                "message": "CV téléchargé avec succès",
                "filename": file.filename,
                "size": len(contents),
                "path": file_path
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du traitement du fichier: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
