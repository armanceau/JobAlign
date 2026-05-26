import React, { useState } from "react";
import axios from "axios";
import { CVUpload } from "@/components/CVUpload";
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
import Stepper from "./components/Stepper";

interface AnalysisResults {
  filename?: string;
  score?: number;
}

type MatchingCategoryKey =
  | "technical_skills"
  | "experience"
  | "education"
  | "soft_skills"
  | "language";

interface MatchingCategoryResult {
  score_percent: number;
  weight: number;
  required_count: number;
  matched_count: number;
  required_items: string[];
  matched_items: string[];
  missing_items: string[];
  justification: string;
  required_years?: number;
  cv_years?: number;
  cv_rank?: number;
  required_rank?: number;
}

interface MatchingResponse {
  method: string;
  global_score_percent: number;
  subscores: Record<MatchingCategoryKey, MatchingCategoryResult>;
  justifications: string[];
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
  matching: MatchingResponse;
}

function App(): React.ReactElement {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [uploadedCV, setUploadedCV] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [jobOffer, setJobOffer] = useState<string>("");
  const [analysisResult, setAnalysisResult] =
    useState<NlpAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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
      setResults({ filename: uploadedCV ?? undefined });
      setCurrentStep(3);
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
    setAnalysisError(null);
    setUploadedCV(null);
    setExtractedText(null);
    setJobOffer("");
    setCurrentStep(1);
  };

  const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

  const getScoreTone = (percent: number) => {
    if (percent >= 75) {
      return {
        label: "Excellent alignement",
        badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
        barClass: "bg-emerald-500",
      };
    }

    if (percent >= 55) {
      return {
        label: "Alignement moyen",
        badgeClass: "text-amber-700 bg-amber-50 border-amber-200",
        barClass: "bg-amber-500",
      };
    }

    return {
      label: "Alignement faible",
      badgeClass: "text-rose-700 bg-rose-50 border-rose-200",
      barClass: "bg-rose-500",
    };
  };

  const matchingCategoryOrder: Array<{
    key: MatchingCategoryKey;
    label: string;
  }> = [
    { key: "technical_skills", label: "Compétences techniques" },
    { key: "experience", label: "Expérience" },
    { key: "education", label: "Formation" },
    { key: "soft_skills", label: "Soft skills" },
    { key: "language", label: "Langage" },
  ];

  const getSubscoreTone = (percent: number) => {
    if (percent >= 80) {
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    }

    if (percent >= 50) {
      return "text-amber-700 bg-amber-50 border-amber-200";
    }

    return "text-rose-700 bg-rose-50 border-rose-200";
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
      <div className={results ? "max-w-4xl mx-auto space-y-12" : "max-w-2xl mx-auto space-y-12"}>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">JobAlign</h1>
          <p className="text-base text-slate-600">
            Analysez votre CV et trouvez le job parfait
          </p>
        </div>

        <>
          <div className="mb-6">
            <Stepper
              steps={["CV", "Offre", "Résultats"]}
              current={currentStep}
              onStepClick={(s) => setCurrentStep(s)}
            />
          </div>

          {currentStep === 1 && (
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
                        CV chargé:{" "}
                        <span className="font-medium">{uploadedCV}</span>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <div className="flex gap-2 p-4">
                  <div className="flex-1" />
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!uploadedCV || !extractedText}
                  >
                    Suivant →
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {currentStep === 2 && (
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
                  className="w-full h-40 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-0 font-mono text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setCurrentStep(1)}>
                    ← Retour
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAnalyze}
                    disabled={!uploadedCV || !extractedText || analyzing}
                    size="lg"
                    className="ml-auto"
                  >
                    {analyzing ? "Analyse en cours..." : "Analyser le CV"}
                  </Button>
                </div>
                {analysisError && (
                  <Alert variant="destructive">
                    <AlertDescription>{analysisError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
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
                            Matching déterministe CV/offre
                          </h3>
                          <p className="text-xs text-slate-500">
                            Méthode: {analysisResult.matching.method}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            getScoreTone(
                              clampPercent(
                                analysisResult.matching.global_score_percent,
                              ),
                            ).badgeClass
                          }`}
                        >
                          {
                            getScoreTone(
                              clampPercent(
                                analysisResult.matching.global_score_percent,
                              ),
                            ).label
                          }
                        </span>
                      </div>

                        <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-semibold text-slate-900">
                          {clampPercent(
                            analysisResult.matching.global_score_percent,
                          ).toFixed(2)}
                          %
                        </p>
                        <p className="text-xs text-slate-500">
                          Détail par catégorie
                        </p>
                      </div>
                      <div className="space-y-2">
                        {matchingCategoryOrder.map((cat) => {
                          const sub =
                            analysisResult.matching.subscores[cat.key];
                          return (
                            <div
                              key={cat.key}
                              className="flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900">
                                  {cat.label}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {sub.justification}
                                </div>
                              </div>
                              <div className="ml-4 text-right">
                                <div
                                  className={`rounded-full border px-3 py-1 text-xs font-medium ${getSubscoreTone(sub.score_percent)}`}
                                >
                                  {sub.score_percent.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Comparaison radar des compétences</h4>
                      <RadarChartUI analysisResult={analysisResult} />
                    </div>
                  </div>

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
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-600">Aucune analyse disponible.</p>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                    ← Retour
                  </Button>
                  <Button
                    onClick={resetAnalysis}
                    variant="outline"
                    className="ml-auto"
                  >
                    Recommencer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      </div>
    </div>
  );
}

export default App;
