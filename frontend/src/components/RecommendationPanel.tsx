import React from "react";

export interface CVRecommendationItem {
  section: string;
  current: string;
  suggestion: string;
}

export interface CVImprovementItem {
  action: string;
  reason: string;
}

export interface CVRecommendationsProps {
  recommendations: {
    model: string;
    summary: string;
    missing_keywords: string[];
    reformulations: CVRecommendationItem[];
    improvements: CVImprovementItem[];
    prioritized_actions: string[];
  };
}

const renderKeywordList = (items: string[]) => {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Aucun élément détecté</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 border border-slate-200"
        >
          {item}
        </li>
      ))}
    </ul>
  );
};

export const RecommendationPanel: React.FC<CVRecommendationsProps> = ({
  recommendations,
}) => {
  return (
    <section className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Recommandations locales
        </h3>
        <p className="text-xs text-slate-500">
          Générées par Ollama sur votre machine avec le modèle {recommendations.model}
        </p>
      </div>

      <p className="text-sm text-slate-700">
        {recommendations.summary || "Aucune synthèse générée."}
      </p>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Mots-clés manquants
        </h4>
        {renderKeywordList(recommendations.missing_keywords)}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Reformulations suggérées
        </h4>
        {recommendations.reformulations.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune reformulation proposée</p>
        ) : (
          <div className="space-y-3">
            {recommendations.reformulations.map((item) => (
              <div
                key={`${item.section}-${item.current}-${item.suggestion}`}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {item.section}
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Avant:</span>{" "}
                  {item.current}
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Après:</span>{" "}
                  {item.suggestion}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Améliorations prioritaires
        </h4>
        {recommendations.prioritized_actions.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune action prioritaire proposée</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {recommendations.prioritized_actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Améliorations détaillées
        </h4>
        {recommendations.improvements.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune amélioration proposée</p>
        ) : (
          <div className="space-y-3">
            {recommendations.improvements.map((item) => (
              <div
                key={`${item.action}-${item.reason}`}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="text-sm font-medium text-slate-900">
                  {item.action}
                </div>
                <div className="mt-1 text-sm text-slate-600">{item.reason}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
