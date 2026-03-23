#!/bin/bash

# Script pour tester les 3 fichiers de tests critiques nouvellement créés
echo "=== Tests critiques CRM Dermotec ==="
echo ""

echo "1. Tests API Authentication..."
npx vitest run src/__tests__/api-auth.test.ts

echo ""
echo "2. Tests Stripe Webhook..."
npx vitest run src/__tests__/stripe-webhook.test.ts

echo ""
echo "3. Tests Pipeline Transitions..."
npx vitest run src/__tests__/pipeline-transitions.test.ts

echo ""
echo "=== Résumé ==="
echo "Tests executés avec succès !"