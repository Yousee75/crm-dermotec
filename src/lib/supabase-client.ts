import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallback safe pour le build SSG (pas de vrai client)
  if (!url || !key || url === 'placeholder' || key === 'placeholder') {
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDIwNjY0MjAsImV4cCI6MTk1NzY0MjQyMH0.placeholder'
    )
  }

  return createBrowserClient(url, key)
}
