import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tarifs — Dermotec Advanced CRM',
  description:
    'Plans et tarifs du CRM Dermotec Advanced. Gratuit pour démarrer, puissant pour grandir. Essai 14 jours sans engagement.',
}

const plans = [
  {
    name: 'Découverte',
    price: 'Gratuit',
    period: '',
    description: 'Pour tester et démarrer en toute sérénité.',
    features: [
      '50 leads',
      '1 utilisateur',
      'Pipeline kanban',
      'Email templates',
      'Support communauté',
    ],
    cta: 'Commencer',
    ctaHref: '/auth/signup?plan=decouverte',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: '49€',
    period: '/mois HT',
    description: 'Pour les centres en croissance.',
    features: [
      '500 leads',
      '5 utilisateurs',
      'Tout Découverte +',
      'Financement dossiers',
      'Analytics avancé',
      'Export CSV / PDF',
      'Cadences automatisées',
      'Support email prioritaire',
    ],
    cta: 'Essai gratuit 14 jours',
    ctaHref: '/auth/signup?plan=pro',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Expert',
    price: '99€',
    period: '/mois HT',
    description: 'Pour les centres ambitieux qui veulent tout automatiser.',
    features: [
      'Leads illimités',
      '15 utilisateurs',
      'Tout Pro +',
      'Assistant IA',
      'API access',
      'Webhooks',
      'Intégrations (WhatsApp, SMS)',
      'Support téléphonique',
      'SLA 99.5%',
    ],
    cta: 'Essai gratuit 14 jours',
    ctaHref: '/auth/signup?plan=expert',
    highlighted: true,
    badge: 'Populaire',
  },
  {
    name: 'Clinique',
    price: 'Sur devis',
    period: '',
    description: 'Pour les groupes multi-sites avec besoins spécifiques.',
    features: [
      'Tout illimité',
      'Utilisateurs illimités',
      'Tout Expert +',
      'Multi-sites',
      'Formation dédiée',
      'Account manager',
      'SLA 99.9%',
      'DPA personnalisé',
    ],
    cta: 'Nous contacter',
    ctaHref: '/contact?plan=clinique',
    highlighted: false,
    badge: null,
  },
]

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
          className="text-4xl sm:text-5xl font-bold text-[#082545] mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Tarifs simples, sans surprise
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
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
                : 'border-gray-100 shadow-card'
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
                className="text-xl font-bold text-[#082545] mb-1"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {plan.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl font-bold text-[#082545]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-gray-400">{plan.period}</span>
                )}
              </div>
              {plan.period && (
                <span className="inline-block mt-1 text-[10px] text-gray-400 bg-gray-50 rounded px-1.5 py-0.5">
                  TVA non incluse
                </span>
              )}
            </div>

            {/* Features */}
            <ul className="flex-1 space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
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
                  ? 'bg-primary hover:bg-[#1BA8D4] text-white shadow-sm hover:shadow-md'
                  : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
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
          className="text-2xl font-bold text-[#082545] text-center mb-10"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Questions fréquentes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-[#082545] text-sm mb-2">{faq.question}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
