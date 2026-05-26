import React, { useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Upload } from "lucide-react";

interface CVUploadProps {
  onUploadSuccess?: (fileName: string) => void;
  onExtractSuccess?: (text: string) => void;
}

export const CVUpload: React.FC<CVUploadProps> = ({
  onUploadSuccess,
  onExtractSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setSuccess(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Le fichier doit être un PDF valide.");
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Le fichier dépasse la limite de 10 MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier PDF.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(`${API_URL}/upload-cv`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const extractFormData = new FormData();
      extractFormData.append("file", file);

      const extractResponse = await axios.post(
        `${API_URL}/extract-cv-text`,
        extractFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setSuccess(`CV téléchargé et texte extrait avec succès: ${file.name}`);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploadSuccess?.(file.name);
      onExtractSuccess?.(extractResponse.data.text);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(
          "Erreur lors du téléchargement ou de l'extraction. Veuillez réessayer.",
        );
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label htmlFor="cv-input" className="block relative cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          id="cv-input"
          className="hidden"
        />
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-slate-300 transition-colors">
          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-3" />
          <div className="text-sm font-medium text-slate-900">
            Glissez un PDF ou cliquez pour sélectionner
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Taille maximale: 10 MB
          </div>
        </div>
      </label>

      {file && (
        <div className="text-sm text-slate-700 p-3">
          ✓ Fichier sélectionné:{" "}
          <span className="font-medium">{file.name}</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        variant="primary"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
        size="lg"
      >
        {uploading ? "Téléchargement en cours..." : "Télécharger le CV"}
      </Button>
    </div>
  );
};
