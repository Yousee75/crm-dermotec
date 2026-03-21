import { createBrowserClient } from '@supabase/ssr'

// Fallback URL valide pour le build SSG et demo mode
const FALLBACK_URL = 'https://wtbrdxijvtelluwfmgsf.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0YnJkeGlqdnRlbGx1d2ZtZ3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Use real credentials if available, otherwise fallback
  const safeUrl = url && url.startsWith('https://') ? url : FALLBACK_URL
  const safeKey = key && key.startsWith('eyJ') ? key : FALLBACK_KEY

  return createBrowserClient(safeUrl, safeKey)
}
