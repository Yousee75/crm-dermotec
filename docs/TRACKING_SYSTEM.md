# Système de Tracking Utilisateur - CRM Dermotec

## Vue d'ensemble

Le système de tracking capture **TOUS** les mouvements utilisateur dans le CRM pour fournir un audit complet et des analytics comportementales. Chaque clic, navigation, modification de données est tracée avec métadonnées.

## Architecture

### 1. Client-side Tracking (`src/lib/user-tracker.ts`)

**Tracker singleton** qui capture automatiquement :
- ✅ Navigations entre pages (`page_view`, `page_leave` avec durée)
- ✅ Clics sur éléments importants (boutons, liens)
- ✅ Modifications de leads/sessions/financements
- ✅ Actions métier (exports, emails, uploads, IA)
- ✅ Erreurs JavaScript et promesses rejetées

**Buffer intelligent** :
- Batch de 10 événements ou flush toutes les 30s
- Debounce clics (500ms) pour éviter spam
- Déduplication automatique
- Fallback console.log si API échoue
- Rate limit côté client (max 50 events en buffer)

### 2. API Route (`src/app/api/tracking/route.ts`)

**Endpoint POST `/api/tracking`** :
- Rate limiting : 100 events/min par user
- Enrichissement : IP, User-Agent, timestamps serveur
- Déduplication côté serveur
- Stockage en base via service role (bypass RLS)
- Non-bloquant : ne retourne jamais 500

### 3. Base de données (`supabase/migrations/015_user_tracking.sql`)

**Table `user_events`** avec partitionnement pour performance :
```sql
- id (BIGSERIAL)
- user_id (UUID → auth.users)
- event (TEXT) -- Type d'événement
- page (TEXT) -- URL/route
- target (TEXT) -- Élément ciblé
- duration_ms (INTEGER) -- Durée pour page_leave
- metadata (JSONB) -- Contexte flexible
- ip_address, user_agent -- Enrichissement serveur
- client_timestamp, created_at -- Double horodatage
```

**Index optimisés** :
- `idx_user_events_user_created` : audit par utilisateur
- `idx_user_events_metadata` : recherche JSON avec GIN
- `idx_user_events_created_day` : agrégations quotidiennes

**Vues matérialisées** :
- `v_daily_activity` : KPIs quotidiens
- `v_user_sessions` : regroupement sessions (gap 30min)
- `v_activity_heatmap` : répartition 24h × 7j
- `v_users_online` : qui est connecté (5 dernières minutes)

### 4. Interface d'audit (`src/app/(dashboard)/audit/page.tsx`)

