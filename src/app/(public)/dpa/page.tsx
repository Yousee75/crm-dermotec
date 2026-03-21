import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accord de Traitement des Donnees (DPA) — Dermotec CRM',
  description: 'Data Processing Agreement (DPA) — Annexe RGPD aux conditions generales de Dermotec CRM, edite par Satorea.',
}

export default function DpaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#082545] font-[family-name:var(--font-heading)] mb-2">
        Accord de Traitement des Donn&eacute;es (DPA)
      </h1>
      <p className="text-sm text-gray-400 mb-2">
        Data Processing Agreement &mdash; Annexe aux CGU/CGV de Dermotec CRM
      </p>
      <p className="text-sm text-gray-400 mb-10">
        Version en vigueur au 1er mars 2026
      </p>

      <div className="space-y-10 text-gray-700 leading-relaxed text-[15px]">

        {/* ─── Préambule ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Pr&eacute;ambule</h2>
          <p>
            Le pr&eacute;sent Accord de Traitement des Donn&eacute;es (ci-apr&egrave;s &laquo;&nbsp;DPA&nbsp;&raquo;)
            constitue une annexe aux Conditions G&eacute;n&eacute;rales d&apos;Utilisation et de Vente
            (CGU/CGV) de la solution <strong>Dermotec CRM</strong>, &eacute;dit&eacute;e par la soci&eacute;t&eacute;
            <strong> Satorea</strong> (ci-apr&egrave;s &laquo;&nbsp;le Sous-traitant&nbsp;&raquo;).
          </p>
          <p className="mt-2">
            Il d&eacute;finit les conditions dans lesquelles Satorea, en qualit&eacute; de sous-traitant
            au sens de l&apos;article 28 du R&egrave;glement (UE) 2016/679 (RGPD), traite les donn&eacute;es
            personnelles pour le compte du Client (ci-apr&egrave;s &laquo;&nbsp;le Responsable de
            traitement&nbsp;&raquo;).
          </p>
        </section>

        {/* ─── Article 1 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 1 &mdash; Objet</h2>
          <p>
            Le pr&eacute;sent DPA a pour objet de d&eacute;finir les obligations respectives des Parties
            en mati&egrave;re de protection des donn&eacute;es personnelles dans le cadre de l&apos;utilisation
            de la Solution Dermotec CRM.
          </p>
          <p className="mt-2">
            Le Sous-traitant traite les Donn&eacute;es Client exclusivement pour le compte et sur
            instruction du Responsable de traitement, dans le cadre de la fourniture de la Solution.
          </p>
        </section>

        {/* ─── Article 2 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 2 &mdash; Nature et finalit&eacute; du traitement</h2>
          <p>
            Le traitement porte sur les donn&eacute;es personnelles saisies, import&eacute;es ou
            g&eacute;n&eacute;r&eacute;es par le Responsable de traitement dans la Solution Dermotec CRM,
            aux fins suivantes&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Gestion de la relation client et du pipeline commercial (leads, prospects)</li>
            <li>Gestion des inscriptions et sessions de formation</li>
            <li>Suivi p&eacute;dagogique&nbsp;: pr&eacute;sences, &eacute;valuations, certificats</li>
            <li>Gestion des dossiers de financement (OPCO, France Travail, CPF)</li>
            <li>Facturation et suivi des paiements</li>
            <li>Gestion documentaire (conventions, attestations, contrats)</li>
            <li>Communications par email avec les personnes concern&eacute;es</li>
            <li>Conformit&eacute; Qualiopi (7&nbsp;crit&egrave;res, 32&nbsp;indicateurs)</li>
          </ul>
        </section>

        {/* ─── Article 3 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 3 &mdash; Types de donn&eacute;es trait&eacute;es</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#082545] text-white">
                  <th className="text-left py-3 px-4 font-semibold">Cat&eacute;gorie</th>
                  <th className="text-left py-3 px-4 font-semibold">Donn&eacute;es</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">Identit&eacute;</td>
                  <td className="py-3 px-4">Nom, pr&eacute;nom, civilit&eacute;</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Coordonn&eacute;es</td>
                  <td className="py-3 px-4">Adresse email, num&eacute;ro de t&eacute;l&eacute;phone, adresse postale</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Vie professionnelle</td>
                  <td className="py-3 px-4">Statut professionnel, exp&eacute;rience, qualifications, organisme de financement</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Formation</td>
                  <td className="py-3 px-4">Inscriptions, pr&eacute;sences, &eacute;valuations, notes, certificats, attestations</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Documents</td>
                  <td className="py-3 px-4">Conventions de formation, devis, contrats, pi&egrave;ces justificatives</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Paiements</td>
                  <td className="py-3 px-4">Montants, r&eacute;f&eacute;rences factures, statuts de paiement (pas de donn&eacute;es bancaires)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Communications</td>
                  <td className="py-3 px-4">Historique des emails, notes internes, activit&eacute;s CRM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Article 4 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 4 &mdash; Cat&eacute;gories de personnes concern&eacute;es</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Prospects / Leads</strong>&nbsp;: personnes ayant manifest&eacute; un int&eacute;r&ecirc;t pour une formation</li>
            <li><strong>Stagiaires</strong>&nbsp;: personnes inscrites ou ayant suivi une formation</li>
            <li><strong>Mod&egrave;les</strong>&nbsp;: personnes participant aux sessions pratiques en qualit&eacute; de mod&egrave;les</li>
            <li><strong>Partenaires</strong>&nbsp;: organismes de financement, formateurs externes, fournisseurs</li>
            <li><strong>Utilisateurs</strong>&nbsp;: collaborateurs du Responsable de traitement ayant acc&egrave;s &agrave; la Solution</li>
          </ul>
        </section>

        {/* ─── Article 5 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 5 &mdash; Dur&eacute;e du traitement</h2>
          <p>
            Le traitement est effectu&eacute; pendant toute la dur&eacute;e du contrat liant le Responsable
            de traitement au Sous-traitant, augment&eacute;e des dur&eacute;es l&eacute;gales de
            conservation applicables&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Donn&eacute;es CRM</strong>&nbsp;: dur&eacute;e du contrat + 3&nbsp;ans maximum (prescription civile)</li>
            <li><strong>Donn&eacute;es de formation (Qualiopi)</strong>&nbsp;: <strong>6&nbsp;ans minimum</strong> (Code du travail, art. L.6313-1 et suivants)</li>
            <li><strong>Donn&eacute;es comptables</strong>&nbsp;: 10&nbsp;ans (Code de commerce, art. L.123-22)</li>
          </ul>
        </section>

        {/* ─── Article 6 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 6 &mdash; Obligations du Sous-traitant</h2>
          <p className="mb-3">
            Conform&eacute;ment &agrave; l&apos;article 28 du RGPD, le Sous-traitant s&apos;engage &agrave;&nbsp;:
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.1 &mdash; Instructions document&eacute;es</h3>
          <p>
            Traiter les donn&eacute;es personnelles uniquement sur instruction document&eacute;e du
            Responsable de traitement, y compris en ce qui concerne les transferts de donn&eacute;es
            vers un pays tiers. Les CGU/CGV et le pr&eacute;sent DPA constituent les instructions
            document&eacute;es initiales.
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.2 &mdash; Confidentialit&eacute;</h3>
          <p>
            Veiller &agrave; ce que les personnes autoris&eacute;es &agrave; traiter les donn&eacute;es
            personnelles soient soumises &agrave; une obligation de confidentialit&eacute; contractuelle
            ou l&eacute;gale.
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.3 &mdash; Mesures de s&eacute;curit&eacute; (article 32 RGPD)</h3>
          <p>Mettre en &oelig;uvre les mesures techniques et organisationnelles suivantes&nbsp;:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Chiffrement au repos</strong>&nbsp;: AES-256 sur l&apos;ensemble des donn&eacute;es stock&eacute;es</li>
            <li><strong>Chiffrement en transit</strong>&nbsp;: TLS&nbsp;1.3 pour toutes les communications</li>
            <li><strong>Isolation des donn&eacute;es</strong>&nbsp;: Row Level Security (RLS) PostgreSQL garantissant que chaque Client n&apos;acc&egrave;de qu&apos;&agrave; ses propres donn&eacute;es</li>
            <li><strong>Sauvegardes</strong>&nbsp;: backups automatiques quotidiens avec r&eacute;tention de 30&nbsp;jours et tests de restauration p&eacute;riodiques</li>
            <li><strong>Authentification</strong>&nbsp;: MFA disponible pour tous les comptes, mots de passe hash&eacute;s (bcrypt)</li>
            <li><strong>Journalisation</strong>&nbsp;: logs d&apos;acc&egrave;s et d&apos;actions sensibles, conserv&eacute;s 1&nbsp;an</li>
            <li><strong>Contr&ocirc;le d&apos;acc&egrave;s</strong>&nbsp;: principe du moindre privil&egrave;ge, r&ocirc;les granulaires</li>
          </ul>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.4 &mdash; Sous-traitance ult&eacute;rieure</h3>
          <p>
            Ne pas recruter un autre sous-traitant sans l&apos;autorisation &eacute;crite pr&eacute;alable
            g&eacute;n&eacute;rale du Responsable de traitement. Le Sous-traitant informera le Responsable
            de traitement de tout ajout ou remplacement de sous-traitant ult&eacute;rieur avec un
            pr&eacute;avis de <strong>30&nbsp;jours</strong>, laissant au Responsable de traitement la
            possibilit&eacute; de s&apos;y opposer.
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.5 &mdash; Assistance pour les droits des personnes</h3>
          <p>
            Assister le Responsable de traitement, par des mesures techniques et organisationnelles
            appropri&eacute;es, dans l&apos;ex&eacute;cution de son obligation de r&eacute;pondre aux
            demandes d&apos;exercice des droits des personnes concern&eacute;es (articles 15 &agrave; 20
            et 22 du RGPD)&nbsp;: acc&egrave;s, rectification, effacement, limitation, portabilit&eacute;,
            opposition.
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.6 &mdash; Notification des violations</h3>
          <p>
            Notifier le Responsable de traitement de toute violation de donn&eacute;es personnelles dans
            un d&eacute;lai maximum de <strong>48&nbsp;heures</strong> apr&egrave;s en avoir pris connaissance.
            La notification comprendra&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>La nature de la violation (cat&eacute;gories et nombre approximatif de personnes et d&apos;enregistrements concern&eacute;s)</li>
            <li>Les coordonn&eacute;es du DPO ou point de contact</li>
            <li>Les cons&eacute;quences probables de la violation</li>
            <li>Les mesures prises ou propos&eacute;es pour rem&eacute;dier &agrave; la violation</li>
          </ul>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.7 &mdash; Restitution et suppression en fin de contrat</h3>
          <p>
            &Agrave; l&apos;issue du contrat, et selon le choix du Responsable de traitement&nbsp;:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>
              <strong>Restitution</strong>&nbsp;: les Donn&eacute;es Client seront restitu&eacute;es au
              format JSON ou CSV exploitable, sous <strong>15&nbsp;jours ouvr&eacute;s</strong> et sans
              frais suppl&eacute;mentaires
            </li>
            <li>
              <strong>Suppression</strong>&nbsp;: les Donn&eacute;es Client seront d&eacute;finitivement
              supprim&eacute;es dans un d&eacute;lai de <strong>90&nbsp;jours</strong> suivant la fin du
              contrat, avec certificat de destruction sur demande
            </li>
          </ul>
          <p className="mt-2">
            Les donn&eacute;es soumises &agrave; une obligation l&eacute;gale de conservation
            (formation Qualiopi, comptabilit&eacute;) seront archiv&eacute;es dans un acc&egrave;s
            restreint pour la dur&eacute;e requise, puis supprim&eacute;es.
          </p>

          <h3 className="text-base font-semibold text-[#082545] mt-4 mb-2">6.8 &mdash; Droit d&apos;audit</h3>
          <p>
            Mettre &agrave; la disposition du Responsable de traitement toutes les informations
            n&eacute;cessaires pour d&eacute;montrer le respect des obligations pr&eacute;vues &agrave;
            l&apos;article 28 du RGPD, et permettre la r&eacute;alisation d&apos;audits, y compris
            des inspections, par le Responsable de traitement ou un auditeur qu&apos;il a mandat&eacute;.
          </p>
          <p className="mt-2">
            Les audits seront r&eacute;alis&eacute;s avec un pr&eacute;avis raisonnable de 30&nbsp;jours,
            pendant les heures ouvrables, et ne devront pas perturber de mani&egrave;re disproportionn&eacute;e
            les activit&eacute;s du Sous-traitant.
          </p>
        </section>

        {/* ─── Article 7 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 7 &mdash; Obligations du Responsable de traitement</h2>
          <p>Le Responsable de traitement s&apos;engage &agrave;&nbsp;:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Fournir au Sous-traitant des instructions document&eacute;es concernant le traitement</li>
            <li>Veiller &agrave; la lic&eacute;it&eacute; des traitements de donn&eacute;es personnelles effectu&eacute;s via la Solution</li>
            <li>Informer les personnes concern&eacute;es conform&eacute;ment aux articles 13 et 14 du RGPD</li>
            <li>R&eacute;pondre aux demandes d&apos;exercice de droits des personnes concern&eacute;es</li>
            <li>Ne pas saisir de donn&eacute;es sensibles (article 9 du RGPD) sauf n&eacute;cessit&eacute; d&ucirc;ment justifi&eacute;e</li>
            <li>Notifier le Sous-traitant de toute modification de ses instructions de traitement</li>
          </ul>
        </section>

        {/* ─── Article 8 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 8 &mdash; Sous-traitants ult&eacute;rieurs</h2>
          <p className="mb-3">
            Le Responsable de traitement donne une autorisation g&eacute;n&eacute;rale au Sous-traitant
            pour recourir aux sous-traitants ult&eacute;rieurs list&eacute;s ci-dessous. Le Sous-traitant
            s&apos;assure que chaque sous-traitant ult&eacute;rieur est li&eacute; par des obligations
            contractuelles offrant le m&ecirc;me niveau de protection.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#082545] text-white">
                  <th className="text-left py-3 px-4 font-semibold">Sous-traitant</th>
                  <th className="text-left py-3 px-4 font-semibold">Fonction</th>
                  <th className="text-left py-3 px-4 font-semibold">Localisation des donn&eacute;es</th>
                  <th className="text-left py-3 px-4 font-semibold">Garanties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">Supabase Inc.</td>
                  <td className="py-3 px-4">Base de donn&eacute;es PostgreSQL, authentification, stockage</td>
                  <td className="py-3 px-4"><strong>UE (Francfort, Allemagne)</strong></td>
                  <td className="py-3 px-4">SOC&nbsp;2 Type&nbsp;II, donn&eacute;es h&eacute;berg&eacute;es en UE</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Stripe Inc.</td>
                  <td className="py-3 px-4">Traitement des paiements, facturation</td>
                  <td className="py-3 px-4">UE / &Eacute;tats-Unis</td>
                  <td className="py-3 px-4">PCI-DSS Niveau&nbsp;1, DPF, CCT 2021</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Vercel Inc.</td>
                  <td className="py-3 px-4">H&eacute;bergement applicatif, CDN</td>
                  <td className="py-3 px-4">Global (si&egrave;ge &Eacute;tats-Unis)</td>
                  <td className="py-3 px-4">CCT 2021, TIA r&eacute;alis&eacute;</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Resend Inc.</td>
                  <td className="py-3 px-4">Emails transactionnels</td>
                  <td className="py-3 px-4">&Eacute;tats-Unis</td>
                  <td className="py-3 px-4">DPF, CCT 2021</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Upstash Inc.</td>
                  <td className="py-3 px-4">Cache Redis, rate limiting</td>
                  <td className="py-3 px-4">UE (Francfort)</td>
                  <td className="py-3 px-4">Donn&eacute;es en UE</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Inngest Inc.</td>
                  <td className="py-3 px-4">T&acirc;ches asynchrones (background jobs)</td>
                  <td className="py-3 px-4">&Eacute;tats-Unis</td>
                  <td className="py-3 px-4">CCT 2021, TIA r&eacute;alis&eacute;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Article 9 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 9 &mdash; Localisation des donn&eacute;es</h2>
          <p>
            Les donn&eacute;es principales (base de donn&eacute;es PostgreSQL, fichiers stock&eacute;s) sont
            h&eacute;berg&eacute;es au sein de l&apos;Union europ&eacute;enne, sur l&apos;infrastructure
            <strong> Supabase situ&eacute;e &agrave; Francfort (Allemagne)</strong>, r&eacute;gion
            AWS eu-central-1.
          </p>
          <p className="mt-2">
            Les transferts de donn&eacute;es vers des pays tiers sont encadr&eacute;s conform&eacute;ment
            au Chapitre&nbsp;V du RGPD, par les Clauses Contractuelles Types (CCT) adopt&eacute;es par
            la Commission europ&eacute;enne le 4&nbsp;juin 2021 (d&eacute;cision 2021/914) et/ou le Data
            Privacy Framework (DPF). Une Transfer Impact Assessment (TIA) a &eacute;t&eacute;
            r&eacute;alis&eacute;e pour chaque sous-traitant concern&eacute;.
          </p>
        </section>

        {/* ─── Article 10 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 10 &mdash; Sort des donn&eacute;es en fin de contrat</h2>
          <p>
            &Agrave; l&apos;issue du contrat, quelle qu&apos;en soit la cause&nbsp;:
          </p>
          <ol className="list-decimal pl-6 space-y-2 mt-2">
            <li>
              Le Responsable de traitement dispose d&apos;un d&eacute;lai de <strong>15&nbsp;jours
              ouvr&eacute;s</strong> pour demander la restitution de ses Donn&eacute;es Client au format
              JSON ou CSV, sans frais suppl&eacute;mentaires.
            </li>
            <li>
              &Agrave; l&apos;expiration d&apos;un d&eacute;lai de <strong>90&nbsp;jours</strong> suivant
              la fin du contrat, les Donn&eacute;es Client seront d&eacute;finitivement supprim&eacute;es
              de l&apos;ensemble des syst&egrave;mes (production et sauvegardes).
            </li>
            <li>
              Les donn&eacute;es soumises &agrave; une obligation l&eacute;gale de conservation
              (notamment les donn&eacute;es de formation Qualiopi conserv&eacute;es 6&nbsp;ans et les
              donn&eacute;es comptables conserv&eacute;es 10&nbsp;ans) seront archiv&eacute;es en
              acc&egrave;s restreint pour la dur&eacute;e requise.
            </li>
            <li>
              Un certificat de suppression sera fourni sur demande du Responsable de traitement.
            </li>
          </ol>
        </section>

        {/* ─── Article 11 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 11 &mdash; Mesures techniques et organisationnelles</h2>
          <p className="mb-3">
            R&eacute;capitulatif des mesures de s&eacute;curit&eacute; mises en &oelig;uvre par le
            Sous-traitant conform&eacute;ment &agrave; l&apos;article 32 du RGPD&nbsp;:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#082545] text-white">
                  <th className="text-left py-3 px-4 font-semibold">Mesure</th>
                  <th className="text-left py-3 px-4 font-semibold">D&eacute;tail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-medium">Chiffrement au repos</td>
                  <td className="py-3 px-4">AES-256 sur l&apos;ensemble des donn&eacute;es stock&eacute;es (Supabase/AWS)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Chiffrement en transit</td>
                  <td className="py-3 px-4">TLS&nbsp;1.3 obligatoire pour toutes les communications client-serveur et inter-services</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Isolation des donn&eacute;es</td>
                  <td className="py-3 px-4">Row Level Security (RLS) PostgreSQL &mdash; chaque Client isol&eacute; au niveau base de donn&eacute;es</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Authentification</td>
                  <td className="py-3 px-4">MFA (TOTP) disponible, mots de passe hash&eacute;s (bcrypt), sessions avec expiration</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Sauvegardes</td>
                  <td className="py-3 px-4">Backups automatiques quotidiens, r&eacute;tention 30&nbsp;jours, tests de restauration trimestriels</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Logs d&apos;acc&egrave;s</td>
                  <td className="py-3 px-4">Journalisation de toutes les connexions et actions sensibles, conservation 1&nbsp;an</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Contr&ocirc;le d&apos;acc&egrave;s</td>
                  <td className="py-3 px-4">Principe du moindre privil&egrave;ge, r&ocirc;les granulaires, revue des acc&egrave;s trimestrielle</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 font-medium">Gestion des vuln&eacute;rabilit&eacute;s</td>
                  <td className="py-3 px-4">Mises &agrave; jour de s&eacute;curit&eacute; appliqu&eacute;es sous 72h, audit annuel par tiers</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Plan de continuit&eacute;</td>
                  <td className="py-3 px-4">RTO &lt; 4h, RPO &lt; 24h, proc&eacute;dure de reprise d&apos;activit&eacute; document&eacute;e</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Article 12 ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Article 12 &mdash; Dispositions g&eacute;n&eacute;rales</h2>
          <p>
            Le pr&eacute;sent DPA fait partie int&eacute;grante des CGU/CGV de Dermotec CRM. En cas de
            contradiction entre le DPA et les CGU/CGV, les dispositions du DPA pr&eacute;valent en
            mati&egrave;re de protection des donn&eacute;es personnelles.
          </p>
          <p className="mt-2">
            Le DPA est soumis au <strong>droit fran&ccedil;ais</strong>. Tout litige sera soumis &agrave;
            la comp&eacute;tence exclusive des <strong>tribunaux de Paris</strong>.
          </p>
        </section>

        {/* ─── Contact ─── */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">Contact</h2>
          <div className="space-y-1">
            <p><strong>Satorea</strong> &mdash; &Eacute;diteur de Dermotec CRM</p>
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
