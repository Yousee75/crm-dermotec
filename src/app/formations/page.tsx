import { Metadata } from 'next'
import FormationsCatalogPage from './FormationsCatalogPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Catalogue Formations Esthetique Professionnelles | Certifiees Qualiopi',
  description: 'Decouvrez nos 20+ formations esthetique et dermo-correctrice certifiees Qualiopi a Paris. Financement OPCO, CPF, France Travail. +500 stagiaires formees.',
  keywords: 'formations esthetique, formation professionnelle, certifie qualiopi, financement OPCO, CPF, dermotec, paris, estheticienne, dermo-correctrice, microneedling, laser',
  openGraph: {
    title: 'Catalogue Formations Esthetique | Dermotec Advanced',
    description: '20+ formations certifiees Qualiopi pour estheticiennes a Paris. Financement OPCO/CPF possible. +500 stagiaires formees.',
    url: 'https://crm-dermotec.vercel.app/formations',
    siteName: 'Dermotec Advanced',
    images: ['/images/formations-hero.jpg'],
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catalogue Formations Esthetique | Dermotec Advanced',
    description: '20+ formations certifiees Qualiopi pour estheticiennes a Paris. Financement OPCO/CPF possible.',
  },
  alternates: {
    canonical: 'https://crm-dermotec.vercel.app/formations',
  },
}

export default function FormationsPage() {
  return <FormationsCatalogPage />
}