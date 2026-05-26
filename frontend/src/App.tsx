import React, { useState } from "react";
import axios from "axios";
import { CVUpload } from "@/components/CVUpload";
import { RecommendationPanel } from "./components/RecommendationPanel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import RadarChartUI from "@/components/ui/radarChart";

interface AnalysisResults {
  filename?: string;
  score?: number;
}

interface NlpCategoryResult {
  hard_skills: string[];
  soft_skills: string[];
  diplomas: string[];
  languages: string[];
  experiences: Array<{
    text: string;
    years?: number;
  }>;
  entities: Array<{
    label: string;
    text: string;
    start: number;
    end: number;
  }>;
}

interface NlpAnalysisResponse {
  cv: NlpCategoryResult;
  offer: NlpCategoryResult;
  summary: {
    shared_hard_skills: string[];
    shared_soft_skills: string[];
    shared_diplomas: string[];
    shared_languages: string[];
  };
  semantic_matching: {
    backend: string;
    model: string;
    cosine_similarity: number;
    similarity_percent: number;
  };
}

type NlpRecommendationResponse = {
  recommendations: {
    backend: string;
    model: string;
    summary: string;
    missing_keywords: string[];
    reformulations: Array<{
      section: string;
      current: string;
      suggestion: string;
    }>;
    improvements: Array<{
      action: string;
      reason: string;
    }>;
    prioritized_actions: string[];
    error?: string;
  };
};

