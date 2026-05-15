import React, { useState } from "react";
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

interface AnalysisResults {
  filename?: string;
  score?: number;
}

function App(): React.ReactElement {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [uploadedCV, setUploadedCV] = useState<string | null>(null);
  const [jobOffer, setJobOffer] = useState<string>("");

  const handleUploadSuccess = (fileName: string) => {
    setUploadedCV(fileName);
  };

  const handleAnalyze = () => {
    if (!uploadedCV || !jobOffer.trim()) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    // TODO: Appeler l'API pour l'analyse
    setResults({ filename: uploadedCV });
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-12">
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
                <CVUpload onUploadSuccess={handleUploadSuccess} />
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
                  className="w-full h-40 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-0 font-mono text-sm resize-none"
                />
                <Button
                  variant={"primary"}
                  onClick={handleAnalyze}
                  disabled={!uploadedCV}
                  size="lg"
                  className="w-full"
                >
                  Analyser le CV
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Résultats de l'analyse</CardTitle>
              <CardDescription>
                Les résultats seront affichés ici
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                À venir dans les prochaines étapes...
              </p>
              <Button
                onClick={() => {
                  setResults(null);
                  setUploadedCV(null);
                  setJobOffer("");
                }}
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
