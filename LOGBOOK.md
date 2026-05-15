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
