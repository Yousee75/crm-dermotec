import { createBrowserClient } from '@supabase/ssr'

// Real Supabase project URL — used as fallback for demo/build
const DEMO_URL = 'https://wtbrdxijvtelluwfmgsf.supabase.co'
const DEMO_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0YnJkeGlqdnRlbGx1d2ZtZ3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.demo-placeholder-key'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Use env vars if valid, otherwise use demo project URL
  const safeUrl = (url && url.startsWith('https://') && url.includes('.supabase.co')) ? url : DEMO_URL
  const safeKey = (key && key.startsWith('eyJ') && key.length > 50) ? key : DEMO_KEY

  return createBrowserClient(safeUrl, safeKey)
}
