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
    backend: string;
    model: string;
    summary: string;
    missing_keywords: string[];
    reformulations: CVRecommendationItem[];
    improvements: CVImprovementItem[];
    prioritized_actions: string[];
    error?: string;
  };
}

const asText = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["text", "action", "reason", "current", "suggestion", "summary"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return String(value ?? "");
};

const renderKeywordList = (items: string[]) => {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Aucun élément détecté</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={asText(item)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
        >
          {asText(item)}
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
          Générées par Ollama sur votre machine avec le modèle {asText(recommendations.model)}
        </p>
      </div>

      {recommendations.error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {recommendations.error}
        </div>
      )}

      <p className="text-sm text-slate-700">
        {asText(recommendations.summary) || "Aucune synthèse générée."}
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
                key={`${asText(item.section)}-${asText(item.current)}-${asText(item.suggestion)}`}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {asText(item.section)}
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Avant:</span>{" "}
                  {asText(item.current)}
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Après:</span>{" "}
                  {asText(item.suggestion)}
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
          <p className="text-sm text-slate-500">
            Aucune action prioritaire proposée
          </p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {recommendations.prioritized_actions.map((action, index) => (
              <li key={`${asText(action)}-${index}`}>{asText(action)}</li>
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
                key={`${asText(item.action)}-${asText(item.reason)}`}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="text-sm font-medium text-slate-900">
                  {asText(item.action)}
                </div>
                <div className="mt-1 text-sm text-slate-600">{asText(item.reason)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
