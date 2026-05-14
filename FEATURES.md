# FEATURES.md

## 🎯 Objectif du projet

Créer une application web capable d’analyser un CV (PDF) et une offre d’emploi afin de calculer un score de compatibilité, identifier les forces/faiblesses du profil et proposer des améliorations concrètes.

---

## 🧠 Analyse IA

### Matching sémantique

* Comparaison entre CV et offre d’emploi
* Utilisation d’embeddings (sentence-transformers)
* Score global de compatibilité

### Extraction d’informations

* Compétences techniques (hard skills)
* Soft skills
* Expériences professionnelles
* Diplômes / formations

### Score détaillé

* Score global (%)
* Sous-scores :

  * compétences
  * expérience
  * formation
  * soft skills

---

## 📊 Visualisation

### Radar chart des compétences

* Comparaison entre :

  * compétences du candidat
  * compétences attendues

### Indicateurs visuels

* barres de progression
* score global mis en avant
* points forts / faibles

---

## ✍️ Suggestions d’amélioration

### Recommandations actionnables

* compétences à ajouter
* mots-clés manquants (optimisation ATS)
* amélioration de formulation
* conseils sur structure du CV

### Suggestions générées par LLM

* reformulation de phrases
* amélioration du contenu
* conseils personnalisés

---

## 📁 Gestion des fichiers

* Upload de CV (PDF)
* Extraction du texte
* Analyse côté backend

---

## 🎨 Interface utilisateur

* Design minimaliste
* Dark / Light mode
* UI basée sur Shadcn
* Interface simple :

  * upload CV
  * champ texte offre
  * affichage résultats

---

## 🚀 Bonus possibles

* Génération d’un CV amélioré
* Export PDF du rapport
* Historique des analyses
* Simulation recruteur
* Score ATS (compatibilité systèmes de tri)

---
