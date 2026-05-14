# CONTEXT.md

## 🧭 Objectif

Ce fichier fournit le contexte global du projet.
Toute IA (Copilot, agent, etc.) DOIT le lire avant de générer ou modifier du code.

---

## ⚠️ Règle principale

Avant toute action :

1. Lire ce fichier (CONTEXT.md)
2. Lire LOGBOOK.md
3. Prendre en compte les décisions existantes

Ne jamais ignorer l’historique.

---

## 🏗️ Architecture globale

### Backend

* Langage : Python
* Framework recommandé : FastAPI
* Responsabilités :

  * parsing PDF
  * NLP (spaCy)
  * embeddings (sentence-transformers)
  * scoring
  * appel LLM pour suggestions (modèle local)

### Frontend

* Framework : React
* UI : Shadcn
* Graphiques : Chart.js

---

## 🤖 IA & Modèles

Le projet utilise **exclusivement des modèles locaux** pour toutes les fonctionnalités liées à l’intelligence artificielle.

### Modèle principal

* LLM : Qwen 3.5
* Runtime : Ollama

### Règles importantes

* Aucun appel à des API externes (OpenAI, etc.)
* Toutes les analyses doivent être faites en local
* Le modèle est utilisé uniquement pour :
  * génération de suggestions
  * analyse qualitative (points forts / faibles)
  * amélioration du CV

### Pipeline IA

* spaCy → extraction d’entités (NER)
* sentence-transformers → matching sémantique
* Qwen (via Ollama) → génération de texte

Le LLM ne doit **pas** être utilisé pour calculer le score principal (qui doit rester explicable).

---

## 🔄 Pipeline de traitement

1. Upload du CV (PDF)
2. Extraction du texte
3. Nettoyage des données
4. Extraction d’entités (NLP)
5. Génération d’embeddings
6. Calcul du matching
7. Génération du score
8. Suggestions via LLM local (Ollama)
9. Retour au frontend

---

## 📁 Organisation recommandée

/backend

* /api
* /services
* /nlp
* /models
* /llm

/frontend

* /components
* /pages
* /services

---

## 🧠 Principes importants

### 1. Code modulaire

* éviter les gros fichiers
* séparer logique métier / API

### 2. Lisibilité > complexité

* privilégier du code simple
* noms explicites

### 3. IA explicable

* toujours justifier les scores
* éviter les “black box”

### 4. Local-first

* toutes les briques IA doivent fonctionner sans internet
* garantir la reproductibilité du projet

---

## 🧾 Gestion de la mémoire

Le projet utilise deux sources de vérité :

* CONTEXT.md → vision globale
* LOGBOOK.md → historique des décisions

Toute modification importante DOIT être ajoutée dans LOGBOOK.md.

---

## ⚙️ Bonnes pratiques pour l’IA

* Ne pas recréer des fonctions existantes
* Vérifier les dépendances avant ajout
* Respecter l’architecture
* Lire les logs avant de coder
* Ne jamais appeler d’API externe pour de l’IA

---

## 🚫 À éviter

* Hardcoder des valeurs
* Mélanger frontend et backend
* Ignorer les fichiers existants
* Faire des changements sans les documenter
* Utiliser un LLM pour des calculs déterministes (score)

---