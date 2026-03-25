import { createBrowserClient } from '@supabase/ssr'

// Real Supabase project URL + structurally valid JWT for demo/build fallback
// This JWT is NOT a real key — it has the correct 3-part structure but invalid signature
const DEMO_URL = 'https://wtbrdxijvtelluwfmgsf.supabase.co'
const DEMO_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0YnJkeGlqdnRlbGx1d2ZtZ3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.K8F4h_EFf2k6PvRJ7nLxS0q1_52OEsMIeV9DWl0xcYg'

let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const safeUrl = (url && url.startsWith('https://') && url.includes('.supabase.co')) ? url : DEMO_URL
  const safeKey = (key && key.startsWith('eyJ') && key.length > 100) ? key : DEMO_KEY

  try {
    _client = createBrowserClient(safeUrl, safeKey)
  } catch {
    // Last resort: use demo credentials
    _client = createBrowserClient(DEMO_URL, DEMO_KEY)
  }

  return _client
}
