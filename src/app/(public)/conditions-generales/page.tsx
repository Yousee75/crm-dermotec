import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions générales — Dermotec Advanced',
  description: 'Conditions générales d\'utilisation et de vente du CRM Dermotec Advanced.',
}

export default function ConditionsGeneralesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#082545] font-[family-name:var(--font-heading)] mb-8">
        Conditions générales d&apos;utilisation et de vente
      </h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        {/* Objet */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">1. Objet</h2>
          <p>
            Les présentes Conditions Générales d&apos;Utilisation et de Vente (ci-après « CGU/CGV »)
            régissent l&apos;accès et l&apos;utilisation de la plateforme CRM Dermotec Advanced
            (ci-après « le Service »), éditée par Dermotec Advanced, centre de formation esthétique
            certifié Qualiopi, situé au 75 Boulevard Richard Lenoir, 75011 Paris.
          </p>
          <p className="mt-2">
            Le Service est une solution de gestion de la relation client (CRM) dédiée aux centres
            de formation esthétique, permettant la gestion des leads, inscriptions, sessions de formation,
            dossiers de financement, facturation et suivi qualité.
          </p>
        </section>

        {/* Inscription */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">2. Inscription et compte utilisateur</h2>
          <p>
            L&apos;accès au Service nécessite la création d&apos;un compte utilisateur. L&apos;utilisateur
            s&apos;engage à fournir des informations exactes, complètes et à jour lors de son inscription.
          </p>
          <p className="mt-2">
            L&apos;utilisateur est responsable de la confidentialité de ses identifiants de connexion et
            de toute activité réalisée depuis son compte. En cas d&apos;utilisation non autorisée,
            l&apos;utilisateur doit en informer immédiatement Dermotec Advanced à l&apos;adresse{' '}
            <a href="mailto:dermotec.fr@gmail.com" className="text-[#2EC6F3] hover:underline">
              dermotec.fr@gmail.com
            </a>.
          </p>
        </section>

        {/* Plans et tarification */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">3. Plans et tarification</h2>
          <p className="mb-3">Le Service est proposé selon les plans suivants :</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 pr-4 font-semibold text-[#082545]">Plan</th>
                  <th className="text-left py-2 pr-4 font-semibold text-[#082545]">Tarif</th>
                  <th className="text-left py-2 font-semibold text-[#082545]">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 pr-4 font-medium">Découverte</td>
                  <td className="py-2 pr-4">Gratuit</td>
                  <td className="py-2">Fonctionnalités de base pour découvrir le Service</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Pro</td>
                  <td className="py-2 pr-4">49 € HT / mois</td>
                  <td className="py-2">Accès complet aux fonctionnalités CRM, gestion avancée</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Expert</td>
                  <td className="py-2 pr-4">99 € HT / mois</td>
                  <td className="py-2">Toutes les fonctionnalités, support prioritaire, analytics avancés</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            Les prix sont indiqués en euros hors taxes. La TVA applicable sera ajoutée au moment de la facturation.
            Dermotec Advanced se réserve le droit de modifier ses tarifs, avec un préavis de 30 jours.
          </p>
        </section>

        {/* Paiement */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">4. Paiement</h2>
          <p>
            Les paiements sont traités de manière sécurisée via la plateforme{' '}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-[#2EC6F3] hover:underline">
              Stripe
            </a>,
            certifiée PCI-DSS niveau 1. Dermotec Advanced ne stocke aucune donnée bancaire.
          </p>
          <p className="mt-2">
            Les abonnements sont facturés mensuellement, à la date anniversaire de la souscription.
            Le paiement est dû à l&apos;avance pour chaque période de facturation.
          </p>
          <p className="mt-2">
            En cas de défaut de paiement, l&apos;accès au Service pourra être suspendu après une relance
            par email restée sans effet pendant 15 jours.
          </p>
        </section>

        {/* Droit de rétractation */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">5. Droit de rétractation</h2>
          <p>
            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne
            s&apos;applique pas aux contrats de fourniture de contenu numérique exécuté immédiatement,
            lorsque le consommateur a donné son accord préalable et renoncé expressément à son droit de rétractation.
          </p>
          <p className="mt-2">
            Pour le plan Découverte (gratuit), aucun engagement n&apos;est requis.
          </p>
        </section>

        {/* Données */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">6. Données et propriété intellectuelle</h2>
          <p>
            <strong>Données de l&apos;utilisateur :</strong> L&apos;utilisateur reste propriétaire de
            l&apos;ensemble des données qu&apos;il saisit dans le Service. Dermotec Advanced s&apos;engage
            à ne pas utiliser ces données à des fins autres que la fourniture du Service.
          </p>
          <p className="mt-2">
            <strong>Propriété intellectuelle :</strong> Le Service, son interface, son code source, ses
            algorithmes, ses bases de données et l&apos;ensemble de ses composants sont la propriété
            exclusive de Dermotec Advanced et sont protégés par le droit de la propriété intellectuelle.
          </p>
          <p className="mt-2">
            L&apos;utilisateur bénéficie d&apos;un droit d&apos;utilisation personnel, non exclusif et
            non cessible du Service, pour la durée de son abonnement.
          </p>
        </section>

        {/* Disponibilité */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">7. Disponibilité du Service</h2>
          <p>
            Dermotec Advanced s&apos;efforce d&apos;assurer une disponibilité du Service 24h/24 et 7j/7.
            Toutefois, l&apos;accès peut être temporairement interrompu pour des opérations de maintenance,
            de mise à jour ou en cas de force majeure.
          </p>
          <p className="mt-2">
            Dermotec Advanced ne saurait être tenue responsable des interruptions du Service et des
            conséquences qui pourraient en découler pour l&apos;utilisateur.
          </p>
        </section>

        {/* Responsabilités */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">8. Responsabilités</h2>
          <p>
            <strong>Obligations de l&apos;utilisateur :</strong> L&apos;utilisateur s&apos;engage à utiliser
            le Service conformément à sa destination et aux présentes CGU/CGV. Il s&apos;interdit notamment
            de tenter d&apos;accéder à des données ou fonctionnalités non autorisées, de perturber le
            fonctionnement du Service ou de l&apos;utiliser à des fins illicites.
          </p>
          <p className="mt-2">
            <strong>Limitation de responsabilité :</strong> La responsabilité de Dermotec Advanced est
            limitée aux dommages directs et prévisibles. En aucun cas, Dermotec Advanced ne pourra être
            tenue responsable des dommages indirects (perte de chiffre d&apos;affaires, perte de données,
            préjudice commercial). La responsabilité totale de Dermotec Advanced est plafonnée au montant
            des sommes versées par l&apos;utilisateur au cours des 12 derniers mois.
          </p>
        </section>

        {/* Résiliation */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">9. Résiliation</h2>
          <p>
            <strong>Par l&apos;utilisateur :</strong> L&apos;utilisateur peut résilier son abonnement à
            tout moment depuis son espace personnel ou par email à dermotec.fr@gmail.com. La résiliation
            prend effet à la fin de la période de facturation en cours. Aucun remboursement au prorata ne
            sera effectué.
          </p>
          <p className="mt-2">
            <strong>Par Dermotec Advanced :</strong> En cas de manquement grave aux présentes CGU/CGV,
            Dermotec Advanced se réserve le droit de suspendre ou résilier le compte de l&apos;utilisateur
            sans préavis ni indemnité.
          </p>
          <p className="mt-2">
            <strong>Portabilité des données :</strong> En cas de résiliation, l&apos;utilisateur peut
            demander l&apos;export de ses données dans un format standard (CSV, JSON) pendant une durée
            de 30 jours suivant la résiliation. Passé ce délai, les données seront supprimées.
          </p>
        </section>

        {/* Médiation */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">10. Médiation</h2>
          <p>
            Conformément aux articles L611-1 et suivants du Code de la consommation, en cas de litige
            non résolu par le service client, le consommateur peut recourir gratuitement au service de
            médiation. Le médiateur compétent sera communiqué sur simple demande à dermotec.fr@gmail.com.
          </p>
        </section>

        {/* Droit applicable */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">11. Droit applicable et juridiction</h2>
          <p>
            Les présentes CGU/CGV sont régies par le droit français. En cas de litige relatif à
            l&apos;interprétation ou à l&apos;exécution des présentes, et à défaut de résolution amiable,
            les tribunaux compétents de Paris auront compétence exclusive.
          </p>
        </section>

        {/* Modifications */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">12. Modifications des CGU/CGV</h2>
          <p>
            Dermotec Advanced se réserve le droit de modifier les présentes CGU/CGV à tout moment.
            Les utilisateurs seront informés de toute modification substantielle par email au moins
            30 jours avant leur entrée en vigueur. La poursuite de l&apos;utilisation du Service après
            cette date vaudra acceptation des nouvelles conditions.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">13. Contact</h2>
          <div className="space-y-1">
            <p><strong>Dermotec Advanced</strong></p>
            <p>75 Boulevard Richard Lenoir, 75011 Paris</p>
            <p>Email : <a href="mailto:dermotec.fr@gmail.com" className="text-[#2EC6F3] hover:underline">dermotec.fr@gmail.com</a></p>
            <p>Téléphone : 01 88 33 43 43</p>
          </div>
        </section>

        {/* Dernière mise à jour */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-400">Dernière mise à jour : mars 2026</p>
        </div>
      </div>
    </div>
  )
}
