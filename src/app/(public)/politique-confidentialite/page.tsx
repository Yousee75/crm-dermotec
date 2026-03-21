import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialite — Dermotec CRM',
  description: 'Politique de confidentialite et protection des donnees personnelles (RGPD) du logiciel SaaS Dermotec CRM, edite par Satorea.',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#082545] font-[family-name:var(--font-heading)] mb-2">
        Politique de confidentialit&eacute;
      </h1>
      <p className="text-sm text-gray-400 mb-10">
        Version en vigueur au 1er mars 2026
      </p>

      <div className="space-y-10 text-gray-700 leading-relaxed text-[15px]">

        {/* ─── Introduction ─── */}
        <section>
          <p>
            La soci&eacute;t&eacute; <strong>Satorea</strong> (ci-apr&egrave;s &laquo;&nbsp;Satorea&nbsp;&raquo;
            ou &laquo;&nbsp;nous&nbsp;&raquo;), &eacute;ditrice du logiciel SaaS <strong>Dermotec CRM</strong>,
            s&apos;engage &agrave; prot&eacute;ger la vie priv&eacute;e de ses utilisateurs conform&eacute;ment
            au R&egrave;glement G&eacute;n&eacute;ral sur la Protection des Donn&eacute;es (RGPD &mdash;
            R&egrave;glement UE 2016/679) et &agrave; la loi Informatique et Libert&eacute;s du
            6&nbsp;janvier 1978 modifi&eacute;e.
          </p>
          <p className="mt-2">
            La pr&eacute;sente politique de confidentialit&eacute; d&eacute;crit les traitements de
            donn&eacute;es personnelles op&eacute;r&eacute;s dans le cadre de la Solution Dermotec CRM,
            en tenant compte de la <strong>double qualification</strong> de Satorea.
          </p>
        </section>

        {/* ─── 1. Double qualification ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">1. Responsable du traitement &mdash; Double qualification</h2>
          <p>
            Satorea intervient avec une <strong>double qualification</strong> au regard du RGPD&nbsp;:
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#082545] text-white">
                  <th className="text-left py-3 px-4 font-semibold">Qualification</th>
                  <th className="text-left py-3 px-4 font-semibold">Donn&eacute;es concern&eacute;es</th>
                  <th className="text-left py-3 px-4 font-semibold">Fondement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">Sous-traitant (art.&nbsp;28 RGPD)</td>
                  <td className="py-3 px-4">
                    Donn&eacute;es CRM saisies par les Clients (leads, stagiaires, inscriptions, documents,
                    paiements, &eacute;valuations)
                  </td>
                  <td className="py-3 px-4">Traitement pour le compte du Client responsable de traitement</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Responsable de traitement autonome</td>
                  <td className="py-3 px-4">
                    Donn&eacute;es techniques et d&apos;usage (logs, m&eacute;triques, analytics), donn&eacute;es
                    de compte utilisateur, donn&eacute;es de facturation
                  </td>
                  <td className="py-3 px-4">Maintenance, s&eacute;curit&eacute;, &eacute;volution de la Solution, int&eacute;r&ecirc;t l&eacute;gitime</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            <strong>Pour les Clients TPE/PME</strong> utilisant Dermotec CRM&nbsp;: chaque Client est
            responsable de traitement pour ses propres donn&eacute;es CRM. Satorea agit en tant que
            sous-traitant conform&eacute;ment &agrave; l&apos;Accord de Traitement des Donn&eacute;es
            (DPA) accessible &agrave;{' '}
            <a href="/dpa" className="text-[#2EC6F3] hover:underline">/dpa</a>.
          </p>
          <div className="mt-3 space-y-1">
            <p><strong>Satorea</strong></p>
            <p>75 Boulevard Richard Lenoir, 75011 Paris</p>
            <p>Email&nbsp;: <a href="mailto:support@satorea.fr" className="text-[#2EC6F3] hover:underline">support@satorea.fr</a></p>
            <p>D&eacute;l&eacute;gu&eacute; &agrave; la Protection des Donn&eacute;es (DPO)&nbsp;:{' '}
              <a href="mailto:dpo@satorea.fr" className="text-[#2EC6F3] hover:underline">dpo@satorea.fr</a>
            </p>
          </div>
        </section>

        {/* ─── 2. Données collectées ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">2. Donn&eacute;es personnelles collect&eacute;es</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#082545] text-white">
                  <th className="text-left py-3 px-4 font-semibold">Cat&eacute;gorie</th>
                  <th className="text-left py-3 px-4 font-semibold">Donn&eacute;es</th>
                  <th className="text-left py-3 px-4 font-semibold">Finalit&eacute;</th>
                  <th className="text-left py-3 px-4 font-semibold">Base l&eacute;gale</th>
                  <th className="text-left py-3 px-4 font-semibold">Dur&eacute;e</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">Compte utilisateur</td>
                  <td className="py-3 px-4">Nom, pr&eacute;nom, email, mot de passe (hash&eacute;)</td>
                  <td className="py-3 px-4">Cr&eacute;ation et gestion du compte</td>
                  <td className="py-3 px-4">Ex&eacute;cution contractuelle</td>
                  <td className="py-3 px-4">Dur&eacute;e du contrat + 3&nbsp;ans</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Facturation</td>
                  <td className="py-3 px-4">Raison sociale, adresse, SIRET, donn&eacute;es Stripe</td>
                  <td className="py-3 px-4">Facturation et comptabilit&eacute;</td>
                  <td className="py-3 px-4">Obligation l&eacute;gale</td>
                  <td className="py-3 px-4">10&nbsp;ans</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Donn&eacute;es CRM (sous-traitance)</td>
                  <td className="py-3 px-4">Leads, stagiaires, inscriptions, pr&eacute;sences, &eacute;valuations, documents</td>
                  <td className="py-3 px-4">Fourniture du service CRM</td>
                  <td className="py-3 px-4">Ex&eacute;cution contractuelle (Client RT)</td>
                  <td className="py-3 px-4">Dur&eacute;e du contrat + 3&nbsp;ans max</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Donn&eacute;es de formation</td>
                  <td className="py-3 px-4">Pr&eacute;sences, &eacute;valuations, certificats, attestations Qualiopi</td>
                  <td className="py-3 px-4">Conformit&eacute; Qualiopi et obligations formation</td>
                  <td className="py-3 px-4">Obligation l&eacute;gale</td>
                  <td className="py-3 px-4 font-medium">6&nbsp;ans minimum</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Donn&eacute;es d&apos;usage</td>
                  <td className="py-3 px-4">Logs de connexion, actions, performances, adresse IP, user-agent</td>
                  <td className="py-3 px-4">S&eacute;curit&eacute;, maintenance, am&eacute;lioration</td>
                  <td className="py-3 px-4">Int&eacute;r&ecirc;t l&eacute;gitime</td>
                  <td className="py-3 px-4">1&nbsp;an</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Donn&eacute;es d&eacute;riv&eacute;es</td>
                  <td className="py-3 px-4">Scores, analytics, benchmarks, statistiques agr&eacute;g&eacute;es</td>
                  <td className="py-3 px-4">Am&eacute;lioration de la Solution, R&amp;D</td>
                  <td className="py-3 px-4">Int&eacute;r&ecirc;t l&eacute;gitime</td>
                  <td className="py-3 px-4">Ind&eacute;finiment (anonymis&eacute;es)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Cookies analytiques</td>
                  <td className="py-3 px-4">Identifiants Vercel Analytics</td>
                  <td className="py-3 px-4">Mesure d&apos;audience</td>
                  <td className="py-3 px-4">Consentement</td>
                  <td className="py-3 px-4">13&nbsp;mois</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── 3. Sous-traitants ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">3. Sous-traitants et transferts de donn&eacute;es</h2>
          <p className="mb-3">
            Satorea fait appel aux sous-traitants suivants pour le fonctionnement de la Solution&nbsp;:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#082545] text-white">
                  <th className="text-left py-3 px-4 font-semibold">Sous-traitant</th>
                  <th className="text-left py-3 px-4 font-semibold">R&ocirc;le</th>
                  <th className="text-left py-3 px-4 font-semibold">Localisation</th>
                  <th className="text-left py-3 px-4 font-semibold">Garanties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">Supabase</td>
                  <td className="py-3 px-4">Base de donn&eacute;es, authentification, stockage</td>
                  <td className="py-3 px-4">UE (Francfort, Allemagne)</td>
                  <td className="py-3 px-4">SOC&nbsp;2 Type&nbsp;II, donn&eacute;es en UE</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Stripe</td>
                  <td className="py-3 px-4">Traitement des paiements</td>
                  <td className="py-3 px-4">UE / &Eacute;tats-Unis</td>
                  <td className="py-3 px-4">PCI-DSS Niveau&nbsp;1, DPF, CCT</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Vercel</td>
                  <td className="py-3 px-4">H&eacute;bergement, CDN, analytics</td>
                  <td className="py-3 px-4">Global (si&egrave;ge &Eacute;tats-Unis)</td>
                  <td className="py-3 px-4">CCT 2021, TIA r&eacute;alis&eacute;</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Resend</td>
                  <td className="py-3 px-4">Emails transactionnels</td>
                  <td className="py-3 px-4">&Eacute;tats-Unis</td>
                  <td className="py-3 px-4">DPF, CCT 2021</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Upstash</td>
                  <td className="py-3 px-4">Cache Redis, rate limiting</td>
                  <td className="py-3 px-4">UE (Francfort)</td>
                  <td className="py-3 px-4">Donn&eacute;es en UE</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Inngest</td>
                  <td className="py-3 px-4">T&acirc;ches asynchrones (background jobs)</td>
                  <td className="py-3 px-4">&Eacute;tats-Unis</td>
                  <td className="py-3 px-4">CCT 2021, TIA r&eacute;alis&eacute;</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">Transferts hors Union europ&eacute;enne</h3>
          <p>
            Les transferts de donn&eacute;es vers des pays tiers (notamment les &Eacute;tats-Unis) sont
            encadr&eacute;s par les <strong>Clauses Contractuelles Types (CCT) adopt&eacute;es par la
            Commission europ&eacute;enne le 4&nbsp;juin 2021</strong> (d&eacute;cision 2021/914) et/ou
            par le Data Privacy Framework (DPF) UE&ndash;&Eacute;tats-Unis.
          </p>
          <p className="mt-2">
            Une <strong>Transfer Impact Assessment (TIA)</strong> a &eacute;t&eacute; r&eacute;alis&eacute;e
            pour chaque sous-traitant situ&eacute; hors UE afin de v&eacute;rifier l&apos;ad&eacute;quation
            des garanties.
          </p>
        </section>

        {/* ─── 4. Cookies ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">4. Cookies</h2>
          <h3 className="text-base font-semibold text-[#082545] mt-2 mb-2">Cookies essentiels (exempt&eacute;s de consentement)</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Session Supabase</strong>&nbsp;: authentification, maintien de session.
              Dur&eacute;e&nbsp;: dur&eacute;e de la session.
            </li>
            <li>
              <strong>CSRF token</strong>&nbsp;: protection contre les attaques cross-site.
              Dur&eacute;e&nbsp;: dur&eacute;e de la session.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">Cookies analytiques (soumis au consentement)</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Vercel Analytics</strong>&nbsp;: mesure d&apos;audience anonymis&eacute;e, performance
              des pages. Dur&eacute;e&nbsp;: 13&nbsp;mois maximum. Ces cookies ne sont d&eacute;pos&eacute;s
              qu&apos;avec votre consentement pr&eacute;alable.
            </li>
          </ul>
          <p className="mt-2">
            Vous pouvez &agrave; tout moment modifier vos pr&eacute;f&eacute;rences via le bandeau de
            consentement ou les param&egrave;tres de votre navigateur.
          </p>
        </section>

        {/* ─── 5. Durées de conservation ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">5. Dur&eacute;es de conservation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200">
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
                  <td className="py-3 px-4">Dur&eacute;e du contrat + 3&nbsp;ans max</td>
                  <td className="py-3 px-4">Prescription civile</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4">Donn&eacute;es de formation (Qualiopi)</td>
                  <td className="py-3 px-4 font-medium">6&nbsp;ans minimum</td>
                  <td className="py-3 px-4">Code du travail (art. L.6313-1 et s.)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Factures et donn&eacute;es comptables</td>
                  <td className="py-3 px-4">10&nbsp;ans</td>
                  <td className="py-3 px-4">Code de commerce (art. L.123-22)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4">Donn&eacute;es d&apos;usage et logs</td>
                  <td className="py-3 px-4">1&nbsp;an</td>
                  <td className="py-3 px-4">Int&eacute;r&ecirc;t l&eacute;gitime</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Cookies analytiques</td>
                  <td className="py-3 px-4">13&nbsp;mois</td>
                  <td className="py-3 px-4">Recommandation CNIL</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4">Donn&eacute;es anonymis&eacute;es / agr&eacute;g&eacute;es</td>
                  <td className="py-3 px-4">Ind&eacute;finiment</td>
                  <td className="py-3 px-4">Hors champ RGPD</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            Au-del&agrave; des dur&eacute;es indiqu&eacute;es, les donn&eacute;es sont supprim&eacute;es
            ou anonymis&eacute;es de mani&egrave;re irr&eacute;versible.
          </p>
        </section>

        {/* ─── 6. Anonymisation ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">6. Anonymisation et donn&eacute;es d&eacute;riv&eacute;es</h2>
          <p>
            Les donn&eacute;es anonymis&eacute;es de mani&egrave;re irr&eacute;versible ne constituent pas
            des donn&eacute;es personnelles au sens du RGPD et peuvent &ecirc;tre utilis&eacute;es librement
            par Satorea, sans limitation de dur&eacute;e, notamment pour&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>La production de benchmarks sectoriels anonymis&eacute;s</li>
            <li>L&apos;am&eacute;lioration des algorithmes de la Solution</li>
            <li>La recherche et le d&eacute;veloppement de nouvelles fonctionnalit&eacute;s</li>
            <li>La publication d&apos;&eacute;tudes statistiques sur le secteur de la formation esth&eacute;tique</li>
          </ul>
          <p className="mt-3">
            Satorea d&eacute;tient l&apos;int&eacute;gralit&eacute; des droits de propri&eacute;t&eacute;
            intellectuelle sur les donn&eacute;es d&eacute;riv&eacute;es (scores, analyses, indicateurs
            statistiques) g&eacute;n&eacute;r&eacute;es par l&apos;utilisation de la Solution.
          </p>
        </section>

        {/* ─── 7. IA ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">7. Intelligence artificielle et algorithmes</h2>
          <p>
            Satorea peut utiliser des donn&eacute;es <strong>pseudonymis&eacute;es</strong> pour
            l&apos;am&eacute;lioration de ses algorithmes de scoring, de recommandation et d&apos;analyse
            pr&eacute;dictive, dans le respect des recommandations de la CNIL de juillet 2025 relatives
            &agrave; l&apos;utilisation de donn&eacute;es personnelles dans les syst&egrave;mes d&apos;IA.
          </p>
          <p className="mt-2">
            Les algorithmes de la Solution n&apos;op&egrave;rent aucune prise de d&eacute;cision
            enti&egrave;rement automatis&eacute;e au sens de l&apos;article 22 du RGPD. Les scores et
            recommandations g&eacute;n&eacute;r&eacute;s constituent des aides &agrave; la d&eacute;cision
            et sont toujours soumis &agrave; la validation humaine du Client.
          </p>
        </section>

        {/* ─── 8. Droits RGPD ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">8. Vos droits (articles 15 &agrave; 22 du RGPD)</h2>
          <p className="mb-3">
            Conform&eacute;ment au RGPD, vous disposez des droits suivants concernant vos donn&eacute;es
            personnelles&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Droit d&apos;acc&egrave;s</strong> (art.&nbsp;15)&nbsp;: obtenir la confirmation
              du traitement de vos donn&eacute;es et en recevoir une copie
            </li>
            <li>
              <strong>Droit de rectification</strong> (art.&nbsp;16)&nbsp;: corriger des donn&eacute;es
              inexactes ou incompl&egrave;tes
            </li>
            <li>
              <strong>Droit &agrave; l&apos;effacement</strong> (art.&nbsp;17)&nbsp;: demander la
              suppression de vos donn&eacute;es, sous r&eacute;serve des obligations l&eacute;gales de
              conservation
            </li>
            <li>
              <strong>Droit &agrave; la limitation</strong> (art.&nbsp;18)&nbsp;: restreindre le
              traitement dans certaines circonstances
            </li>
            <li>
              <strong>Droit &agrave; la portabilit&eacute;</strong> (art.&nbsp;20)&nbsp;: recevoir
              vos donn&eacute;es dans un format structur&eacute;, couramment utilis&eacute; et lisible
              par machine (JSON, CSV)
            </li>
            <li>
              <strong>Droit d&apos;opposition</strong> (art.&nbsp;21)&nbsp;: vous opposer au traitement
              fond&eacute; sur l&apos;int&eacute;r&ecirc;t l&eacute;gitime, y compris le profilage
            </li>
          </ul>
          <p className="mt-3">
            Pour exercer vos droits, envoyez un email &agrave;{' '}
            <a href="mailto:dpo@satorea.fr" className="text-[#2EC6F3] hover:underline">dpo@satorea.fr</a>
            {' '}en pr&eacute;cisant votre demande et en joignant un justificatif d&apos;identit&eacute;.
            Nous nous engageons &agrave; r&eacute;pondre dans un d&eacute;lai de <strong>30&nbsp;jours</strong>.
          </p>
          <p className="mt-2">
            <strong>Note pour les personnes concern&eacute;es dont les donn&eacute;es sont saisies par
            un Client&nbsp;:</strong> si vos donn&eacute;es personnelles ont &eacute;t&eacute; saisies
            dans Dermotec CRM par un centre de formation (Client), veuillez adresser vos demandes
            d&apos;exercice de droits directement &agrave; ce centre. Satorea assistera le Client dans
            le traitement de votre demande conform&eacute;ment au DPA.
          </p>
        </section>

        {/* ─── 9. Réclamation CNIL ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">9. R&eacute;clamation aupr&egrave;s de la CNIL</h2>
          <p>
            Si vous estimez que le traitement de vos donn&eacute;es ne respecte pas la r&eacute;glementation
            applicable, vous avez le droit d&apos;introduire une r&eacute;clamation aupr&egrave;s de la{' '}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2EC6F3] hover:underline"
            >
              Commission Nationale de l&apos;Informatique et des Libert&eacute;s (CNIL)
            </a>
            , 3&nbsp;Place de Fontenoy, TSA&nbsp;80715, 75334&nbsp;Paris Cedex&nbsp;07.
          </p>
          <p className="mt-2">
            Nous vous encourageons &agrave; nous contacter pr&eacute;alablement &agrave;{' '}
            <a href="mailto:dpo@satorea.fr" className="text-[#2EC6F3] hover:underline">dpo@satorea.fr</a>
            {' '}afin de tenter de r&eacute;soudre tout diff&eacute;rend &agrave; l&apos;amiable.
          </p>
        </section>

        {/* ─── 10. Sécurité ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">10. S&eacute;curit&eacute; des donn&eacute;es</h2>
          <p>
            Satorea met en &oelig;uvre les mesures techniques et organisationnelles suivantes,
            conform&eacute;ment &agrave; l&apos;article&nbsp;32 du RGPD&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Chiffrement en transit (TLS&nbsp;1.3) et au repos (AES-256)</li>
            <li>Row Level Security (RLS) PostgreSQL pour l&apos;isolation stricte des donn&eacute;es par Client</li>
            <li>Authentification multi-facteurs (MFA) disponible pour tous les comptes</li>
            <li>Sauvegardes automatiques quotidiennes avec r&eacute;tention de 30&nbsp;jours</li>
            <li>Journalisation des acc&egrave;s et des actions sensibles</li>
            <li>Audit de s&eacute;curit&eacute; annuel par un tiers ind&eacute;pendant</li>
            <li>Politique de gestion des incidents et notification sous 48h en cas de violation</li>
          </ul>
        </section>

        {/* ─── 11. Modifications ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">11. Modifications de la politique</h2>
          <p>
            Satorea se r&eacute;serve le droit de modifier la pr&eacute;sente politique de
            confidentialit&eacute; &agrave; tout moment. Toute modification substantielle sera port&eacute;e
            &agrave; la connaissance des utilisateurs par email ou via une notification dans la Solution,
            au minimum 30&nbsp;jours avant son entr&eacute;e en vigueur.
          </p>
        </section>

        {/* ─── Dernière mise à jour ─── */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-400">Derni&egrave;re mise &agrave; jour&nbsp;: mars 2026</p>
        </div>
      </div>
    </div>
  )
}
