import { Metadata } from 'next'
import FormationClientPage from './FormationClientPage'
import { createClient } from '@/lib/supabase-client'

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient()

  const { data: formation } = await supabase
    .from('formations')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!formation) {
    return {
      title: 'Formation non trouvée | Dermotec Advanced',
      description: 'Cette formation n\'existe plus ou n\'est plus disponible.'
    }
  }

  return {
    title: `${formation.nom} | Formation Esthétique Certifiée Qualiopi | Dermotec Advanced`,
    description: formation.description_commerciale || formation.description || `Formation professionnelle ${formation.nom} - ${formation.duree_jours} jours - ${formation.prix_ht}€ HT - Financement possible - Certifié Qualiopi`,
    keywords: [
      formation.nom,
      'formation esthétique',
      'formation professionnelle',
      formation.categorie,
      'certifiée qualiopi',
      'financement OPCO',
      'CPF',
      'dermotec',
      'paris',
      'esthéticienne'
    ].join(', '),
    openGraph: {
      title: `${formation.nom} | Dermotec Advanced`,
      description: formation.description_commerciale || formation.description,
      images: formation.image_url ? [formation.image_url] : [],
      type: 'website',
      locale: 'fr_FR'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${formation.nom} | Dermotec Advanced`,
      description: formation.description_commerciale || formation.description,
      images: formation.image_url ? [formation.image_url] : []
    },
    alternates: {
      canonical: `https://dermotec-advanced.com/formations/${formation.slug}`
    }
  }
}

export default function FormationPage({ params }: { params: { slug: string } }) {
  return <FormationClientPage slug={params.slug} />
}