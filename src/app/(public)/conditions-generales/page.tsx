import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Generales d\'Utilisation — Dermotec CRM',
  description: 'Conditions generales d\'utilisation et de vente du logiciel SaaS Dermotec CRM, edite par Satorea.',
}

export default function ConditionsGeneralesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#082545] font-[family-name:var(--font-heading)] mb-2">
        Conditions g&eacute;n&eacute;rales d&apos;utilisation et de vente
      </h1>
      <p className="text-sm text-gray-400 mb-10">
        Version en vigueur au 1er mars 2026
      </p>

      <div className="space-y-10 text-gray-700 leading-relaxed text-[15px]">

        {/* ─── Article 1 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 1 &mdash; Objet</h2>
          <p>
            La soci&eacute;t&eacute; <strong>Satorea</strong> (ci-apr&egrave;s &laquo;&nbsp;le Prestataire&nbsp;&raquo;),
            soci&eacute;t&eacute; par actions simplifi&eacute;e au capital de [&agrave; compl&eacute;ter]&nbsp;&euro;,
            immatricul&eacute;e au RCS de Paris sous le num&eacute;ro [&agrave; compl&eacute;ter],
            dont le si&egrave;ge social est situ&eacute; au 75&nbsp;Boulevard Richard Lenoir, 75011&nbsp;Paris,
            &eacute;dite et exploite le logiciel en mode SaaS d&eacute;nomm&eacute; <strong>&laquo;&nbsp;Dermotec CRM&nbsp;&raquo;</strong>
            (ci-apr&egrave;s &laquo;&nbsp;la Solution&nbsp;&raquo;), destin&eacute; &agrave; la gestion de la relation client
            des centres de formation esth&eacute;tique.
          </p>
          <p className="mt-2">
            Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales d&apos;Utilisation et de Vente
            (ci-apr&egrave;s &laquo;&nbsp;CGU/CGV&nbsp;&raquo;) r&eacute;gissent l&apos;acc&egrave;s et
            l&apos;utilisation de la Solution. Toute inscription ou utilisation vaut acceptation sans
            r&eacute;serve des pr&eacute;sentes.
          </p>
        </section>

        {/* ─── Article 2 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 2 &mdash; D&eacute;finitions</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>&laquo;&nbsp;Client&nbsp;&raquo;</strong>&nbsp;: toute personne morale ou physique agissant
              &agrave; titre professionnel souscrivant &agrave; un Plan d&apos;acc&egrave;s &agrave; la Solution.
            </li>
            <li>
              <strong>&laquo;&nbsp;Utilisateur&nbsp;&raquo;</strong>&nbsp;: toute personne physique disposant
              d&apos;un compte d&apos;acc&egrave;s &agrave; la Solution, rattach&eacute;e &agrave; un Client.
            </li>
            <li>
              <strong>&laquo;&nbsp;Donn&eacute;es Client&nbsp;&raquo;</strong>&nbsp;: l&apos;ensemble des
              donn&eacute;es &agrave; caract&egrave;re personnel ou non saisies, import&eacute;es ou
              g&eacute;n&eacute;r&eacute;es par le Client dans la Solution (leads, stagiaires, inscriptions,
              documents, etc.).
            </li>
            <li>
              <strong>&laquo;&nbsp;Donn&eacute;es d&apos;Usage&nbsp;&raquo;</strong>&nbsp;: donn&eacute;es
              techniques et comportementales collect&eacute;es automatiquement par la Solution (logs de
              connexion, actions effectu&eacute;es, performances, m&eacute;triques d&apos;utilisation).
            </li>
            <li>
              <strong>&laquo;&nbsp;Donn&eacute;es D&eacute;riv&eacute;es&nbsp;&raquo;</strong>&nbsp;: scores,
              indicateurs statistiques, analyses, benchmarks et toute information g&eacute;n&eacute;r&eacute;e
              par les algorithmes de la Solution &agrave; partir des Donn&eacute;es Client ou des
              Donn&eacute;es d&apos;Usage.
            </li>
            <li>
              <strong>&laquo;&nbsp;Solution&nbsp;&raquo;</strong>&nbsp;: le logiciel SaaS Dermotec CRM,
              incluant l&apos;ensemble de ses fonctionnalit&eacute;s, interfaces, API et documentation.
            </li>
          </ul>
        </section>

        {/* ─── Article 3 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 3 &mdash; Inscription et Compte</h2>
          <p>
            L&apos;acc&egrave;s &agrave; la Solution n&eacute;cessite la cr&eacute;ation d&apos;un compte
            avec une adresse email v&eacute;rifi&eacute;e. L&apos;activation de l&apos;authentification
            multi-facteurs (MFA) est fortement recommand&eacute;e et pourra &ecirc;tre rendue obligatoire
            pour certains Plans.
          </p>
          <p className="mt-2">
            Le Client est responsable de la confidentialit&eacute; de ses identifiants et de toute activit&eacute;
            r&eacute;alis&eacute;e depuis les comptes qui lui sont rattach&eacute;s. En cas de suspicion
            d&apos;acc&egrave;s non autoris&eacute;, le Client en informe imm&eacute;diatement le Prestataire
            &agrave; l&apos;adresse{' '}
            <a href="mailto:support@satorea.fr" className="text-[#2EC6F3] hover:underline">
              support@satorea.fr
            </a>.
          </p>
          <p className="mt-2">
            Le Prestataire se r&eacute;serve le droit de suspendre tout compte pr&eacute;sentant
            un risque de s&eacute;curit&eacute; ou une utilisation contraire aux pr&eacute;sentes.
          </p>
        </section>

        {/* ─── Article 4 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 4 &mdash; Plans et Tarification</h2>
          <p className="mb-4">La Solution est propos&eacute;e selon les plans suivants&nbsp;:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#082545] text-white">
                  <th className="text-left py-3 px-4 font-semibold">Plan</th>
                  <th className="text-left py-3 px-4 font-semibold">Tarif</th>
                  <th className="text-left py-3 px-4 font-semibold">Utilisateurs</th>
                  <th className="text-left py-3 px-4 font-semibold">Fonctionnalit&eacute;s</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">D&eacute;couverte</td>
                  <td className="py-3 px-4">Gratuit</td>
                  <td className="py-3 px-4">1</td>
                  <td className="py-3 px-4">CRM de base, 50 leads, pipeline simple</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Pro</td>
                  <td className="py-3 px-4">49&nbsp;&euro;&nbsp;HT&nbsp;/&nbsp;mois</td>
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4">CRM complet, pipeline avanc&eacute;, financement, sessions, facturation, emails</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Expert</td>
                  <td className="py-3 px-4">99&nbsp;&euro;&nbsp;HT&nbsp;/&nbsp;mois</td>
                  <td className="py-3 px-4">10</td>
                  <td className="py-3 px-4">Toutes fonctionnalit&eacute;s, analytics avanc&eacute;s, Qualiopi, support prioritaire, API</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Clinique</td>
                  <td className="py-3 px-4">Sur devis</td>
                  <td className="py-3 px-4">Illimit&eacute;</td>
                  <td className="py-3 px-4">Multi-sites, int&eacute;grations sur mesure, SLA garanti, accompagnement d&eacute;di&eacute;</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Les prix sont indiqu&eacute;s hors taxes. La TVA au taux en vigueur (20&nbsp;%) sera
            appliqu&eacute;e &agrave; la facturation. Le Prestataire se r&eacute;serve le droit de modifier
            ses tarifs, avec un pr&eacute;avis de 30&nbsp;jours notifi&eacute; par email.
          </p>
        </section>

        {/* ─── Article 5 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 5 &mdash; Paiement</h2>
          <p>
            Les paiements sont trait&eacute;s de mani&egrave;re s&eacute;curis&eacute;e via la plateforme{' '}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-[#2EC6F3] hover:underline">
              Stripe
            </a>,
            certifi&eacute;e PCI-DSS niveau&nbsp;1. Le Prestataire ne stocke aucune donn&eacute;e bancaire.
          </p>
          <p className="mt-2">
            Les abonnements sont factur&eacute;s mensuellement, &agrave; la date anniversaire de la
            souscription. Le paiement est d&ucirc; &agrave; l&apos;avance pour chaque p&eacute;riode de
            facturation. Les factures sont mises &agrave; disposition au format PDF dans l&apos;espace Client.
          </p>
          <p className="mt-2">
            En cas de d&eacute;faut de paiement, l&apos;acc&egrave;s &agrave; la Solution pourra &ecirc;tre
            suspendu apr&egrave;s une mise en demeure par email rest&eacute;e sans effet pendant 15&nbsp;jours.
            Les sommes dues porteront int&eacute;r&ecirc;ts de retard au taux l&eacute;gal major&eacute;
            de 3&nbsp;points, conform&eacute;ment &agrave; l&apos;article L.441-10 du Code de commerce.
          </p>
        </section>

        {/* ─── Article 6 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 6 &mdash; Propri&eacute;t&eacute; Intellectuelle</h2>
          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.1 &mdash; Propri&eacute;t&eacute; de la Solution</h3>
          <p>
            La Solution, son interface, son code source, ses algorithmes, sa documentation, ses
            bases de donn&eacute;es et l&apos;ensemble de ses composants sont la propri&eacute;t&eacute;
            exclusive du Prestataire et sont prot&eacute;g&eacute;s par le droit de la propri&eacute;t&eacute;
            intellectuelle fran&ccedil;ais et international.
          </p>
          <p className="mt-2">
            Le Client b&eacute;n&eacute;ficie d&apos;un droit d&apos;utilisation personnel, non exclusif,
            non cessible et non transf&eacute;rable de la Solution, pour la dur&eacute;e de son abonnement
            et dans les limites du Plan souscrit.
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.2 &mdash; Droit sui generis sur la base de donn&eacute;es</h3>
          <p>
            Conform&eacute;ment &agrave; l&apos;article L.341-1 et suivants du Code de la propri&eacute;t&eacute;
            intellectuelle, le Prestataire est le <strong>producteur exclusif de la base de donn&eacute;es</strong> constituant
            la Solution, en ce qu&apos;il a r&eacute;alis&eacute; un investissement substantiel dans
            l&apos;obtention, la v&eacute;rification et la pr&eacute;sentation du contenu de celle-ci.
          </p>
          <p className="mt-2">
            Le Client reconna&icirc;t que le Prestataire est le producteur exclusif de la base de
            donn&eacute;es au sens du Code de la propri&eacute;t&eacute; intellectuelle et s&apos;interdit
            toute extraction massive ou syst&eacute;matique du contenu de la base de donn&eacute;es,
            que ce soit par des moyens manuels, automatis&eacute;s, par scraping ou par tout autre proc&eacute;d&eacute;.
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.3 &mdash; Propri&eacute;t&eacute; des Donn&eacute;es Client</h3>
          <p>
            Le Client demeure propri&eacute;taire de l&apos;int&eacute;gralit&eacute; de ses Donn&eacute;es
            Client. Le Prestataire ne revendique aucun droit de propri&eacute;t&eacute; sur les Donn&eacute;es
            Client et s&apos;interdit de les utiliser &agrave; des fins autres que la fourniture et
            l&apos;am&eacute;lioration de la Solution, conform&eacute;ment aux pr&eacute;sentes CGU/CGV.
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.4 &mdash; Donn&eacute;es D&eacute;riv&eacute;es</h3>
          <p>
            Le Prestataire d&eacute;tient l&apos;int&eacute;gralit&eacute; des droits de propri&eacute;t&eacute;
            intellectuelle sur les Donn&eacute;es D&eacute;riv&eacute;es, &agrave; savoir les scores,
            analyses, statistiques, benchmarks et toute information g&eacute;n&eacute;r&eacute;e par les
            algorithmes de la Solution. Ces Donn&eacute;es D&eacute;riv&eacute;es ne constituent pas des
            Donn&eacute;es Client.
          </p>
        </section>

        {/* ─── Article 7 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 7 &mdash; Donn&eacute;es personnelles et RGPD</h2>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">7.1 &mdash; Double qualification du Prestataire</h3>
          <p>
            Le Prestataire intervient en qualit&eacute; de <strong>sous-traitant</strong> au sens de
            l&apos;article 28 du R&egrave;glement (UE) 2016/679 (RGPD) pour le traitement des Donn&eacute;es
            Client effectu&eacute; pour le compte du Client. Les modalit&eacute;s de ce traitement sont
            d&eacute;taill&eacute;es dans l&apos;Accord de Traitement des Donn&eacute;es (DPA) annex&eacute;
            aux pr&eacute;sentes, accessible &agrave;{' '}
            <a href="/dpa" className="text-[#2EC6F3] hover:underline">/dpa</a>.
          </p>
          <p className="mt-2">
            Le Prestataire agit en qualit&eacute; de <strong>responsable de traitement autonome</strong> pour
            les donn&eacute;es techniques et d&apos;usage n&eacute;cessaires &agrave; la maintenance, &agrave;
            la s&eacute;curit&eacute; et &agrave; l&apos;&eacute;volution de la Solution, conform&eacute;ment
            &agrave; sa politique de confidentialit&eacute;.
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">7.2 &mdash; Obligations du Client</h3>
          <p>
            Le Client, en tant que responsable de traitement pour ses propres donn&eacute;es CRM,
            s&apos;engage &agrave;&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Disposer d&apos;une base l&eacute;gale valide pour chaque traitement de donn&eacute;es personnelles saisi dans la Solution</li>
            <li>Informer les personnes concern&eacute;es conform&eacute;ment aux articles 13 et 14 du RGPD</li>
            <li>R&eacute;pondre aux demandes d&apos;exercice des droits des personnes concern&eacute;es, avec l&apos;assistance du Prestataire</li>
            <li>Ne pas saisir de donn&eacute;es sensibles (article 9 du RGPD) sauf n&eacute;cessit&eacute; d&ucirc;ment justifi&eacute;e et encadr&eacute;e</li>
          </ul>
        </section>

        {/* ─── Article 8 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 8 &mdash; Donn&eacute;es d&apos;Usage et Analytics</h2>
          <p>
            Le Client autorise le Prestataire &agrave; traiter les donn&eacute;es d&apos;usage et les
            m&eacute;tadonn&eacute;es de mani&egrave;re agr&eacute;g&eacute;e et anonymis&eacute;e pour
            l&apos;am&eacute;lioration continue de ses services et le d&eacute;veloppement de nouvelles
            fonctionnalit&eacute;s.
          </p>
          <p className="mt-2">
            Le Prestataire pourra notamment&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>G&eacute;n&eacute;rer des benchmarks sectoriels anonymis&eacute;s (taux de conversion moyen, temps de traitement des leads, etc.)</li>
            <li>Am&eacute;liorer les algorithmes de scoring et de recommandation</li>
            <li>Produire des &eacute;tudes statistiques sur l&apos;utilisation de la Solution</li>
            <li>D&eacute;velopper de nouvelles fonctionnalit&eacute;s bas&eacute;es sur les tendances d&apos;utilisation</li>
          </ul>
          <p className="mt-2">
            Les donn&eacute;es anonymis&eacute;es de mani&egrave;re irr&eacute;versible ne constituent pas
            des donn&eacute;es personnelles au sens du RGPD et peuvent &ecirc;tre utilis&eacute;es librement
            par le Prestataire sans restriction de dur&eacute;e.
          </p>
        </section>

        {/* ─── Article 9 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 9 &mdash; Conservation des donn&eacute;es</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200 mt-2">
              <thead>
                <tr className="bg-[#082545] text-white">
                  <th className="text-left py-3 px-4 font-semibold">Type de donn&eacute;es</th>
                  <th className="text-left py-3 px-4 font-semibold">Dur&eacute;e</th>
                  <th className="text-left py-3 px-4 font-semibold">Fondement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4">Donn&eacute;es CRM (leads, contacts)</td>
                  <td className="py-3 px-4">Dur&eacute;e du contrat + 3&nbsp;ans maximum</td>
                  <td className="py-3 px-4">Prescription civile</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4">Donn&eacute;es de formation (Qualiopi)</td>
                  <td className="py-3 px-4 font-medium">6&nbsp;ans minimum</td>
                  <td className="py-3 px-4">Art. L.6313-1 et suivants du Code du travail</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Factures et donn&eacute;es comptables</td>
                  <td className="py-3 px-4">10&nbsp;ans</td>
                  <td className="py-3 px-4">Art. L.123-22 du Code de commerce</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4">Donn&eacute;es d&apos;usage et logs</td>
                  <td className="py-3 px-4">1&nbsp;an</td>
                  <td className="py-3 px-4">Int&eacute;r&ecirc;t l&eacute;gitime (s&eacute;curit&eacute;)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Donn&eacute;es anonymis&eacute;es / agr&eacute;g&eacute;es</td>
                  <td className="py-3 px-4">Ind&eacute;finiment</td>
                  <td className="py-3 px-4">Hors champ RGPD</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Article 10 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 10 &mdash; R&eacute;versibilit&eacute;</h2>
          <p>
            &Agrave; l&apos;issue du contrat, le Prestataire garantit la restitution des Donn&eacute;es
            Client dans un format JSON ou CSV exploitable, sous <strong>15&nbsp;jours ouvr&eacute;s</strong> et
            sans frais suppl&eacute;mentaires, sur simple demande &eacute;crite du Client.
          </p>
          <p className="mt-2">
            Le Client peut &eacute;galement initier un export de ses donn&eacute;es &agrave; tout moment
            depuis son espace d&apos;administration, dans les limites des fonctionnalit&eacute;s du Plan
            souscrit.
          </p>
          <p className="mt-2">
            Les donn&eacute;es soumises &agrave; une obligation l&eacute;gale de conservation
            (Qualiopi, comptabilit&eacute;) seront archiv&eacute;es conform&eacute;ment &agrave; l&apos;article&nbsp;9,
            ind&eacute;pendamment de la demande de restitution.
          </p>
        </section>

        {/* ─── Article 11 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 11 &mdash; Sous-traitants ult&eacute;rieurs</h2>
          <p>
            Le Client donne une <strong>autorisation g&eacute;n&eacute;rale</strong> au Prestataire
            pour recourir &agrave; des sous-traitants ult&eacute;rieurs dans le cadre de la fourniture
            de la Solution. Le Prestataire informera le Client de tout ajout ou remplacement de
            sous-traitant avec un pr&eacute;avis minimum de <strong>30&nbsp;jours</strong>. Le Client
            pourra s&apos;opposer au changement dans ce d&eacute;lai&nbsp;; &agrave; d&eacute;faut,
            le changement sera r&eacute;put&eacute; accept&eacute;.
          </p>
          <p className="mt-3 font-medium text-[#082545]">Liste des sous-traitants ult&eacute;rieurs au 1er mars 2026&nbsp;:</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#082545] text-white">
                  <th className="text-left py-2 px-4 font-semibold">Sous-traitant</th>
                  <th className="text-left py-2 px-4 font-semibold">Fonction</th>
                  <th className="text-left py-2 px-4 font-semibold">Localisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 px-4 font-medium">Supabase</td>
                  <td className="py-2 px-4">Base de donn&eacute;es, authentification</td>
                  <td className="py-2 px-4">UE (Francfort)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-2 px-4 font-medium">Stripe</td>
                  <td className="py-2 px-4">Traitement des paiements</td>
                  <td className="py-2 px-4">UE / &Eacute;tats-Unis (DPF)</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium">Vercel</td>
                  <td className="py-2 px-4">H&eacute;bergement, CDN</td>
                  <td className="py-2 px-4">Global (si&egrave;ge &Eacute;tats-Unis, CCT)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-2 px-4 font-medium">Resend</td>
                  <td className="py-2 px-4">Emails transactionnels</td>
                  <td className="py-2 px-4">&Eacute;tats-Unis (DPF)</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium">Upstash</td>
                  <td className="py-2 px-4">Cache, rate limiting</td>
                  <td className="py-2 px-4">UE (Francfort)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-2 px-4 font-medium">Inngest</td>
                  <td className="py-2 px-4">T&acirc;ches asynchrones</td>
                  <td className="py-2 px-4">&Eacute;tats-Unis (CCT)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Article 12 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 12 &mdash; S&eacute;curit&eacute;</h2>
          <p>
            Le Prestataire met en &oelig;uvre les mesures de s&eacute;curit&eacute; techniques et
            organisationnelles suivantes, conform&eacute;ment &agrave; l&apos;article 32 du RGPD&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Chiffrement des donn&eacute;es en transit via TLS&nbsp;1.3</li>
            <li>Chiffrement des donn&eacute;es au repos (AES-256)</li>
            <li>Row Level Security (RLS) PostgreSQL pour l&apos;isolation des donn&eacute;es par Client</li>
            <li>Sauvegardes automatiques quotidiennes avec r&eacute;tention de 30&nbsp;jours</li>
            <li>Authentification multi-facteurs (MFA) disponible</li>
            <li>Audit de s&eacute;curit&eacute; annuel par un tiers ind&eacute;pendant</li>
            <li>Journalisation des acc&egrave;s et des actions sensibles</li>
          </ul>
        </section>

        {/* ─── Article 13 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 13 &mdash; Disponibilit&eacute;</h2>
          <p>
            Le Prestataire s&apos;engage sur un taux de disponibilit&eacute; de la Solution de
            <strong> 99,5&nbsp;%</strong> mesur&eacute; sur une base mensuelle, hors p&eacute;riodes de
            maintenance planifi&eacute;e.
          </p>
          <p className="mt-2">
            Les op&eacute;rations de maintenance planifi&eacute;e seront notifi&eacute;es par email au
            minimum 48&nbsp;heures &agrave; l&apos;avance et seront, dans la mesure du possible,
            programm&eacute;es en dehors des heures ouvrables (22h&ndash;6h, heure de Paris).
          </p>
          <p className="mt-2">
            En cas d&apos;indisponibilit&eacute; d&eacute;passant le SLA, le Client pourra demander un
            avoir au prorata de la dur&eacute;e d&apos;indisponibilit&eacute; exc&eacute;dentaire.
          </p>
        </section>

        {/* ─── Article 14 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 14 &mdash; Responsabilit&eacute;</h2>
          <p>
            <strong>Limitation de responsabilit&eacute;&nbsp;:</strong> La responsabilit&eacute; totale du
            Prestataire, toutes causes confondues, est limit&eacute;e au montant total des redevances
            effectivement vers&eacute;es par le Client au cours des <strong>12&nbsp;derniers mois</strong> pr&eacute;c&eacute;dant
            le fait g&eacute;n&eacute;rateur.
          </p>
          <p className="mt-2">
            <strong>Exclusions&nbsp;:</strong> En aucun cas le Prestataire ne pourra &ecirc;tre tenu
            responsable des dommages indirects, y compris la perte de chiffre d&apos;affaires, la perte
            de donn&eacute;es r&eacute;sultant d&apos;une faute du Client, le pr&eacute;judice commercial,
            la perte de client&egrave;le ou l&apos;atteinte &agrave; l&apos;image.
          </p>
          <p className="mt-2">
            <strong>Force majeure&nbsp;:</strong> Le Prestataire ne saurait &ecirc;tre tenu responsable en
            cas de force majeure au sens de l&apos;article 1218 du Code civil.
          </p>
        </section>

        {/* ─── Article 15 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 15 &mdash; R&eacute;siliation</h2>
          <p>
            <strong>Par le Client&nbsp;:</strong> Le Client peut r&eacute;silier son abonnement &agrave; tout
            moment avec un pr&eacute;avis de <strong>30&nbsp;jours</strong>, depuis son espace d&apos;administration
            ou par email &agrave;{' '}
            <a href="mailto:support@satorea.fr" className="text-[#2EC6F3] hover:underline">support@satorea.fr</a>.
            La r&eacute;siliation prend effet &agrave; la fin de la p&eacute;riode de facturation en cours.
          </p>
          <p className="mt-2">
            <strong>Par le Prestataire&nbsp;:</strong> En cas de manquement grave aux pr&eacute;sentes
            (utilisation frauduleuse, non-paiement persistant, atteinte &agrave; la s&eacute;curit&eacute;),
            le Prestataire se r&eacute;serve le droit de suspendre ou r&eacute;silier le compte apr&egrave;s
            mise en demeure rest&eacute;e sans effet pendant 15&nbsp;jours.
          </p>
          <p className="mt-2">
            <strong>Sort des donn&eacute;es&nbsp;:</strong> Apr&egrave;s r&eacute;siliation, le Client
            dispose d&apos;un d&eacute;lai de 15&nbsp;jours ouvr&eacute;s pour demander la restitution de
            ses Donn&eacute;es Client (article&nbsp;10). &Agrave; l&apos;expiration d&apos;un d&eacute;lai
            de <strong>90&nbsp;jours</strong> suivant la r&eacute;siliation, les Donn&eacute;es Client
            seront d&eacute;finitivement supprim&eacute;es, sous r&eacute;serve des obligations l&eacute;gales
            de conservation.
          </p>
        </section>

        {/* ─── Article 16 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 16 &mdash; Droit applicable</h2>
          <p>
            Les pr&eacute;sentes CGU/CGV sont r&eacute;gies par le <strong>droit fran&ccedil;ais</strong>.
            En cas de litige relatif &agrave; l&apos;interpr&eacute;tation ou &agrave; l&apos;ex&eacute;cution
            des pr&eacute;sentes, et &agrave; d&eacute;faut de r&eacute;solution amiable, les
            <strong> tribunaux comp&eacute;tents de Paris</strong> auront comp&eacute;tence exclusive.
          </p>
        </section>

        {/* ─── Article 17 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 17 &mdash; M&eacute;diation</h2>
          <p>
            Conform&eacute;ment aux articles L.611-1 et suivants du Code de la consommation, en cas de
            litige non r&eacute;solu par le service client dans un d&eacute;lai de 60&nbsp;jours, le Client
            consommateur peut recourir gratuitement &agrave; un m&eacute;diateur de la consommation.
          </p>
          <p className="mt-2">
            Le Prestataire communiquera les coordonn&eacute;es du m&eacute;diateur comp&eacute;tent sur
            simple demande &agrave;{' '}
            <a href="mailto:support@satorea.fr" className="text-[#2EC6F3] hover:underline">support@satorea.fr</a>.
            Le Client peut &eacute;galement soumettre sa r&eacute;clamation sur la plateforme europ&eacute;enne
            de r&egrave;glement en ligne des litiges&nbsp;:{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#2EC6F3] hover:underline">
              https://ec.europa.eu/consumers/odr
            </a>.
          </p>
        </section>

        {/* ─── Contact ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Contact</h2>
          <div className="space-y-1">
            <p><strong>Satorea</strong></p>
            <p>75 Boulevard Richard Lenoir, 75011 Paris</p>
            <p>Email&nbsp;: <a href="mailto:support@satorea.fr" className="text-[#2EC6F3] hover:underline">support@satorea.fr</a></p>
            <p>DPO&nbsp;: <a href="mailto:dpo@satorea.fr" className="text-[#2EC6F3] hover:underline">dpo@satorea.fr</a></p>
          </div>
        </section>

        {/* ─── Dernière mise à jour ─── */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-400">Derni&egrave;re mise &agrave; jour&nbsp;: mars 2026</p>
        </div>
      </div>
    </div>
  )
}
