# README_ISSUES.md

Ce document propose les issues GitHub à créer à partir de `README.md`, `FEATURES.md`, `CONTEXT.md` et `LOGBOOK.md`.

## Convention de labels

- `type:feature` / `type:infra` / `type:docs`
- `area:backend` / `area:frontend` / `area:ai` / `area:devops`
- `priority:high` / `priority:medium` / `priority:low`
- `phase:mvp` / `phase:bonus`

## Issues MVP (à créer en premier)

### 1) Initialiser l’architecture du projet (frontend + backend)
**Labels:** `type:infra`, `area:backend`, `area:frontend`, `priority:high`, `phase:mvp`  
**Description:**  
Créer la structure de dossiers recommandée (`/backend/api`, `/backend/services`, `/backend/nlp`, `/backend/models`, `/backend/llm`, `/frontend/components`, `/frontend/pages`, `/frontend/services`) et un squelette d’application.
**Critères d’acceptation:**
- Structure créée et documentée
- Backend FastAPI démarrable
- Frontend React démarrable

### 2) Implémenter l’upload PDF côté frontend et endpoint backend
**Labels:** `type:feature`, `area:frontend`, `area:backend`, `priority:high`, `phase:mvp`  
**Description:**  
Permettre à l’utilisateur d’envoyer un CV PDF depuis l’UI et de le recevoir côté API.
**Critères d’acceptation:**
- Composant d’upload fonctionnel
- Endpoint backend recevant un fichier PDF
- Gestion d’erreurs utilisateur (fichier manquant/type invalide)

### 3) Extraire le texte du CV PDF
**Labels:** `type:feature`, `area:backend`, `priority:high`, `phase:mvp`  
**Description:**  
Créer un service backend d’extraction texte PDF avec nettoyage de base.
**Critères d’acceptation:**
- Texte brut extrait depuis un PDF valide
- Erreur explicite si extraction impossible
- Sortie normalisée (espaces/lignes nettoyés)

### 4) Ajouter l’analyse NLP (extraction hard skills, soft skills, expériences, diplômes)
**Labels:** `type:feature`, `area:ai`, `area:backend`, `priority:high`, `phase:mvp`  
**Description:**  
Implémenter le pipeline spaCy pour extraire les informations clés du CV et de l’offre.
**Critères d’acceptation:**
- Entités extraites sur CV et offre
- Réponse structurée par catégories
- Composant isolé dans `/backend/nlp`

### 5) Implémenter le matching sémantique avec sentence-transformers
**Labels:** `type:feature`, `area:ai`, `area:backend`, `priority:high`, `phase:mvp`  
**Description:**  
Calculer la similarité sémantique CV/offre via embeddings.
**Critères d’acceptation:**
- Génération d’embeddings pour CV et offre
- Score de similarité calculé
- Module dédié dans `/backend/services` ou `/backend/models`

### 6) Créer un score explicable (global + sous-scores)
**Labels:** `type:feature`, `area:ai`, `area:backend`, `priority:high`, `phase:mvp`  
**Description:**  
Produire un score global et des sous-scores (`compétences`, `expérience`, `formation`, `soft skills`) sans utiliser le LLM pour le calcul principal.
**Critères d’acceptation:**
- Score global en %
- Sous-scores disponibles
- Justification textuelle des points calculés

### 7) Intégrer les suggestions LLM locales via Ollama (Qwen 3.5)
**Labels:** `type:feature`, `area:ai`, `area:backend`, `priority:high`, `phase:mvp`  
**Description:**  
Générer des recommandations actionnables (mots-clés manquants, reformulations, améliorations) en local uniquement.
**Critères d’acceptation:**
- Appel local Ollama opérationnel
- Aucune API externe utilisée
- Suggestions retournées au frontend

### 8) Construire la page résultats (score visuel + points forts/faibles)
**Labels:** `type:feature`, `area:frontend`, `priority:high`, `phase:mvp`  
**Description:**  
Créer l’écran principal avec score global, sous-scores et synthèse qualitative.
**Critères d’acceptation:**
- Affichage clair du score global
- Affichage des sous-scores
- Bloc points forts / points faibles

### 9) Ajouter un radar chart des compétences (Chart.js)
**Labels:** `type:feature`, `area:frontend`, `priority:medium`, `phase:mvp`  
**Description:**  
Comparer visuellement compétences candidat vs compétences attendues.
**Critères d’acceptation:**
- Radar chart rendu dans l’interface
- Données backend mappées correctement
- Légende lisible

### 10) Ajouter mode clair/sombre et base UI Shadcn
**Labels:** `type:feature`, `area:frontend`, `priority:medium`, `phase:mvp`  
**Description:**  
Mettre en place le design system minimum demandé (Shadcn + dark/light mode).
**Critères d’acceptation:**
- Composants principaux stylés avec Shadcn
- Toggle dark/light fonctionnel
- Contraste lisible sur vues clés

### 11) Gérer les erreurs et validations de bout en bout
**Labels:** `type:feature`, `area:backend`, `area:frontend`, `priority:high`, `phase:mvp`  
**Description:**  
Uniformiser les erreurs API/UI (PDF invalide, texte offre vide, erreur modèle local).
**Critères d’acceptation:**
- Messages d’erreur utilisateur cohérents
- Codes HTTP adaptés côté API
- Cas d’erreur principaux couverts

### 12) Documenter le projet (README installation, usage, architecture)
**Labels:** `type:docs`, `area:devops`, `priority:high`, `phase:mvp`  
**Description:**  
Mettre à jour `README.md` pour satisfaire les livrables (installation, exécution, architecture, pipeline IA local-first).
**Critères d’acceptation:**
- Guide d’installation complet
- Étapes de lancement frontend/backend
- Schéma ou description claire du flux de données

### 13) Mettre en place docker-compose (recommandé)
**Labels:** `type:infra`, `area:devops`, `priority:medium`, `phase:mvp`  
**Description:**  
Ajouter une exécution simplifiée du projet avec conteneurs.
**Critères d’acceptation:**
- Services frontend/backend définis
- Commande unique de démarrage documentée
- Variables d’environnement minimales clarifiées

### 14) Journaliser les décisions techniques dans LOGBOOK.md
**Labels:** `type:docs`, `priority:medium`, `phase:mvp`  
**Description:**  
Documenter les décisions majeures au fur et à mesure, sans supprimer l’historique.
**Critères d’acceptation:**
- Entrées datées avec format Contexte/Décision/Raison/Impact
- Aucun historique supprimé

## Issues Bonus (phase 2)

### 15) Exporter un rapport PDF d’analyse
**Labels:** `type:feature`, `area:backend`, `area:frontend`, `priority:low`, `phase:bonus`

### 16) Générer une version améliorée du CV
**Labels:** `type:feature`, `area:ai`, `priority:low`, `phase:bonus`

### 17) Ajouter un historique des analyses
**Labels:** `type:feature`, `area:backend`, `area:frontend`, `priority:low`, `phase:bonus`

### 18) Ajouter un score ATS dédié
**Labels:** `type:feature`, `area:ai`, `priority:low`, `phase:bonus`

### 19) Ajouter une “simulation recruteur”
**Labels:** `type:feature`, `area:ai`, `priority:low`, `phase:bonus`

---

## Ordre recommandé de création

1. Issues 1 → 7 (pipeline backend + IA locale)
2. Issues 8 → 11 (UX résultats + robustesse)
3. Issues 12 → 14 (docs + exploitation)
4. Issues 15 → 19 (bonus)
