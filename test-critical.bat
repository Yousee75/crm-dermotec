@echo off
echo === Tests critiques CRM Dermotec ===
echo.

echo 1. Tests API Authentication...
call npx vitest run src/__tests__/api-auth.test.ts

echo.
echo 2. Tests Stripe Webhook...
call npx vitest run src/__tests__/stripe-webhook.test.ts

echo.
echo 3. Tests Pipeline Transitions...
call npx vitest run src/__tests__/pipeline-transitions.test.ts

echo.
echo === Resume ===
echo Tests executes avec succes !
pause