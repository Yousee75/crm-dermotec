// ============================================================
// Vitest global setup
// ============================================================

import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'
process.env.RESEND_API_KEY = 're_test_123'

// Mock console.warn pour ne pas polluer les tests
vi.spyOn(console, 'warn').mockImplementation(() => {})
