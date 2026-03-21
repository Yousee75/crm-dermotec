import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Dermotec Advanced',
  description: 'Politique de confidentialité et protection des données personnelles (RGPD) de Dermotec Advanced.',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#082545] font-[family-name:var(--font-heading)] mb-8">
        Politique de confidentialité
      </h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        {/* Introduction */}
        <section>
          <p>
            Dermotec Advanced, centre de formation esthétique situé au 75 Boulevard Richard Lenoir,
            75011 Paris, s&apos;engage à protéger la vie privée de ses utilisateurs conformément au
            Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la
            loi Informatique et Libertés du 6 janvier 1978 modifiée.
          </p>
        </section>

        {/* Responsable du traitement */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">1. Responsable du traitement</h2>
          <div className="space-y-1">
            <p><strong>Dermotec Advanced</strong></p>
            <p>75 Boulevard Richard Lenoir, 75011 Paris</p>
            <p>Email : dermotec.fr@gmail.com</p>
            <p>Téléphone : 01 88 33 43 43</p>
          </div>
          <p className="mt-3">
            <strong>Délégué à la protection des données (DPO) :</strong> Pour toute question relative
            à la protection de vos données, contactez-nous à{' '}
            <a href="mailto:dermotec.fr@gmail.com" className="text-[#2EC6F3] hover:underline">
              dermotec.fr@gmail.com
            </a>.
          </p>
        </section>

        {/* Données collectées */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">2. Données personnelles collectées</h2>
          <p className="mb-3">Dans le cadre de nos services, nous collectons les données suivantes :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Identité :</strong> nom, prénom</li>
            <li><strong>Coordonnées :</strong> adresse email, numéro de téléphone</li>
            <li><strong>Informations professionnelles :</strong> statut professionnel (esthéticienne, en reconversion, gérante d&apos;institut, etc.)</li>
            <li><strong>Préférences de formation :</strong> formation(s) souhaitée(s), disponibilités</li>
            <li><strong>Données de paiement :</strong> traitées directement par Stripe (nous ne stockons pas vos informations bancaires)</li>
            <li><strong>Données de navigation :</strong> adresse IP, type de navigateur, pages visitées (via cookies analytiques)</li>
          </ul>
        </section>

        {/* Finalités */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">3. Finalités du traitement</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestion des demandes d&apos;information et des inscriptions aux formations</li>
            <li>Suivi commercial et relation client (CRM)</li>
            <li>Traitement des paiements et facturation</li>
            <li>Envoi de communications relatives à nos formations (avec votre consentement)</li>
            <li>Gestion des dossiers de financement (OPCO, France Travail, CPF)</li>
            <li>Suivi pédagogique : présence, évaluation, certificats</li>
            <li>Amélioration de nos services et analyse statistique</li>
            <li>Respect de nos obligations légales et réglementaires (Qualiopi)</li>
          </ul>
        </section>

        {/* Base légale */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">4. Bases légales du traitement</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Consentement :</strong> pour l&apos;envoi de communications marketing et l&apos;utilisation de cookies analytiques</li>
            <li><strong>Exécution contractuelle :</strong> pour la gestion des inscriptions, formations et paiements</li>
            <li><strong>Intérêt légitime :</strong> pour le suivi commercial et l&apos;amélioration de nos services</li>
            <li><strong>Obligation légale :</strong> pour la conservation des factures et documents de formation (Qualiopi)</li>
          </ul>
        </section>

        {/* Sous-traitants */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">5. Sous-traitants et transferts de données</h2>
          <p className="mb-3">Nous utilisons les services suivants pour le traitement de vos données :</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 pr-4 font-semibold text-[#082545]">Service</th>
                  <th className="text-left py-2 pr-4 font-semibold text-[#082545]">Usage</th>
                  <th className="text-left py-2 font-semibold text-[#082545]">Localisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 pr-4 font-medium">Supabase</td>
                  <td className="py-2 pr-4">Base de données, authentification</td>
                  <td className="py-2">Union européenne (région EU)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Stripe</td>
                  <td className="py-2 pr-4">Traitement des paiements</td>
                  <td className="py-2">UE / États-Unis (certifié DPF)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Resend</td>
                  <td className="py-2 pr-4">Envoi d&apos;emails transactionnels</td>
                  <td className="py-2">États-Unis (certifié DPF)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Vercel</td>
                  <td className="py-2 pr-4">Hébergement, analytics</td>
                  <td className="py-2">Global (CDN), siège États-Unis</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            Les transferts vers les États-Unis sont encadrés par le Data Privacy Framework (DPF)
            UE-États-Unis et/ou des clauses contractuelles types approuvées par la Commission européenne.
          </p>
        </section>

        {/* Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">6. Cookies</h2>
          <p className="mb-3">Notre site utilise les cookies suivants :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Cookies essentiels (session) :</strong> gérés par Supabase pour l&apos;authentification
              et le maintien de votre session. Ces cookies sont indispensables au fonctionnement du service.
            </li>
            <li>
              <strong>Cookies analytiques :</strong> gérés par Vercel Analytics pour mesurer la fréquentation
              et améliorer l&apos;expérience utilisateur. Ces cookies ne sont déposés qu&apos;avec votre consentement.
            </li>
          </ul>
          <p className="mt-2">
            Vous pouvez à tout moment modifier vos préférences en matière de cookies via le bandeau de
            consentement ou les paramètres de votre navigateur.
          </p>
        </section>

        {/* Durée de conservation */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">7. Durée de conservation</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Données prospects (leads) :</strong> 3 ans après le dernier contact</li>
            <li><strong>Données clients / stagiaires :</strong> durée de la relation contractuelle + 3 ans</li>
            <li><strong>Documents de formation :</strong> 5 ans (obligation Qualiopi)</li>
            <li><strong>Factures et données comptables :</strong> 10 ans (obligation légale)</li>
            <li><strong>Cookies analytiques :</strong> 13 mois maximum</li>
          </ul>
          <p className="mt-2">
            Au-delà de ces durées, les données sont supprimées ou anonymisées de manière irréversible.
          </p>
        </section>

        {/* Droits */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">8. Vos droits (articles 15 à 20 du RGPD)</h2>
          <p className="mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Droit d&apos;accès</strong> (art. 15) : obtenir la confirmation du traitement de vos données et en recevoir une copie</li>
            <li><strong>Droit de rectification</strong> (art. 16) : corriger des données inexactes ou incomplètes</li>
            <li><strong>Droit à l&apos;effacement</strong> (art. 17) : demander la suppression de vos données</li>
            <li><strong>Droit à la limitation du traitement</strong> (art. 18) : restreindre le traitement dans certains cas</li>
            <li><strong>Droit à la portabilité</strong> (art. 20) : recevoir vos données dans un format structuré et lisible par machine</li>
            <li><strong>Droit d&apos;opposition</strong> (art. 21) : vous opposer au traitement de vos données pour des motifs légitimes</li>
          </ul>
          <p className="mt-3">
            Pour exercer vos droits, envoyez un email à{' '}
            <a href="mailto:dermotec.fr@gmail.com" className="text-[#2EC6F3] hover:underline">
              dermotec.fr@gmail.com
            </a>{' '}
            en précisant votre demande et en joignant une copie d&apos;un justificatif d&apos;identité.
            Nous nous engageons à répondre dans un délai de 30 jours.
          </p>
        </section>

        {/* Réclamation */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">9. Réclamation</h2>
          <p>
            Si vous estimez que le traitement de vos données ne respecte pas la réglementation, vous avez
            le droit d&apos;introduire une réclamation auprès de la{' '}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2EC6F3] hover:underline"
            >
              Commission Nationale de l&apos;Informatique et des Libertés (CNIL)
            </a>
            , 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
          </p>
        </section>

        {/* Sécurité */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">10. Sécurité des données</h2>
          <p>
            Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour assurer
            la sécurité et la confidentialité de vos données : chiffrement en transit (TLS/HTTPS),
            authentification sécurisée, accès restreint aux données, sauvegardes régulières et
            hébergement sur des infrastructures certifiées.
          </p>
        </section>

        {/* Modifications */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">11. Modifications</h2>
          <p>
            Nous nous réservons le droit de modifier la présente politique à tout moment. Toute modification
            substantielle sera portée à votre connaissance par email ou via une notification sur le site.
            La date de dernière mise à jour est indiquée ci-dessous.
          </p>
        </section>

        {/* Dernière mise à jour */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-400">Dernière mise à jour : mars 2026</p>
        </div>
      </div>
    </div>
  )
}
