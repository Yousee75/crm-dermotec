import { createBrowserClient } from '@supabase/ssr'

let _warned = false

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Vérifier que les variables sont configurées
  const urlValid = url && url.startsWith('https://') && !url.includes('placeholder')
  const keyValid = key && key.startsWith('eyJ') && !key.includes('placeholder') && key.length > 100

  if (!urlValid || !keyValid) {
    if (!_warned && typeof window !== 'undefined') {
      _warned = true
      console.error(
        '[Supabase] Variables d\'environnement non configurées.\n' +
        'Créez un fichier .env.local avec :\n' +
        '  NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co\n' +
        '  NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon\n' +
        'Les mutations (créer, modifier, supprimer) ne fonctionneront pas.'
      )
    }

    // Fallback pour le build SSG — permet le rendu mais les mutations échoueront
    return createBrowserClient(
      url || 'https://placeholder.supabase.co',
      key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
    )
  }

  return createBrowserClient(url, key)
}
