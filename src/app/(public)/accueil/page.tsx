import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Gauge,
  CreditCard,
  Calendar,
  Award,
  BarChart3,
  Sparkles,
  Check,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dermotec CRM by Satorea — Le CRM pour les centres de formation esthétique',
  description:
    'Pipeline commercial, financement OPCO/CPF, gestion Qualiopi, inscriptions — tout en un. Le CRM conçu pour les centres de formation esthétique.',
}

const features = [
  {
    icon: Gauge,
    title: 'Pipeline Kanban',
    description:
      'Visualisez vos leads du premier contact à l\u2019inscription. 11 statuts personnalisés, glisser-déposer, filtres avancés.',
  },
  {
    icon: CreditCard,
    title: 'Financement automatisé',
    description:
      'Dossiers OPCO, CPF, France Travail en 3 clics. Suivi en temps réel, relances automatiques, 12 organismes pré-configurés.',
  },
  {
    icon: Calendar,
    title: 'Sessions & Planning',
    description:
      'Planifiez vos formations, gérez les places et les formatrices. Calendrier visuel, gestion du matériel et des salles.',
  },
  {
    icon: Award,
    title: 'Certificats & Conventions',
    description:
      'Générez vos documents Qualiopi en PDF. Conventions, attestations, certificats — conformes et prêts à envoyer.',
  },
  {
    icon: BarChart3,
    title: 'Analytics temps réel',
    description:
      'CA, conversion, remplissage — tout en un dashboard. Suivez les 7 critères et 32 indicateurs Qualiopi.',
  },
  {
    icon: Sparkles,
    title: 'Assistant IA',
    description:
      'Suggestions proactives, scoring leads, relances automatiques. L\u2019IA qui comprend la formation esthétique.',
  },
]

const plans = [
  {
    name: 'Découverte',
    price: 'Gratuit',
    period: '',
    features: [
      '50 leads',
      '1 utilisateur',
      'Pipeline kanban',
      'Email templates',
    ],
    cta: 'Commencer',
    ctaHref: '/login',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '49€',
    period: '/mois HT',
    features: [
      'Tout Découverte +',
      '500 leads · 5 utilisateurs',
      'Financement dossiers',
      'Analytics avancé',
      'Cadences automatisées',
    ],
    cta: 'Essai gratuit 14 jours',
    ctaHref: '/login',
    highlighted: true,
  },
  {
    name: 'Expert',
    price: '99€',
    period: '/mois HT',
    features: [
      'Tout Pro +',
      'Leads illimités · 15 utilisateurs',
      'Assistant IA',
      'API + Webhooks',
      'Support téléphonique',
    ],
    cta: 'Essai gratuit 14 jours',
    ctaHref: '/login',
    highlighted: false,
  },
]