function App(): React.ReactElement {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [uploadedCV, setUploadedCV] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [jobOffer, setJobOffer] = useState<string>("");
  const [analysisResult, setAnalysisResult] =
    useState<NlpAnalysisResponse | null>(null);
  const [recommendationResult, setRecommendationResult] =
    useState<NlpRecommendationResponse["recommendations"] | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommending, setRecommending] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  const handleUploadSuccess = (fileName: string) => {
    setUploadedCV(fileName);
  };

  const handleExtractSuccess = (text: string) => {
    setExtractedText(text);
  };

  const handleAnalyze = async () => {
    if (!extractedText || !jobOffer.trim()) {
      setAnalysisError(
        "Veuillez d'abord charger un CV et coller une offre d'emploi.",
      );
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await axios.post<NlpAnalysisResponse>(
        `${API_URL}/nlp/analyze`,
        {
          cv_text: extractedText,
          offer_text: jobOffer,
        },
      );

      setAnalysisResult(response.data);
      setRecommendationResult(null);
      setRecommendationError(null);
      setResults({ filename: uploadedCV ?? undefined });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        setAnalysisError(error.response.data.detail);
      } else {
        setAnalysisError("Erreur lors de l'analyse NLP. Veuillez réessayer.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResults(null);
    setAnalysisResult(null);
    setRecommendationResult(null);
    setAnalysisError(null);
    setRecommendationError(null);
    setUploadedCV(null);
    setExtractedText(null);
    setJobOffer("");
  };

  const handleRecommend = async () => {
    if (!analysisResult || !extractedText || !jobOffer.trim()) {
      setRecommendationError("L'analyse doit être effectuée avant de générer les recommandations.");
      return;
    }

    setRecommending(true);
    setRecommendationError(null);

    try {
      const response = await axios.post<NlpRecommendationResponse>(
        `${API_URL}/nlp/recommendations`,
        {
          cv_text: extractedText,
          offer_text: jobOffer,
          cv_analysis: analysisResult.cv,
          offer_analysis: analysisResult.offer,
        },
      );

      setRecommendationResult(response.data.recommendations);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        setRecommendationError(error.response.data.detail);
      } else {
        setRecommendationError("Erreur lors de la génération des recommandations. Veuillez réessayer.");
      }
    } finally {
      setRecommending(false);
    }
  };

  const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

  const getScoreTone = (percent: number) => {
    if (percent >= 75) {
      return {
        label: "Excellent alignement",
        badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    }

    if (percent >= 55) {
      return {
        label: "Alignement moyen",
        badgeClass: "text-amber-700 bg-amber-50 border-amber-200",
      };
    }

    return {
      label: "Alignement faible",
      badgeClass: "text-rose-700 bg-rose-50 border-rose-200",
    };
  };

  const renderList = (items: string[]) => {
    if (items.length === 0) {
      return <p className="text-sm text-slate-500">Aucun élément détecté</p>;
    }

    return (
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
          >
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="mx-auto max-w-2xl space-y-12">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">JobAlign</h1>
          <p className="text-base text-slate-600">
            Analysez votre CV et trouvez le job parfait
          </p>
        </div>

        {!results ? (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Étape 1: Télécharger votre CV</CardTitle>
                <CardDescription>
                  Importez votre CV au format PDF pour l'analyse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CVUpload
                  onUploadSuccess={handleUploadSuccess}
                  onExtractSuccess={handleExtractSuccess}
                />
                {uploadedCV && (
                  <Alert className="mt-6">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      CV chargé: {" "}
                      <span className="font-medium">{uploadedCV}</span>
                    </AlertDescription>
                  </Alert>
                )}
                {extractedText && (
                  <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                      <CheckCircle className="h-4 w-4" />
                      Texte extrait
                    </div>
                    <pre className="max-h-64 whitespace-pre-wrap overflow-y-auto text-sm text-slate-700">
                      {extractedText}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Étape 2: Collez l'offre d'emploi</CardTitle>
                <CardDescription>
                  Fournissez le texte complet de l'offre que vous ciblez
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  placeholder="Collez ici l'offre d'emploi complète..."
                  value={jobOffer}
                  onChange={(e) => setJobOffer(e.target.value)}
                  className="h-40 w-full resize-none rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-0"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAnalyze}
                  disabled={!uploadedCV || !extractedText || analyzing}
                  size="lg"
                  className="w-full"
                >
                  {analyzing ? "Analyse en cours..." : "Analyser le CV"}
                </Button>
                {analysisError && (
                  <Alert variant="destructive">
                    <AlertDescription>{analysisError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Résultats de l'analyse</CardTitle>
              <CardDescription>
                Catégories extraites depuis le CV et l'offre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {analysisResult ? (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Matching sémantique CV/offre
                        </h3>
                        <p className="text-xs text-slate-500">
                          Modèle: {analysisResult.semantic_matching.model}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getScoreTone(
                          clampPercent(
                            analysisResult.semantic_matching.similarity_percent,
                          ),
                        ).badgeClass}`}
                      >
                        {getScoreTone(
                          clampPercent(
                            analysisResult.semantic_matching.similarity_percent,
                          ),
                        ).label}
                      </span>
                    </div>

                        <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-semibold text-slate-900">
                          {clampPercent(
                            analysisResult.semantic_matching.similarity_percent,
                          ).toFixed(2)}
                          %
                        </p>
                        <p className="text-xs text-slate-500">
                          Cosinus: {" "}
                          {analysisResult.semantic_matching.cosine_similarity.toFixed(
                            4,
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Comparaison radar des compétences</h4>
                      <RadarChartUI analysisResult={analysisResult} />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleRecommend}
                    disabled={!analysisResult || recommending}
                    className="w-full"
                    size="lg"
                  >
                    {recommending ? "Génération en cours..." : "Recommander"}
                  </Button>

                  {recommendationError && (
                    <Alert variant="destructive">
                      <AlertDescription>{recommendationError}</AlertDescription>
                    </Alert>
                  )}

                  {recommendationResult?.error && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {recommendationResult.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {recommendationResult ? (
                    <RecommendationPanel
                      recommendations={recommendationResult}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      Cliquez sur <span className="font-medium">Recommander</span> après le matching pour générer les suggestions locales Ollama.
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Hard skills communes
                    </h3>
                    {renderList(analysisResult.summary.shared_hard_skills)}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Soft skills communes
                    </h3>
                    {renderList(analysisResult.summary.shared_soft_skills)}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Diplômes communs
                    </h3>
                    {renderList(analysisResult.summary.shared_diplomas)}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Langues communes
                    </h3>
                    {renderList(analysisResult.summary.shared_languages)}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        CV
                      </h3>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Hard skills
                        </p>
                        {renderList(analysisResult.cv.hard_skills)}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Soft skills
                        </p>
                        {renderList(analysisResult.cv.soft_skills)}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Diplômes
                        </p>
                        {renderList(analysisResult.cv.diplomas)}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Langues
                        </p>
                        {renderList(analysisResult.cv.languages)}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Offre
                      </h3>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Hard skills
                        </p>
                        {renderList(analysisResult.offer.hard_skills)}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Soft skills
                        </p>
                        {renderList(analysisResult.offer.soft_skills)}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Diplômes
                        </p>
                        {renderList(analysisResult.offer.diplomas)}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Langues
                        </p>
                        {renderList(analysisResult.offer.languages)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-600">Aucune analyse disponible.</p>
              )}
              <Button
                type="button"
                onClick={resetAnalysis}
                variant="outline"
                className="w-full"
              >
                ← Retour
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
