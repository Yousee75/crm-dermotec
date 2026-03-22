export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Centre d\'Aide | FAQ et Support',
  description:
    'Trouvez rapidement des reponses a vos questions sur Dermotec CRM. Premiers pas, formations, Qualiopi, facturation, RGPD et gestion de compte.',
  openGraph: {
    title: 'Centre d\'Aide | Dermotec Advanced',
    description: 'FAQ et support Dermotec CRM. Guides premiers pas, formations, Qualiopi, facturation et compte.',
    url: 'https://crm-dermotec.vercel.app/aide',
    siteName: 'Dermotec Advanced',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Centre d\'Aide | Dermotec Advanced',
    description: 'FAQ et support Dermotec CRM. Guides premiers pas, formations, Qualiopi, facturation et compte.',
  },
}

const sections = [
  {
    title: 'Premiers pas',
    items: [
      {
        question: 'Comment créer mon compte ?',
        answer: (
          <>
            Rendez-vous sur la{' '}
            <Link href="/login" className="text-primary hover:underline">
              page de connexion
            </Link>{' '}
            et cliquez sur &laquo;&nbsp;Créer un compte&nbsp;&raquo;. Renseignez votre email
            professionnel et un mot de passe. Vous recevrez un email de confirmation pour activer
            votre compte.
          </>
        ),
      },
      {
        question: 'Comment ajouter mon premier lead ?',
        answer: (
          <>
            Depuis le{' '}
            <Link href="/leads" className="text-primary hover:underline">
              pipeline
            </Link>
            , cliquez sur &laquo;&nbsp;+ Nouveau lead&nbsp;&raquo; en haut à droite. Renseignez au
            minimum le nom, le prénom et un moyen de contact (email ou téléphone). Le lead sera
            automatiquement placé au statut &laquo;&nbsp;Nouveau&nbsp;&raquo;.
          </>
        ),
      },
      {
        question: 'Comment inviter mon équipe ?',
        answer:
          'Allez dans Paramètres &gt; Équipe, puis cliquez sur &laquo;\u00a0Inviter un membre\u00a0&raquo;. Saisissez son email et attribuez-lui un rôle (admin, commercial, formatrice). Il recevra un lien d\u2019invitation par email.',
      },
      {
        question: 'Comment configurer Stripe ?',
        answer:
          'Dans Paramètres &gt; Paiements, cliquez sur &laquo;\u00a0Connecter Stripe\u00a0&raquo;. Vous serez redirigé vers Stripe pour autoriser la connexion. Une fois connecté, les paiements et factures seront automatiquement synchronisés.',
      },
      {
        question: 'Comment exporter mes données ?',
        answer:
          'Depuis n\u2019importe quelle vue liste (leads, sessions, inscriptions), cliquez sur l\u2019icône d\u2019export en haut à droite. Vous pouvez exporter en CSV ou PDF. Les filtres actifs sont appliqués à l\u2019export.',
      },
      {
        question: 'Qu\u2019est-ce que le score de lead ?',
        answer:
          'Le score de lead est une note sur 100 calculée automatiquement. Il prend en compte l\u2019engagement (ouvertures email, réponses), le profil (expérience, budget) et l\u2019activité récente. Plus le score est élevé, plus la probabilité de conversion est forte.',
      },
    ],
  },
  {
    title: 'Formations & Qualiopi',
    items: [
      {
        question: 'Comment planifier une session ?',
        answer: (
          <>
            Rendez-vous dans{' '}
            <Link href="/sessions" className="text-primary hover:underline">
              Sessions &amp; Planning
            </Link>
            , cliquez sur &laquo;&nbsp;+ Nouvelle session&nbsp;&raquo;. Sélectionnez la formation, la
            date, la formatrice et la salle. Le nombre de places disponibles est calculé
            automatiquement.
          </>
        ),
      },
      {
        question: 'Comment générer un certificat ?',
        answer:
          'Depuis la fiche d\u2019une inscription, cliquez sur &laquo;\u00a0Générer le certificat\u00a0&raquo; une fois la formation terminée et l\u2019évaluation complétée. Le PDF est généré avec les informations du stagiaire et de la formation, conforme aux exigences Qualiopi.',
      },
      {
        question: 'Comment créer un dossier de financement ?',
        answer: (
          <>
            Dans la fiche du lead ou de l&apos;inscription, ouvrez l&apos;onglet{' '}
            <Link href="/financements" className="text-primary hover:underline">
              Financement
            </Link>
            . Sélectionnez l&apos;organisme (OPCO, CPF, France Travail), renseignez les
            informations requises et suivez l&apos;avancement du dossier étape par étape.
          </>
        ),
      },
      {
        question: 'Quelles données sont nécessaires pour Qualiopi ?',
        answer:
          'Le CRM pré-remplit automatiquement les données requises pour les 7 critères et 32 indicateurs Qualiopi : programmes, évaluations, feuilles de présence, satisfaction stagiaires, conventions et attestations. Vous pouvez consulter votre état de conformité dans le tableau de bord Qualité.',
      },
    ],
  },
  {
    title: 'Facturation & Compte',
    items: [
      {
        question: 'Comment changer de plan ?',
        answer: (
          <>
            Dans{' '}
            <Link href="/pricing" className="text-primary hover:underline">
              Paramètres &gt; Abonnement
            </Link>
            , cliquez sur &laquo;&nbsp;Changer de plan&nbsp;&raquo;. Le changement prend effet
            immédiatement et la facturation est ajustée au prorata. Vous pouvez upgrader ou
            downgrader à tout moment.
          </>
        ),
      },
      {
        question: 'Comment annuler mon abonnement ?',
        answer:
          'Rendez-vous dans Paramètres &gt; Abonnement et cliquez sur &laquo;\u00a0Annuler l\u2019abonnement\u00a0&raquo;. Votre accès reste actif jusqu\u2019à la fin de la période facturée. Vos données sont conservées 90 jours après expiration.',
      },
      {
        question: 'Où trouver mes factures ?',
        answer:
          'Toutes vos factures sont disponibles dans Paramètres &gt; Facturation. Vous pouvez les télécharger en PDF. Elles sont également envoyées par email à chaque paiement.',
      },
      {
        question: 'Comment exercer mes droits RGPD ?',
        answer: (
          <>
            Vous pouvez exercer vos droits d&apos;accès, de rectification, de suppression et de
            portabilité en nous contactant à{' '}
            <a href="mailto:dpo@satorea.fr" className="text-primary hover:underline">
              dpo@satorea.fr
            </a>
            . Consultez notre{' '}
            <Link href="/politique-confidentialite" className="text-primary hover:underline">
              politique de confidentialité
            </Link>{' '}
            pour plus de détails. Nous répondons sous 30 jours.
          </>
        ),
      },
    ],
  },
]

