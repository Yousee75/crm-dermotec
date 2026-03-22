# CHECKLIST PRODUCTION — CRM DERMOTEC

## Avant CHAQUE déploiement Vercel

### Build
- [ ] `npm run build` passe sans erreur
- [ ] Aucun @ts-nocheck ajouté (dette technique)
- [ ] Aucun console.log de debug
- [ ] Toutes les routes API ont `export const dynamic = 'force-dynamic'`

### Sécurité
- [ ] Auth vérifié sur les nouvelles routes API
- [ ] Validation zod sur tous les inputs
- [ ] Pas de secret hardcodé
- [ ] RLS policies OK si nouvelle table
- [ ] Pas de dangerouslySetInnerHTML sans sanitization

### UX / Design
- [ ] Touch targets >= 44px sur mobile
- [ ] Couleurs du design system (pas de hex hardcodé)
- [ ] Textes en français (pas de "Lorem ipsum" oublié)
- [ ] Loading states (skeleton ou spinner)
- [ ] Empty states avec message et CTA
- [ ] Responsive testé (mobile 375px, tablet 768px, desktop 1280px)

### Tests
- [ ] Tests existants passent (`npm test`)
- [ ] Nouveaux tests pour les nouvelles fonctionnalités critiques
- [ ] Test manuel du happy path

### Performance
- [ ] Pas de query N+1 (vérifier les boucles avec await)
- [ ] Images optimisées (next/image)
- [ ] Pas de bundle inutile importé côté client

## Après déploiement

### Vérification immédiate
- [ ] Site accessible (pas d'erreur 500)
- [ ] Login fonctionne
- [ ] Dashboard charge
- [ ] API /health répond 200

### Vérification J+1
- [ ] Sentry : pas de nouvelles erreurs
- [ ] Supabase : pas de queries lentes
- [ ] Stripe : webhooks reçus
- [ ] Vercel : pas de function timeout

## Critères de rollback
- Erreur 500 sur page critique (login, dashboard, pipeline)
- Perte de données (insert/update cassé)
- Faille sécurité (route API exposée)
- Performance dégradée (>3s de chargement)
→ Action : `npx vercel rollback` immédiat
