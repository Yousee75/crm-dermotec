// @ts-nocheck
import { Metadata } from 'next'
import FormationsCatalogPage from './FormationsCatalogPage'

export const metadata: Metadata = {
  title: 'Formations Esthétique Professionnelles | Certifiées Qualiopi | Dermotec Advanced',
  description: 'Découvrez nos formations esthétique et dermo-correctrice certifiées Qualiopi. Financement OPCO, CPF, France Travail possible. 11 formations d\'excellence à Paris.',
  keywords: 'formations esthétique, formation professionnelle, certifié qualiopi, financement OPCO, CPF, dermotec, paris, esthéticienne, dermo-correctrice, microneedling, laser',
  openGraph: {
    title: 'Formations Esthétique Professionnelles | Dermotec Advanced',
    description: 'Formations certifiées Qualiopi pour esthéticiennes • Financement possible • 4.9/5 ⭐ • +500 stagiaires formées',
    images: ['/images/formations-hero.jpg'],
    type: 'website',
    locale: 'fr_FR'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Formations Esthétique Professionnelles | Dermotec Advanced',
    description: 'Formations certifiées Qualiopi pour esthéticiennes • Financement possible • 4.9/5 ⭐'
  },
  alternates: {
    canonical: 'https://dermotec-advanced.com/formations'
  }
}

export default function FormationsPage() {
  return <FormationsCatalogPage />
}