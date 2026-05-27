import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MotivationLetterResponse {
  provider: string;
  model: string;
  status: string;
  letter: string;
}

interface MotivationLetterGeneratorProps {
  cvText: string;
  offerText: string;
}

export default function MotivationLetterGenerator({
  cvText,
  offerText,
}: MotivationLetterGeneratorProps): React.ReactElement {
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  const [companyName, setCompanyName] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [tone, setTone] = useState("professionnel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MotivationLetterResponse | null>(null);

  const handleGenerate = async () => {
    if (!cvText.trim() || !offerText.trim()) {
      setError("CV et offre requis pour générer une lettre.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<MotivationLetterResponse>(
        `${API_URL}/nlp/motivation-letter`,
        {
          cv_text: cvText,
          offer_text: offerText,
          company_name: companyName || null,
          candidate_name: candidateName || null,
          tone,
        },
      );

      setResult(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Erreur lors de la génération de la lettre.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 4: Lettre de motivation (optionnel)</CardTitle>
        <CardDescription>
          Génère une lettre alignée avec ton CV et l'offre via Ollama.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            placeholder="Nom du recruteur (optionnel)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Entreprise (optionnel)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="professionnel">Ton professionnel</option>
          <option value="dynamique">Ton dynamique</option>
          <option value="sobre">Ton sobre</option>
        </select>

        <div className="flex justify-end">
          <Button type="button" onClick={handleGenerate} disabled={loading}>
            {loading ? "Génération en cours..." : "Générer ma lettre"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Source: {result.provider} | Modèle: {result.model} | Statut: {result.status}
            </p>
            <textarea
              value={result.letter}
              readOnly
              className="h-72 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm leading-relaxed"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