**Page admin complète** :
- 📊 KPIs temps réel (actions aujourd'hui, utilisateurs actifs)
- 🔍 Filtres : utilisateur, type d'événement, période, recherche textuelle
- 📋 Timeline chronologique avec détails métadonnées
- 🎨 Code couleur par type d'action (vert=create, rouge=delete)
- 📥 Export CSV complet
- 👥 "Qui est en ligne" en temps réel

## Types d'événements

### Navigation
- `page_view` : Visite d'une page
- `page_leave` : Sortie de page (avec durée)

### Leads/CRM
- `lead_viewed` : Consultation fiche lead
- `lead_edited` : Modification d'un champ
- `lead_created` : Création lead
- `lead_deleted` : Suppression lead
- `lead_status_changed` : Changement statut

### Sessions/Formations
- `session_viewed`, `session_created`
- `inscription_created`

### Documents/Exports
- `document_uploaded`, `document_downloaded`
- `export_csv`, `export_pdf`

### Communications
- `email_sent`, `call_logged`, `note_added`

### Système
- `login`, `logout`, `settings_changed`
- `ai_used`, `search_performed`, `filter_applied`
- `click` : Clic générique

## Usage Development

### 1. Auto-tracking (transparent)

```tsx
// DashboardShell.tsx
import { usePageTracker } from '@/hooks/use-tracker'

export default function DashboardShell() {
  usePageTracker() // Auto-track toutes les navigations
  return <div>...</div>
}
```

### 2. Tracking manuel

```tsx
import { useTrack, trackingHelpers } from '@/hooks/use-tracker'

function LeadDetail({ leadId }) {
  const { track } = useTrack()

  useEffect(() => {
    trackingHelpers.leadView(leadId)
  }, [leadId])

  const handleStatusChange = (newStatus) => {
    trackingHelpers.leadStatusChange(leadId, oldStatus, newStatus)
    // ... logique métier
  }

  const handleExport = () => {
    track('export_pdf', {
      lead_id: leadId,
      export_type: 'fiche_lead'
    })
  }
}
```

### 3. Composants trackés

```tsx
import { TrackedButton, TrackedLink } from '@/components/ui'

// Bouton auto-tracké
<TrackedButton
  trackingId="export-leads"
  trackingEvent="export_csv"
  trackingMetadata={{ entity: 'leads', count: leads.length }}
  onClick={handleExport}
>
  Exporter CSV
</TrackedButton>

// Lien auto-tracké
<TrackedLink
  href="/leads/123"
  trackingId="lead-view-from-list"
  trackingMetadata={{ source: 'leads_list', position: index }}
>
  Voir le lead
</TrackedLink>
```

### 4. Tracking de composants

```tsx
import { useComponentTimer, useFormTracker } from '@/hooks/use-tracker'

function ComplexComponent() {
  // Track temps passé sur ce composant
  useComponentTimer('complex-component')

  const formTracker = useFormTracker('lead-creation')

  const handleFieldChange = (field, oldValue, newValue) => {
    formTracker.trackFieldChange(field, oldValue, newValue)
  }
}
```

## Configuration

### Initialisation (Layout)

```tsx
// app/layout.tsx
import { TrackerProvider } from '@/components/TrackerProvider'

export default function RootLayout({ children }) {
  return (
    <TrackerProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
    </TrackerProvider>
  )
}
```

### Variables d'environnement

```bash
# Supabase pour stockage (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # Pour bypass RLS

# Optionnel : Redis pour rate limiting avancé
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Sécurité & Performance

### RLS (Row Level Security)
- ✅ Insertion : tous users pour leurs événements
- ✅ Lecture : seuls admins voient tous, users voient leurs events
- ✅ Service role bypass pour l'API

### Rate Limiting
- ✅ 100 events/minute par utilisateur
- ✅ Max 20 events par batch
- ✅ Debounce clics 500ms

### Cleanup automatique
- ✅ Fonction `cleanup_old_user_events()` : supprime > 90 jours
- ✅ À exécuter via cron quotidien

### Données sensibles
- ❌ Jamais de mots de passe dans metadata
- ✅ Limitation taille user_agent (500 chars)
- ✅ IP anonymisée possible (masquer derniers octets)

## Queries utiles

```sql
-- Top pages aujourd'hui
SELECT page, COUNT(*) as visits
FROM user_events
WHERE event = 'page_view' AND date_trunc('day', created_at) = CURRENT_DATE
GROUP BY page ORDER BY visits DESC;

-- Utilisateurs les plus actifs
SELECT p.email, COUNT(*) as actions
FROM user_events ue JOIN profiles p ON ue.user_id = p.id
WHERE ue.created_at > NOW() - INTERVAL '7 days'
GROUP BY p.id, p.email ORDER BY actions DESC;

-- Temps moyen par page
SELECT page, AVG(duration_ms)/1000 as avg_seconds
FROM user_events
WHERE event = 'page_leave' AND duration_ms IS NOT NULL
GROUP BY page ORDER BY avg_seconds DESC;

-- Actions suspectes (détection anomalies)
SELECT user_id, COUNT(*) as rapid_actions
FROM user_events
WHERE created_at > NOW() - INTERVAL '1 minute'
GROUP BY user_id
HAVING COUNT(*) > 50;
```

## Roadmap

### V1 (Actuel)
- ✅ Tracking complet client/serveur
- ✅ Interface d'audit admin
- ✅ RLS + sécurité

### V2 (Future)
- 📊 Analytics prédictives (ML sur user_events)
- 🎯 Recommandations personnalisées
- 📈 A/B testing framework
- 🔔 Alertes anomalies temps réel
- 📱 Mobile app tracking
- 🌍 Géolocalisation (opt-in)

---

**Équipe : CRM Dermotec | Yossi Hayoun**