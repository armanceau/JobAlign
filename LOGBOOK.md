# LOGBOOK.md

## 🧠 Objectif

Ce fichier sert de mémoire persistante pour le projet.

Il contient :

- décisions techniques
- choix d’architecture
- problèmes rencontrés
- solutions mises en place

Toute IA DOIT le lire avant d’agir.

---

## 📅 Format des entrées

Chaque entrée doit suivre ce format :

### [DATE] - Titre

**Contexte :**
Décrire le problème ou la situation

**Décision :**
Ce qui a été décidé

**Raison :**
Pourquoi ce choix

**Impact :**
Conséquences sur le projet

---

## 📝 Entrées

### [2026-05-25] - Branchement frontend vers l'analyse NLP

**Contexte :**
Le flux frontend s'arrêtait à l'extraction texte, sans appeler l'endpoint NLP du backend.

**Décision :**

- Brancher le bouton d'analyse du frontend sur `POST /nlp/analyze`
- Envoyer le texte extrait du CV et le texte de l'offre
- Afficher dans l'UI les hard skills, soft skills et diplômes extraits pour le CV et l'offre

**Raison :**

- Rendre le flux testable en bout en bout depuis le navigateur
- Vérifier immédiatement la valeur fonctionnelle de l'extraction NLP
- Garder une réponse visible et exploitable côté UI

**Impact :**

- ✅ L'analyse NLP est maintenant déclenchable depuis le frontend
- ✅ Les résultats structurés s'affichent dans l'interface
- ✅ Le flux upload → extraction → analyse est testable localement

### [2026-05-25] - Pipeline NLP spaCy pour CV et offre

**Contexte :**
Besoin d'extraire automatiquement les hard skills, soft skills, expériences et diplômes depuis le texte du CV et de l'offre.

**Décision :**

- Ajout d'un module isolé dans `backend/nlp`
- Pipeline spaCy local basé sur `spacy.blank("fr")` + `PhraseMatcher` + extraction par règles
- Endpoint backend `POST /nlp/analyze` pour analyser CV et offre ensemble
- Réponse structurée par catégories et synthèse des éléments communs
- Tests unitaires dédiés au pipeline et à l'API

**Raison :**

- Garder une implémentation locale, simple et testable
- Éviter la dépendance à un modèle spaCy lourd à télécharger
- Fournir une structure de sortie exploitable pour la suite du matching

**Impact :**

- ✅ Entités extraites sur CV et offre
- ✅ Réponse structurée par catégories
- ✅ Composant NLP isolé dans `backend/nlp`
- ✅ Tests backend validés avec succès

### [2026-05-25] - Réparation du frontend et branchement upload vers extraction

**Contexte :**
Des fragments de JSX/TypeScript avaient cassé `App.tsx` et `CVUpload.tsx`, empêchant la compilation du frontend.

**Décision :**

- Réécriture propre des deux composants front concernés
- Conservation du flux unique: upload du CV puis extraction texte via le backend
- Affichage du texte extrait dans l'UI locale

**Raison :**

- Rétablir un frontend compilable rapidement
- Garder un parcours de test simple pour vérifier l'extraction
- Éviter de multiplier les boutons ou chemins de test

**Impact :**

- ✅ Erreurs de compilation frontend corrigées
- ✅ Upload PDF déclenche désormais l'extraction texte
- ✅ Le texte extrait est visible dans l'interface

### [2026-05-25] - Extraction texte PDF connectée au flux d'upload

**Contexte :**
Besoin de pouvoir tester directement depuis le frontend l'extraction du texte brut d'un CV PDF, avec nettoyage de base et erreur explicite si le PDF est illisible ou vide.

**Décision :**

- Ajout d'un service backend dédié à l'extraction texte PDF
- Normalisation du texte extrait: espaces compressés, lignes vides supprimées
- Route backend `POST /extract-cv-text`
- Frontend branché pour enchaîner upload puis extraction sur le même fichier
- Affichage du texte extrait dans l'interface de test locale

**Raison :**

- Permettre un test de bout en bout depuis l'UI
- Garder l'extraction local-first et explicite
- Préparer la suite du pipeline sans dépendre d'un traitement manuel

**Impact :**

- ✅ Upload PDF déclenche désormais aussi l'extraction
- ✅ Le texte extrait est visible directement dans le frontend
- ✅ Les erreurs d'extraction sont renvoyées clairement au client
- 📝 Nouveau service: `backend/services/pdf_text_extractor.py`

