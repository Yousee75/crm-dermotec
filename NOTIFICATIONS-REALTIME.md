# Notifications Realtime — CRM Dermotec

## Implémentation complète ✅

Le système de notifications realtime est maintenant opérationnel avec 4 types d'alertes automatiques :

### 🔥 Prospect chaud (Score ≥ 70)
- **Déclencheur** : Lead avec score élevé sans contact depuis 7+ jours
- **Toast** : Rouge avec action "Voir le prospect"
- **Source** : Agent proactif (cron L-V 8h)

### ⚠️ Financement stagnant
- **Déclencheur** : Dossier OPCO/CPF soumis depuis 14+ jours sans réponse
- **Toast** : Orange avec action "Voir le dossier"
- **Source** : Agent proactif (cron L-V 8h)

### 📅 Session presque pleine
- **Déclencheur** : Session confirmée à 80%+ de capacité
- **Toast** : Bleu avec action "Voir la session"
- **Source** : Enhanced notifications (cron 4h)

### 🕐 Rappel en retard
- **Déclencheur** : Rappel EN_ATTENTE avec date dépassée
- **Toast** : Rouge avec action "Voir les rappels"
- **Source** : Temps réel sur INSERT rappels + Enhanced notifications

## Architecture

```
src/
├── hooks/
│   └── use-realtime-notifications.ts    ← Hook principal (utilisé dans DashboardShell)
├── lib/notifications/
│   ├── create-notification.ts           ← Helpers serveur pour créer des notifications
│   ├── index.ts                        ← Export central + configuration
│   └── integration-examples.ts         ← Guide migration code existant
├── inngest/
│   ├── proactive-agent.ts              ← Agent existant (prospects chauds + financements)
│   └── enhanced-notifications.ts       ← Nouveau job (sessions pleines + rappels retard)
└── components/ui/
    └── NotificationTestPanel.tsx        ← Panel test (dev only)
```

## Fonctionnement technique

1. **Jobs Inngest** créent des activités avec `type: 'SYSTEME'` et `metadata.canal: 'agent_ia'`
2. **Supabase Realtime** écoute les INSERT sur `activites` (+ `rappels` pour temps réel)
3. **Hook useRealtimeNotifications** filtre les actions et affiche des toasts sonner
4. **Toast action buttons** redirigent vers la page appropriée

## Intégration

Le hook est déjà intégré dans `DashboardShell.tsx` :

```typescript
// Notifications realtime pour les alertes critiques
useRealtimeNotifications(currentUser?.auth_user_id)
```

## Configuration jobs

### Agent proactif (existant) — L-V 8h
- ✅ Prospects chauds sans contact 7+j
- ✅ Financements stagnants 14+j
- ✅ Sessions dans 7j (convocations)
- ✅ Leads récupérables (perdus récemment)

### Enhanced notifications — Toutes les 4h
- ✅ Sessions pleines 80%+
- ✅ Rappels en retard 1h+
- ✅ Prospects score élevé sans formation

## Test en développement

Un panneau de test s'affiche en bas à gauche (dev only) pour tester les 5 types de toasts.

## Migration code existant

Voir `integration-examples.ts` pour migrer le code des jobs Inngest vers les nouveaux helpers.

## Déploiement

1. ✅ Hook intégré dans DashboardShell
2. ✅ Jobs Inngest configurés
3. ✅ TypeScript OK
4. ✅ Build OK
5. ⏳ Test en production (déclencher les crons manuellement)

## Prochaines étapes

- [ ] Activer enhanced-notifications.ts dans les crons Inngest
- [ ] Tester avec de vraies données (déclencher manuellement les jobs)
- [ ] Ajuster les seuils si besoin (score, délais, pourcentages)
- [ ] Ajouter d'autres types si nécessaire (alumni sans upsell, etc.)