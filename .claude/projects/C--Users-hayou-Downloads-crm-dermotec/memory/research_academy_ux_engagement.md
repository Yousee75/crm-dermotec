---
name: Academy UX Engagement Patterns
description: Patterns UX Duolingo/Brilliant pour rendre l'Academy addictive - quiz interactifs, gamification, confetti, flashcards, downloadables
type: reference
---

# Academy UX Engagement — Mars 2026

## PRINCIPES D'ADDICTION POSITIVE (Duolingo)
1. Habit Loop : Cue (notif) → Routine (5min leçon) → Reward (XP, confetti)
2. Streaks : +60% engagement, 3.6x rétention à 7j, -21% churn avec Streak Freeze
3. Loss aversion : peur de perdre le streak > désir de gagner
4. Variable rewards : bonus aléatoires = résistance extinction maximale
5. Micro-sessions : 3-7min max par leçon

## TYPES DE QUIZ IMPLÉMENTABLES
1. **Multiple choice** : feedback couleur immédiat, shake wrong, pulse correct
2. **True/False** : boutons ronds rouge/vert style Tinder
3. **Fill-in-the-blank** : chips cliquables pour les options
4. **Scenario branching** : "Le prospect dit X, que répondez-vous ?" avec conséquences
5. **Image-based** : identifier une technique depuis une photo
6. **Drag & drop ordering** : ordonner les étapes du funnel (@dnd-kit)
7. **Flashcards** : flip CSS 3D + algorithme SM-2 (répétition espacée)

## ANIMATIONS CSS ESSENTIELLES
- shake (wrong answer) : translateX ±4px, 0.5s
- correctFlash : bg white→green-100, 0.6s
- checkPulse : scale 0→1.2→1, 0.4s cubic-bezier
- confetti : canvas-confetti lib, couleurs Dermotec
- badgeUnlock : scale 0→1.15→1 + rotate + blur, 0.8s
- starEntry : scale 0 rotate -180→1→0, séquencé 0.2/0.5/0.8s

## CONTENU TÉLÉCHARGEABLE
- Certificat completion (jsPDF, A4 paysage, bordure déco, score, date)
- Cheat sheets 1 page (résumé par module)
- Cartes scripts commerciaux (A5, dialogue couleur, QR code)
- Référence objections (tableau PDF)
- FAQ client par formation

## FEATURES À AJOUTER (phase suivante)
- Daily challenge (1 question/jour, +25 XP)
- Flashcard review mode (SM-2 spaced repetition)
- Bookmarks/favoris par leçon
- Notes personnelles par leçon
- Commentaires/discussion par leçon
- Leaderboard hebdomadaire
- Dark mode Academy
- Offline indicator

## COULEURS QUIZ DERMOTEC
| État | Couleur | Tailwind |
|------|---------|----------|
| Correct | #22C55E | bg-green-500 |
| Correct bg | #DCFCE7 | bg-green-100 |
| Wrong | #EF4444 | bg-red-500 |
| Wrong bg | #FEE2E2 | bg-red-100 |
| XP/Gold | #EAB308 | bg-yellow-500 |
| Streak fire | #F97316 | bg-orange-500 |
| Badge | #8B5CF6 | bg-violet-500 |

## LIBRAIRIES RECOMMANDÉES
- canvas-confetti : célébrations
- jspdf : certificats PDF
- @dnd-kit : drag & drop quiz
- motion (framer-motion) : animations level-up, badges