### [2026-05-14] - Initialisation et simplification de l'architecture

**Contexte :**
Architecture initiale trop grosse. Besoin de simplifier pour avoir juste le minimum démarrable.

**Décision :**

- Suppression de tous les fichiers/dossiers non essentiels
- Garde uniquement: main.py, requirements.txt, App.jsx, vite.config.js
- Suppression des Dockerfiles, docs verbeux, config Tailwind
- Ajout des modules au fur et à mesure des issues

**Raison :**

- Approche progressive (KISS principle)
- Évite la surcharge et les TODOs partout
- Chaque issue crée ses propres fichiers au besoin

**Impact :**

- ✅ Backend encore démarrable (20 lignes de code)
- ✅ Frontend encore démarrable (25 lignes de code)
- ✅ Structure très légère et compréhensible
- 📁 Moins de fichiers à gérer

---

### [2026-05-15] - Implémentation Issue #2: Upload PDF + Endpoint backend

**Contexte :**
Besoin d'implémenter le composant d'upload PDF côté frontend et l'endpoint correspondant au backend.

**Décision :**

- **Frontend:**
  - Composant `CVUpload.tsx` réutilisable avec gestion d'état
  - Validation côté client: type MIME + taille fichier (10 MB max)
  - Messages d'erreur/succès avec UX claire
  - Utilisation de Tailwind CSS v4 via @tailwindcss/postcss
  - Intégration dans App.tsx avec état global

- **Backend:**
  - Endpoint POST `/upload-cv` qui valide et stocke le PDF
  - Validation: type MIME, taille, extension
  - Dossier `uploads/` pour stocker les fichiers
  - Réponses JSON structurées (201 success, 400 bad request, 500 server error)

**Raison :**

- Validation côté client pour UX rapide
- Validation côté serveur pour sécurité
- Tailwind CSS pour un design cohérent sans CSS brut
- Composant isolé pour réutilisabilité

**Impact :**

- ✅ Upload PDF fonctionnel
- ✅ Gestion d'erreurs utilisateur (fichier manquant/invalide)
- ✅ Messages de feedback clairs (vert succès, rouge erreur)
- ✅ Architecture prête pour extraction texte PDF (issue #3)
- 📝 Fichiers créés: CVUpload.tsx, updated main.py, updated App.tsx
- 🎨 Interface stylisée avec Tailwind + custom CSS variables

---

### [2026-05-15] - Migration vers shadcn/ui pour design minimaliste et beau

**Contexte :**
L'interface était fonctionnelle mais utilisait des styles inline. Besoin d'un design system cohérent et minimaliste.

**Décision :**

- Créer manuellement les composants shadcn (Button, Card, Alert, Input)
- Utiliser Radix UI + Tailwind CSS + Lucide Icons
- Implémenter les variantes shadcn (default, destructive, success, outline)
- Intégrer les composants dans CVUpload et App.tsx
- Configurer les aliases TypeScript (@/_ -> src/_)

**Raison :**

- shadcn/ui est le gold standard pour design minimaliste + React
- Composants isolés et réutilisables
- Lucide Icons pour les icônes cohérentes
- Pas de CLI complications, création manuelle simple

**Impact :**

- ✅ Interface minimaliste et professionnelle
- ✅ Design system cohérent à travers l'app
- ✅ Alerts avec variantes (success, destructive)
- ✅ Boutons shadcn avec hover effects clairs
- ✅ Cards avec borders et ombres subtiles
- 🎨 Palette slate moderne
- 📝 Fichiers créés: button.tsx, card.tsx, alert.tsx, input.tsx, utils.ts
- 🔧 Configuré path aliases et Vite

---

## ⚠️ Règles importantes

- Toute décision importante DOIT être ajoutée ici
- Ne jamais supprimer une ancienne entrée
- Toujours ajouter une date
- Être clair et concis

---

## 🔄 Utilisation par l’IA

Avant toute génération de code :

1. Lire ce fichier
2. Vérifier les décisions existantes
3. Ne pas contredire les choix passés

---

## 📌 État actuel

- ✅ Architecture initialisée (2026-05-14)
- ✅ Backend FastAPI démarrable
- ✅ Frontend React démarrable
- ✅ Docker setup opérationnel
- ✅ Issue #2 complètement: Upload PDF + endpoint backend + gestion erreurs (2026-05-15)
- 🔄 Prêt pour issue #3: Extraction texte PDF

---
