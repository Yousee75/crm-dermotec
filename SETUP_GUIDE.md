# CRM DERMOTEC — Guide de configuration complet

## Ordre de configuration

```
1. VARIABLES D'ENV (obligatoires en premier)
2. SUPABASE (migrations + bucket + user)
3. STRIPE (webhook endpoint)
4. INNGEST (background jobs)
5. VERCEL (env vars production)
6. OPTIONNELS (Turnstile, VirusTotal, Twilio, IA)
```

---

## 1. VARIABLES D'ENVIRONNEMENT

Copier `.env.local.example` → `.env.local` et remplir :

### OBLIGATOIRES (le CRM ne fonctionne pas sans)

| Variable | Où la trouver | Exemple |
|----------|--------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | `https://wtbrdxijvtelluwfmgsf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | `eyJ...` |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Endpoint → Signing secret | `whsec_...` |
| `RESEND_API_KEY` | https://resend.com → API Keys | `re_...` |
| `CRON_SECRET` | Générer : `openssl rand -hex 32` | `a1b2c3...` |

### IA (au moins 1 requis)

| Variable | Service | Coût |
|----------|---------|------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | Pay-per-use |
| `MISTRAL_API_KEY` | https://console.mistral.ai | Pay-per-use |
| `OPENAI_API_KEY` | https://platform.openai.com | Pay-per-use |

### OPTIONNELS (fonctionnent sans, mode dégradé)

| Variable | Service | Gratuit ? |
|----------|---------|-----------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile | Oui |
| `VIRUSTOTAL_API_KEY` | VirusTotal | Oui (500/jour) |
| `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER` | Twilio SMS/WhatsApp | Payant |
| `PERPLEXITY_API_KEY` ou `TAVILY_API_KEY` | Recherche web IA | Payant / Gratuit |
| `INNGEST_API_KEY` + `INNGEST_EVENT_KEY` | Inngest background jobs | Gratuit |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Rate limiting Redis | Gratuit (10k/jour) |

---

## 2. SUPABASE — Migrations SQL

URL : https://supabase.com/dashboard/project/wtbrdxijvtelluwfmgsf/sql/new

### Exécuter dans cet ordre :

```
001_initial_schema.sql          ← Tables core (22 tables)
002_audit_trail.sql             ← Audit + field_history
003_emails_analytics.sql
003_fixes_rls_emails_seeds_transitions.sql
004_ai_enrichment.sql
004_cqrs_views_audit.sql
004_webhook_events_consent_deliveries.sql
005_materialized_views_partitioning.sql
005_phase1_emargement_portail.sql
006_phase2_messages_communication.sql
007_knowledge_base.sql
008_materialized_views_partitioning.sql
008_playbook_onboarding.sql
009_security_hardening.sql
010_commercial_objectives_coaching.sql
010_rls_performance_select_auth_uid.sql
011_rls_optimization.sql
012_stripe_idempotency.sql
```

Puis les données démo :
```
seeds/demo_data.sql             ← 25 leads, 5 sessions, 6 inscriptions
```

### Créer le bucket Storage

Dashboard → Storage → New Bucket :
- Nom : `documents`
- Public : NON (privé)
- Max file size : 10 MB
- MIME types : `image/jpeg, image/png, image/webp, application/pdf`

### Créer le premier utilisateur

Dashboard → Authentication → Users → Add User :
- Email : ton email
- Password : ton mot de passe
- Après création : copier le `user_id` et l'associer dans la table `equipe` :
```sql
UPDATE equipe SET auth_user_id = 'UUID-DU-USER' WHERE email = 'ton@email.com';
```

---

## 3. STRIPE — Webhook

Dashboard → Developers → Webhooks → Add Endpoint :
- URL : `https://crm-dermotec.vercel.app/api/stripe/webhook`
- Events : `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`, `invoice.paid`, `invoice.payment_failed`
- Copier le Signing Secret → `STRIPE_WEBHOOK_SECRET`

Les 11 produits + prix sont déjà créés (sandbox).

---

## 4. INNGEST — Background Jobs

Inscription : https://app.inngest.com/
- Créer app `crm-dermotec`
- Copier `INNGEST_API_KEY` et `INNGEST_EVENT_KEY`
- Les fonctions s'enregistrent automatiquement au démarrage

---

## 5. VERCEL — Variables de production

Dashboard → Project → Settings → Environment Variables :
Ajouter TOUTES les variables de `.env.local` pour les 3 environnements (Production, Preview, Development).

---

## 6. CRONS (optionnel)

2 endpoints à appeler quotidiennement :

```bash
# 8h00 — Auto-transition sessions
curl -H "Authorization: Bearer ${CRON_SECRET}" https://crm-dermotec.vercel.app/api/sessions/auto-transition

# 9h00 — Cadences commerciales
curl -H "Authorization: Bearer ${CRON_SECRET}" https://crm-dermotec.vercel.app/api/cadence/run
```

Configurable via Vercel Crons, GitHub Actions, ou n8n.

---

## 7. TEST FINAL

```bash
# Health check
curl https://crm-dermotec.vercel.app/api/health

# Login
Ouvrir https://crm-dermotec.vercel.app/login
→ Email + password du user créé
→ Dashboard doit s'afficher avec les données démo
```

---

## Problèmes courants

| Erreur | Solution |
|--------|----------|
| Page blanche après login | Clé anon Supabase manquante ou invalide |
| "Invalid supabaseUrl" | Vérifier `NEXT_PUBLIC_SUPABASE_URL` dans Vercel env |
| Webhook Stripe non reçu | Vérifier URL endpoint + `STRIPE_WEBHOOK_SECRET` |
| Emails non envoyés | Vérifier `RESEND_API_KEY` + domaine vérifié dans Resend |
| RLS bloque les données | User doit être `authenticated` (connecté) |
| IA ne répond pas | Au moins 1 clé IA configurée |