export default function AidePage() {
  return (
    <div className="py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1
          className="text-4xl sm:text-5xl font-bold text-accent mb-4 text-center"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Centre d&apos;aide
        </h1>
        <p className="text-gray-500 text-center max-w-xl mx-auto mb-10">
          Trouvez rapidement des réponses à vos questions.
        </p>

        {/* Search bar (decorative) */}
        <div className="relative max-w-lg mx-auto mb-16">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans l'aide..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            readOnly
          />
        </div>

        {/* FAQ Sections */}
        <div className="space-y-14">
          {sections.map((section) => (
            <div key={section.title}>
              <h2
                className="text-2xl font-bold text-accent mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-xl border border-gray-100 bg-white"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-accent hover:text-primary transition-colors [&::-webkit-details-marker]:hidden list-none">
                      <span>{item.question}</span>
                      <span className="ml-4 text-gray-400 group-open:rotate-45 transition-transform duration-200 text-lg">
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center rounded-2xl bg-background border border-gray-100 py-10 px-6">
          <h3
            className="text-lg font-bold text-accent mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Besoin d&apos;aide supplémentaire ?
          </h3>
          <p className="text-sm text-gray-500">
            Contactez-nous à{' '}
            <a href="mailto:support@satorea.fr" className="text-primary hover:underline">
              support@satorea.fr
            </a>{' '}
            ou au{' '}
            <a href="tel:+33188334343" className="text-primary hover:underline">
              01 88 33 43 43
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
