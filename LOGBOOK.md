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
- 🔄 Prêt pour development des features (issues #2+)

---
