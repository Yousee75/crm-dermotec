export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { PLANS_PRICING } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Tarifs CRM Formation Esthetique | Plans et Prix',
  description:
    'Plans et tarifs du CRM Dermotec Advanced pour centres de formation esthetique. Gratuit pour demarrer, puissant pour grandir. Essai 14 jours sans engagement.',
  openGraph: {
    title: 'Tarifs CRM Formation Esthetique | Dermotec Advanced',
    description: 'CRM specialise formation esthetique. Plan gratuit, Pro 79EUR/mois, Expert 149EUR/mois. Essai 14 jours sans engagement.',
    url: 'https://crm-dermotec.vercel.app/pricing',
    siteName: 'Dermotec Advanced',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs CRM Formation Esthetique | Dermotec Advanced',
    description: 'CRM specialise formation esthetique. Plan gratuit, Pro 79EUR/mois, Expert 149EUR/mois. Essai 14 jours.',
  },
}

// Adapter les plans depuis constants.ts avec les propriétés nécessaires pour cette page
const plans = PLANS_PRICING.map(plan => ({
  ...plan,
  description: plan.name === 'Découverte' ? 'Pour tester et démarrer en toute sérénité.' :
              plan.name === 'Pro' ? 'Pour les centres en croissance.' :
              plan.name === 'Expert' ? 'Pour les centres ambitieux qui veulent tout automatiser.' :
              'Pour les groupes multi-sites avec besoins spécifiques.',
  ctaHref: plan.ctaHref.replace('/login', '/auth/signup').replace('/contact', '/contact?plan=clinique'),
  badge: plan.highlighted ? 'Populaire' : null,
}))

const faqs = [
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer:
      'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Le changement prend effet immédiatement et la facturation est ajustée au prorata.',
  },
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer:
      'L\'essai de 14 jours vous donne accès à toutes les fonctionnalités du plan choisi. Aucune carte bancaire n\'est requise pour démarrer. À la fin de l\'essai, vous choisissez de continuer ou de passer au plan Découverte.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Absolument. Vos données sont hébergées en Europe, chiffrées au repos et en transit. Nous sommes conformes au RGPD et proposons un DPA sur demande pour le plan Clinique.',
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      'Nous acceptons les cartes bancaires (Visa, Mastercard, Amex), les prélèvements SEPA et les virements bancaires pour les plans annuels.',
  },
  {
    question: 'Y a-t-il un engagement ?',
    answer:
      'Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment. En cas d\'annulation, votre abonnement reste actif jusqu\'à la fin de la période facturée.',
  },
  {
    question: 'Proposez-vous des tarifs annuels ?',
    answer:
      'Oui, les plans annuels bénéficient d\'une remise de 20%. Contactez notre équipe commerciale pour en savoir plus.',
  },
]

export default function PricingPage() {
  return (
    <div className="py-16 px-4 sm:px-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-14">
        <h1
          className="text-4xl sm:text-5xl font-bold text-accent mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Tarifs simples, sans surprise
        </h1>
        <p className="text-lg text-[#777777] max-w-xl mx-auto">
          Tous les plans incluent 14 jours d&apos;essai gratuit. Sans engagement.
        </p>
      </div>

      {/* Plan Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-24">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col bg-white rounded-2xl border-2 p-6 transition-shadow ${
              plan.highlighted
                ? 'border-primary shadow-lg shadow-primary/10'
                : 'border-[#F4F0EB] shadow-card'
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                {plan.badge}
              </span>
            )}

            {/* Plan Header */}
            <div className="mb-6">
              <h2
                className="text-xl font-bold text-accent mb-1"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {plan.name}
              </h2>
              <p className="text-sm text-[#777777] mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl font-bold text-accent"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-[#999999]">{plan.period}</span>
                )}
              </div>
              {plan.period && (
                <span className="inline-block mt-1 text-[10px] text-[#999999] bg-[#FAF8F5] rounded px-1.5 py-0.5">
                  TVA non incluse
                </span>
              )}
            </div>

            {/* Features */}
            <ul className="flex-1 space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[#777777]">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href={plan.ctaHref}
              className={`block text-center rounded-xl py-2.5 px-4 text-sm font-medium transition-all duration-150 ${
                plan.highlighted
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-md'
                  : 'border border-[#EEEEEE] bg-white hover:bg-[#FAF8F5] text-[#3A3A3A]'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-2xl font-bold text-accent text-center mb-10"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Questions fréquentes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-accent text-sm mb-2">{faq.question}</h3>
              <p className="text-sm text-[#777777] leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
