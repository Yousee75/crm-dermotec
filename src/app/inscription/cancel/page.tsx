'use client'

export const dynamic = 'force-dynamic'

import { XCircle, ArrowLeft, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

export default function InscriptionCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-red-800 mb-2">
            Paiement annulé
          </h1>
          <p className="text-red-700">
            Votre inscription n'a pas été finalisée
          </p>
        </div>

        {/* Message principal */}
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100 mb-6 text-center">
          <h2 className="text-xl font-bold text-[#082545] mb-4">Que s'est-il passé ?</h2>
          <p className="text-gray-600 mb-6">
            Vous avez annulé le processus de paiement. Votre inscription n'a donc pas été confirmée
            et aucun montant n'a été débité.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              ⚠️ Attention : votre place n'est pas réservée. Les sessions se remplissent rapidement.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/formations"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-semibold text-white hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Reprendre l'inscription
            </Link>

            <div className="text-sm text-gray-500">
              ou contactez-nous pour vous inscrire par téléphone
            </div>
          </div>
        </div>

        {/* Pourquoi choisir Dermotec */}
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-[#082545] mb-6">Pourquoi choisir Dermotec Advanced ?</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Formation de qualité</h3>
              <p className="text-sm text-gray-600">
                Certifié Qualiopi • 15 ans d'expérience • Formatrices expertes
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Accompagnement complet</h3>
              <p className="text-sm text-gray-600">
                Suivi personnalisé • Aide au financement • Support post-formation
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Excellent taux de réussite</h3>
              <p className="text-sm text-gray-600">
                98% de réussite • 2,000+ diplômées • 4.9/5 satisfaction
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Flexibilité de paiement</h3>
              <p className="text-sm text-gray-600">
                Paiement en 3x ou 4x sans frais • Financement OPCO/CPF
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl bg-primary/5 p-8 border border-primary/20 text-center">
          <h2 className="text-xl font-bold text-[#082545] mb-4">Besoin d'aide ?</h2>
          <p className="text-gray-600 mb-6">
            Nos conseillers sont là pour répondre à vos questions et finaliser votre inscription
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+33123456789"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90"
            >
              <Phone className="h-4 w-4" />
              01 23 45 67 89
            </a>
            <a
              href="mailto:formation@dermotec-advanced.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-6 py-3 font-semibold text-primary hover:bg-primary/10"
            >
              <Mail className="h-4 w-4" />
              Nous écrire
            </a>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>Horaires : 9h-18h du lundi au vendredi</p>
            <p>Réponse sous 2h en moyenne</p>
          </div>
        </div>

        {/* FAQ rapide */}
        <div className="mt-8 rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-[#082545] mb-6">Questions fréquentes</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Puis-je m'inscrire plus tard ?</h3>
              <p className="text-sm text-gray-600">
                Oui, tant qu'il reste des places. Cependant, les sessions se remplissent rapidement.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Le paiement en plusieurs fois est-il vraiment sans frais ?</h3>
              <p className="text-sm text-gray-600">
                Oui, totalement gratuit. Aucun frais supplémentaire avec Alma (3x ou 4x).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Y a-t-il un délai de rétractation ?</h3>
              <p className="text-sm text-gray-600">
                Oui, 14 jours selon la loi. Passé ce délai, aucun remboursement n'est possible.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Puis-je être financée ?</h3>
              <p className="text-sm text-gray-600">
                Oui, nos formations sont éligibles OPCO, CPF, France Travail selon votre profil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}