const testimonials = [
  {
    quote:
      'On est passés de fichiers Excel à un vrai pipeline. En 2 mois, notre taux de conversion a doublé. Les dossiers OPCO se montent en 5 minutes.',
    name: 'Sophie Lefèvre',
    role: 'Gérante',
    company: 'Institut Beauté Parisienne',
  },
  {
    quote:
      'Le suivi Qualiopi est un game changer. Avant, on passait 2 jours à préparer l\u2019audit. Maintenant, tout est prêt en temps réel.',
    name: 'Nadia Benmoussa',
    role: 'Directrice pédagogique',
    company: 'Formation Esthétique Lyon',
  },
  {
    quote:
      'L\u2019assistant IA m\u2019a permis de relancer 40 leads oubliés. 12 se sont inscrits. Le ROI est immédiat.',
    name: 'Claire Dubois',
    role: 'Responsable commerciale',
    company: 'Académie Belle Peau',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* ──────────── HERO ──────────── */}
      <section
        className="relative flex flex-col items-center justify-center min-h-screen px-4 py-20 text-center"
        style={{ background: 'linear-gradient(180deg, #082545 0%, #0F3460 100%)' }}
      >
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white max-w-4xl leading-tight mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Le CRM qui comprend les centres de formation esthétique
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-10">
          Pipeline commercial, financement OPCO/CPF, gestion Qualiopi, inscriptions — tout en un.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white font-semibold px-8 py-3.5 text-base transition-all duration-150 shadow-lg hover:shadow-xl"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 hover:border-white text-white font-semibold px-8 py-3.5 text-base transition-all duration-150"
          >
            Voir les tarifs
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-sm text-gray-400 mb-14">
          500+ stagiaires formés &middot; 4.9/5 Google &middot; Certifié Qualiopi
        </p>

        {/* Screenshot placeholder */}
        <div className="w-full max-w-4xl aspect-video rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Interface CRM</span>
        </div>
      </section>

      {/* ──────────── FEATURES ──────────── */}
      <section className="bg-white py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#082545] text-center mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Tout ce dont votre centre a besoin
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14">
            6 modules pensés pour les centres de formation esthétique. Rien de superflu.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="p-6 rounded-2xl border border-gray-100 hover:border-[#2EC6F3]/30 hover:shadow-md transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-[#2EC6F3]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#2EC6F3]" />
                  </div>
                  <h3
                    className="text-lg font-bold text-[#082545] mb-2"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ──────────── PLANS ──────────── */}
      <section className="bg-[#F8FAFC] py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#082545] text-center mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Des tarifs pensés pour les TPE
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14">
            14 jours d&apos;essai gratuit sur tous les plans payants. Sans carte bancaire.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col bg-white rounded-2xl border-2 p-6 transition-shadow ${
                  plan.highlighted
                    ? 'border-[#2EC6F3] shadow-lg shadow-[#2EC6F3]/10'
                    : 'border-gray-100'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-[#2EC6F3] px-3 py-0.5 text-xs font-semibold text-white">
                    Populaire
                  </span>
                )}

                <h3
                  className="text-xl font-bold text-[#082545] mb-1"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span
                    className="text-3xl font-bold text-[#082545]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-sm text-gray-400">{plan.period}</span>}
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-[#2EC6F3] mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaHref}
                  className={`block text-center rounded-xl py-2.5 px-4 text-sm font-medium transition-all duration-150 ${
                    plan.highlighted
                      ? 'bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white shadow-sm hover:shadow-md'
                      : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center">
            <Link href="/pricing" className="text-sm text-[#2EC6F3] hover:underline font-medium">
              Voir tous les plans &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* ──────────── TESTIMONIALS ──────────── */}
      <section className="bg-white py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#082545] text-center mb-14"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Ce qu&apos;en disent nos utilisateurs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-gray-100 p-6 flex flex-col"
              >
                <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-[#082545]">{t.name}</p>
                  <p className="text-xs text-gray-400">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── CTA FINAL ──────────── */}
      <section className="bg-[#082545] py-20 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Prêt à digitaliser votre centre ?
          </h2>
          <p className="text-gray-300 mb-10">
            14 jours d&apos;essai gratuit. Sans engagement. Sans carte bancaire.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-[#2EC6F3] hover:bg-[#1BA8D4] text-white font-semibold px-8 py-3.5 text-base transition-all duration-150 shadow-lg hover:shadow-xl"
          >
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="bg-[#0A1E35] text-gray-400 py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Produit */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/#features" className="hover:text-[#2EC6F3] transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-[#2EC6F3] transition-colors">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/aide" className="hover:text-[#2EC6F3] transition-colors">
                    Aide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-gray-500">À propos</span>
                </li>
                <li>
                  <span className="text-gray-500">Blog</span>
                </li>
                <li>
                  <span className="text-gray-500">Carrières</span>
                </li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/conditions-generales" className="hover:text-[#2EC6F3] transition-colors">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="/politique-confidentialite" className="hover:text-[#2EC6F3] transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="hover:text-[#2EC6F3] transition-colors">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="/dpa" className="hover:text-[#2EC6F3] transition-colors">
                    DPA
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>support@satorea.fr</li>
                <li>01 88 33 43 43</li>
                <li>75 Bd Richard Lenoir, 75011 Paris</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            &copy; 2026 Satorea &middot; Dermotec CRM &middot; Made in Paris
          </div>
        </div>
      </footer>
    </>
  )
}
