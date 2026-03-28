export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { Shield, MapPin, Eye, Users, Lock, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Vos données, nos engagements — Dermotec CRM',
  description: 'Découvrez comment nous protégeons vos données avec la plus grande transparence. Conformité RGPD, hébergement européen, sécurité renforcée.',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F5] to-[#FFF0E5]/20">
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-emerald-200">
            <Shield className="w-4 h-4" />
            Conforme RGPD & AI Act
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-accent font-[family-name:var(--font-heading)] mb-4">
            Vos données, nos engagements
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            On vous explique clairement ce qu'on fait avec vos données. Pas de jargon, pas de cachotteries.
            Juste la transparence que vous méritez.
          </p>
          <p className="text-sm text-slate-400 mt-6">
            Version en vigueur au 1er mars 2026
          </p>
        </div>

        {/* En résumé - Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-8 text-center">
            En résumé
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#E0EBF5] rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-accent mb-2">Hébergement UE</h3>
              <p className="text-sm text-slate-600">Vos données restent en Europe (Allemagne). Aucune surprise.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-accent mb-2">Chiffrement total</h3>
              <p className="text-sm text-slate-600">TLS 1.3 en transit, AES-256 au repos. Niveau bancaire.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#FFE0EF] rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#FF2D78]" />
              </div>
              <h3 className="font-semibold text-accent mb-2">Pas de revente</h3>
              <p className="text-sm text-slate-600">Jamais. On ne monétise pas vos données personnelles.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#FFE0EF] rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-[#FF2D78]" />
              </div>
              <h3 className="font-semibold text-accent mb-2">Vos droits garantis</h3>
              <p className="text-sm text-slate-600">Accès, rectification, suppression. En 30 jours maximum.</p>
            </div>
          </div>
        </section>

        <div className="space-y-16 text-slate-700">

          {/* Introduction */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-lg leading-relaxed">
              <strong>Satorea</strong> édite Dermotec CRM et s'engage à protéger votre vie privée selon les plus hauts standards européens.
              Cette politique vous explique tout : quelles données on collecte, pourquoi, comment on les protège, et surtout vos droits.
            </p>
            <p className="mt-4 text-lg leading-relaxed">
              Nous avons une <strong>double qualification RGPD</strong> : sous-traitant pour vos données CRM, responsable pour nos données techniques.
              On vous détaille tout ci-dessous.
            </p>
          </section>

          {/* 1. Double qualification */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              1. Responsable du traitement — Double qualification
            </h2>
            <p className="mb-6 text-lg">
              <strong>On joue cartes sur table.</strong> Selon le RGPD, nous avons deux casquettes différentes selon le type de données :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-accent text-white">
                    <th className="text-left py-4 px-6 font-semibold">Qualification</th>
                    <th className="text-left py-4 px-6 font-semibold">Données concernées</th>
                    <th className="text-left py-4 px-6 font-semibold">Fondement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium">Sous-traitant (art. 28 RGPD)</td>
                    <td className="py-4 px-6">
                      Données CRM saisies par les Clients (leads, stagiaires, inscriptions, documents,
                      paiements, évaluations)
                    </td>
                    <td className="py-4 px-6">Traitement pour le compte du Client responsable de traitement</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6 font-medium">Responsable de traitement autonome</td>
                    <td className="py-4 px-6">
                      Données techniques et d'usage (logs, métriques, analytics), données
                      de compte utilisateur, données de facturation
                    </td>
                    <td className="py-4 px-6">Maintenance, sécurité, évolution de la Solution, intérêt légitime</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-[#E0EBF5] rounded-lg border border-[#6B8CAE]/30">
              <p className="text-accent">
                <strong>Concrètement :</strong> si vous êtes client Dermotec CRM, vous restez maître de vos données CRM.
                Nous ne faisons que les héberger et les traiter selon vos instructions.
                Notre Accord de Traitement des Données (DPA) est disponible à{' '}
                <a href="/dpa" className="text-primary hover:underline font-medium">/dpa</a>.
              </p>
            </div>
            <div className="mt-6 space-y-2 text-sm bg-slate-50 p-4 rounded-lg">
              <p><strong>Satorea</strong></p>
              <p>75 Boulevard Richard Lenoir, 75011 Paris</p>
              <p>Email : <a href="mailto:support@satorea.fr" className="text-primary hover:underline">support@satorea.fr</a></p>
              <p>Délégué à la Protection des Données (DPO) :{' '}
                <a href="mailto:dpo@satorea.fr" className="text-primary hover:underline font-medium">dpo@satorea.fr</a>
              </p>
            </div>
          </section>

          {/* 2. Données collectées */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              2. Données personnelles collectées
            </h2>
            <p className="mb-6 text-lg">
              <strong>Voici exactement ce qu'on collecte et pourquoi.</strong> Chaque donnée a une finalité précise et une durée de conservation définie.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-accent text-white">
                    <th className="text-left py-4 px-6 font-semibold">Catégorie</th>
                    <th className="text-left py-4 px-6 font-semibold">Données</th>
                    <th className="text-left py-4 px-6 font-semibold">Finalité</th>
                    <th className="text-left py-4 px-6 font-semibold">Base légale</th>
                    <th className="text-left py-4 px-6 font-semibold">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium">Compte utilisateur</td>
                    <td className="py-4 px-6">Nom, prénom, email, mot de passe (hashé)</td>
                    <td className="py-4 px-6">Création et gestion du compte</td>
                    <td className="py-4 px-6">Exécution contractuelle</td>
                    <td className="py-4 px-6">Durée du contrat + 3 ans</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6 font-medium">Facturation</td>
                    <td className="py-4 px-6">Raison sociale, adresse, SIRET, données Stripe</td>
                    <td className="py-4 px-6">Facturation et comptabilité</td>
                    <td className="py-4 px-6">Obligation légale</td>
                    <td className="py-4 px-6">10 ans</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium">Données CRM (sous-traitance)</td>
                    <td className="py-4 px-6">Leads, stagiaires, inscriptions, présences, évaluations, documents</td>
                    <td className="py-4 px-6">Fourniture du service CRM</td>
                    <td className="py-4 px-6">Exécution contractuelle (Client RT)</td>
                    <td className="py-4 px-6">Durée du contrat + 3 ans max</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6 font-medium">Données de formation</td>
                    <td className="py-4 px-6">Présences, évaluations, certificats, attestations Qualiopi</td>
                    <td className="py-4 px-6">Conformité Qualiopi et obligations formation</td>
                    <td className="py-4 px-6">Obligation légale</td>
                    <td className="py-4 px-6 font-medium">6 ans minimum</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium">Données d'usage</td>
                    <td className="py-4 px-6">Logs de connexion, actions, performances, adresse IP, user-agent</td>
                    <td className="py-4 px-6">Sécurité, maintenance, amélioration</td>
                    <td className="py-4 px-6">Intérêt légitime</td>
                    <td className="py-4 px-6">1 an</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6 font-medium">Données dérivées</td>
                    <td className="py-4 px-6">Scores, analytics, benchmarks, statistiques agrégées</td>
                    <td className="py-4 px-6">Amélioration de la Solution, R&D</td>
                    <td className="py-4 px-6">Intérêt légitime</td>
                    <td className="py-4 px-6">Indéfiniment (anonymisées)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium">Cookies analytiques</td>
                    <td className="py-4 px-6">Identifiants Vercel Analytics</td>
                    <td className="py-4 px-6">Mesure d'audience</td>
                    <td className="py-4 px-6">Consentement</td>
                    <td className="py-4 px-6">13 mois</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Sous-traitants */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              3. Sous-traitants et transferts de données
            </h2>
            <p className="mb-6 text-lg">
              <strong>Nos partenaires sont triés sur le volet.</strong> Chacun respecte les plus hauts standards de sécurité et de confidentialité.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-accent text-white">
                    <th className="text-left py-4 px-6 font-semibold">Sous-traitant</th>
                    <th className="text-left py-4 px-6 font-semibold">Rôle</th>
                    <th className="text-left py-4 px-6 font-semibold">Localisation</th>
                    <th className="text-left py-4 px-6 font-semibold">Garanties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium">Supabase</td>
                    <td className="py-4 px-6">Base de données, authentification, stockage</td>
                    <td className="py-4 px-6">UE (Francfort, Allemagne)</td>
                    <td className="py-4 px-6">SOC 2 Type II, données en UE</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6 font-medium">Stripe</td>
                    <td className="py-4 px-6">Traitement des paiements</td>
                    <td className="py-4 px-6">UE / États-Unis</td>
                    <td className="py-4 px-6">PCI-DSS Niveau 1, DPF, CCT</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium">Vercel</td>
                    <td className="py-4 px-6">Hébergement, CDN, analytics</td>
                    <td className="py-4 px-6">Global (siège États-Unis)</td>
                    <td className="py-4 px-6">CCT 2021, TIA réalisé</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6 font-medium">Resend</td>
                    <td className="py-4 px-6">Emails transactionnels</td>
                    <td className="py-4 px-6">États-Unis</td>
                    <td className="py-4 px-6">DPF, CCT 2021</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium">Upstash</td>
                    <td className="py-4 px-6">Cache Redis, rate limiting</td>
                    <td className="py-4 px-6">UE (Francfort)</td>
                    <td className="py-4 px-6">Données en UE</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6 font-medium">Inngest</td>
                    <td className="py-4 px-6">Tâches asynchrones (background jobs)</td>
                    <td className="py-4 px-6">États-Unis</td>
                    <td className="py-4 px-6">CCT 2021, TIA réalisé</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 bg-[#FFF3E8] rounded-lg border border-[#FF8C42]/30">
              <h3 className="text-lg font-semibold text-accent mb-3">Transferts hors Union européenne</h3>
              <p className="text-accent">
                <strong>Sécurité renforcée pour les transferts US.</strong> Tous nos partenaires américains sont encadrés par les
                <strong> Clauses Contractuelles Types (CCT) de la Commission européenne</strong> et/ou le Data Privacy Framework.
              </p>
              <p className="mt-2 text-accent">
                Nous avons réalisé une <strong>Transfer Impact Assessment (TIA)</strong> pour chaque sous-traitant hors UE.
                Vos données bénéficient du même niveau de protection qu'en Europe.
              </p>
            </div>
          </section>

          {/* 4. Cookies */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              4. Cookies
            </h2>
            <p className="mb-6 text-lg">
              <strong>On utilise le minimum de cookies nécessaires.</strong> Pas de tracking publicitaire, juste ce qu'il faut pour que ça marche bien.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-800 mb-3">
                  <Zap className="w-5 h-5 inline mr-2" />
                  Cookies essentiels
                </h3>
                <p className="text-emerald-700 text-sm mb-3">Pas besoin de consentement — indispensables au fonctionnement</p>
                <ul className="space-y-2 text-sm text-emerald-700">
                  <li><strong>Session Supabase</strong> — Authentification (durée de session)</li>
                  <li><strong>CSRF token</strong> — Protection contre les attaques (durée de session)</li>
                </ul>
              </div>

              <div className="p-6 bg-[#E0EBF5] rounded-lg border border-[#6B8CAE]/30">
                <h3 className="text-lg font-semibold text-[#6B8CAE] mb-3">
                  <Eye className="w-5 h-5 inline mr-2" />
                  Cookies analytiques
                </h3>
                <p className="text-[#6B8CAE] text-sm mb-3">Avec votre consentement — pour améliorer l'expérience</p>
                <ul className="space-y-2 text-sm text-[#6B8CAE]">
                  <li><strong>Vercel Analytics</strong> — Mesure d'audience anonymisée (13 mois max)</li>
                </ul>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Vous pouvez modifier vos préférences à tout moment via le bandeau de consentement ou les paramètres de votre navigateur.
            </p>
          </section>

          {/* 5. Durées de conservation */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              5. Durées de conservation
            </h2>
            <p className="mb-6 text-lg">
              <strong>On ne garde rien indéfiniment.</strong> Chaque donnée a sa durée de vie, définie par la loi ou la finalité du traitement.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-accent text-white">
                    <th className="text-left py-4 px-6 font-semibold">Type de données</th>
                    <th className="text-left py-4 px-6 font-semibold">Durée</th>
                    <th className="text-left py-4 px-6 font-semibold">Fondement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6">Données CRM (leads, contacts)</td>
                    <td className="py-4 px-6">Durée du contrat + 3 ans max</td>
                    <td className="py-4 px-6">Prescription civile</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6">Données de formation (Qualiopi)</td>
                    <td className="py-4 px-6 font-medium">6 ans minimum</td>
                    <td className="py-4 px-6">Code du travail (art. L.6313-1 et s.)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6">Factures et données comptables</td>
                    <td className="py-4 px-6">10 ans</td>
                    <td className="py-4 px-6">Code de commerce (art. L.123-22)</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6">Données d'usage et logs</td>
                    <td className="py-4 px-6">1 an</td>
                    <td className="py-4 px-6">Intérêt légitime</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6">Cookies analytiques</td>
                    <td className="py-4 px-6">13 mois</td>
                    <td className="py-4 px-6">Recommandation CNIL</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6">Données anonymisées / agrégées</td>
                    <td className="py-4 px-6">Indéfiniment</td>
                    <td className="py-4 px-6">Hors champ RGPD</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-accent text-sm">
                <strong>Suppression automatique :</strong> Au-delà des durées indiquées, les données sont supprimées
                ou anonymisées de manière irréversible. Aucune intervention manuelle requise.
              </p>
            </div>
          </section>

          {/* 6. Anonymisation */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              6. Anonymisation et données dérivées
            </h2>
            <p className="mb-6 text-lg">
              <strong>Les données anonymisées nous aident à améliorer le produit.</strong> Une fois anonymisées,
              elles ne vous identifient plus et sortent du champ RGPD.
            </p>
            <div className="bg-gradient-to-r from-[#FFF0E5] to-[#FFE0EF] p-6 rounded-lg border border-[#6B8CAE]/30 mb-6">
              <h3 className="font-semibold text-accent mb-3">Ce qu'on peut faire avec les données anonymisées :</h3>
              <ul className="space-y-2 text-sm text-accent">
                <li>• Produire des benchmarks sectoriels anonymisés</li>
                <li>• Améliorer les algorithmes de la Solution</li>
                <li>• Développer de nouvelles fonctionnalités</li>
                <li>• Publier des études statistiques sur le secteur de la formation esthétique</li>
              </ul>
            </div>
            <div className="p-4 bg-[#FFF3E8] rounded-lg border border-[#FF8C42]/30">
              <p className="text-accent text-sm">
                <strong>Propriété intellectuelle :</strong> Satorea détient l'intégralité des droits sur les données dérivées
                (scores, analyses, indicateurs) générées par l'utilisation de la Solution.
              </p>
            </div>
          </section>

          {/* 7. IA - Section conservée telle quelle car déjà bien rédigée */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              7. Intelligence artificielle et algorithmes
            </h2>

            <h3 className="text-lg font-semibold text-accent mt-6 mb-4">7.1 Transparence (Règlement UE 2024/1689 — AI Act, art. 50)</h3>
            <p className="mb-4">
              La Solution Dermotec CRM intègre des fonctionnalités d'intelligence artificielle.
              Conformément au Règlement européen sur l'intelligence artificielle
              (AI Act), nous vous informons que :
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>Assistant conversationnel (« Léa »)</strong> : un chatbot
                propulsé par IA qui répond aux questions des prospects et clients. Chaque conversation
                débute par une identification claire : <em>« Je suis Léa, assistante
                IA de Dermotec »</em>. Les réponses sont générées par des
                modèles de langage et ne remplacent pas un conseil professionnel.
              </li>
              <li>
                <strong>Scoring prédictif</strong> : un score de 0 à 100 est attribué
                à chaque lead pour aider les commerciaux à prioriser leurs actions. Ce score constitue
                une <strong>aide à la décision</strong>, jamais une décision automatisée.
              </li>
              <li>
                <strong>Génération de contenus</strong> : emails, réponses aux objections
                et suggestions commerciales sont proposés par l'IA et toujours soumis à validation
                humaine avant envoi.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-accent mt-6 mb-4">7.2 Absence de décision entièrement automatisée (art. 22 RGPD)</h3>
            <p className="mb-4">
              Les algorithmes de la Solution n'opèrent <strong>aucune prise de décision
              entièrement automatisée</strong> au sens de l'article 22 du RGPD. Les scores,
              recommandations et contenus générés constituent des aides à la
              décision et sont <strong>toujours soumis à la validation humaine</strong> du Client
              avant toute action.
            </p>
            <p className="mb-6">
              Le scoring des leads relève du <strong>profilage</strong> au sens de l'article 4(4)
              du RGPD. Conformément aux articles 13 et 14, nous vous informons de l'existence de
              ce profilage et de sa logique sous-jacente : le score est calculé à partir de
              critères objectifs (complétude du profil, engagement, statut professionnel, formation
              visée) sans utiliser de catégories de données sensibles (art. 9 RGPD).
            </p>

            <h3 className="text-lg font-semibold text-accent mb-4">7.3 Sous-traitants IA</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-accent text-white">
                    <th className="text-left py-4 px-6 font-semibold">Fournisseur</th>
                    <th className="text-left py-4 px-6 font-semibold">Modèle</th>
                    <th className="text-left py-4 px-6 font-semibold">Usage</th>
                    <th className="text-left py-4 px-6 font-semibold">Données transmises</th>
                    <th className="text-left py-4 px-6 font-semibold">Garanties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium">Anthropic</td>
                    <td className="py-4 px-6">Claude Haiku</td>
                    <td className="py-4 px-6">Chatbot, scoring, objections</td>
                    <td className="py-4 px-6">Messages conversation (sans PII identifiants directs)</td>
                    <td className="py-4 px-6">API stateless, données non utilisées pour l'entraînement, CCT</td>
                  </tr>
                  <tr className="bg-slate-50 hover:bg-slate-100">
                    <td className="py-4 px-6 font-medium">DeepSeek</td>
                    <td className="py-4 px-6">DeepSeek Chat</td>
                    <td className="py-4 px-6">Assistant IA, génération emails</td>
                    <td className="py-4 px-6">Contexte commercial (sans PII identifiants directs)</td>
                    <td className="py-4 px-6">API stateless, données non utilisées pour l'entraînement</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-[#ECFDF5] rounded-lg border border-[#10B981]/30">
              <p className="text-[#10B981] text-sm">
                <strong>Minimisation des données IA :</strong> seules les données strictement nécessaires
                sont transmises aux IA (contexte conversation, catalogue formations).
                Les identifiants personnels ne sont transmis que si nécessaire à la personnalisation.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-accent mt-6 mb-4">7.4 Utilisation des données pour l'amélioration des algorithmes</h3>
            <p className="mb-6">
              Satorea peut utiliser des données <strong>pseudonymisées ou anonymisées</strong> pour
              l'amélioration de ses algorithmes de scoring, de recommandation et d'analyse
              prédictive, dans le respect des recommandations de la CNIL relatives à l'utilisation
              de données personnelles dans les systèmes d'IA.
            </p>

            <h3 className="text-lg font-semibold text-accent mb-4">7.5 Classification du risque (AI Act)</h3>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-emerald-800">
                <strong>Bonne nouvelle :</strong> Les fonctionnalités IA de Dermotec CRM ne relèvent
                <strong> pas de la catégorie « haut risque »</strong> au sens du Règlement AI Act.
                Elles sont classées comme systèmes à risque limité, soumises aux seules obligations de transparence.
              </p>
            </div>
          </section>

          {/* 8. Droits RGPD */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              8. Vos droits (articles 15 à 22 du RGPD)
            </h2>
            <p className="mb-6 text-lg">
              <strong>Vous gardez le contrôle total sur vos données.</strong> Voici tous vos droits et comment les exercer simplement.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#E0EBF5] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Eye className="w-4 h-4 text-[#6B8CAE]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent">Droit d'accès (art. 15)</h3>
                    <p className="text-sm text-slate-600">Savoir quelles données on a sur vous et en recevoir une copie</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent">Droit de rectification (art. 16)</h3>
                    <p className="text-sm text-slate-600">Corriger des données inexactes ou incomplètes</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#FFE0EF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-4 h-4 text-[#FF2D78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent">Droit à l'effacement (art. 17)</h3>
                    <p className="text-sm text-slate-600">Demander la suppression, sauf obligations légales</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#FFE0EF] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Lock className="w-4 h-4 text-[#FF2D78]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent">Droit à la limitation (art. 18)</h3>
                    <p className="text-sm text-slate-600">Restreindre le traitement dans certains cas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent">Droit à la portabilité (art. 20)</h3>
                    <p className="text-sm text-slate-600">Récupérer vos données en format JSON/CSV</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#FFF3E8] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <MapPin className="w-4 h-4 text-[#FF8C42]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-accent">Droit d'opposition (art. 21)</h3>
                    <p className="text-sm text-slate-600">S'opposer au profilage et à l'intérêt légitime</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-[#FFF0E5] to-[#FFE0EF] rounded-lg border border-[#6B8CAE]/30">
              <h3 className="font-semibold text-accent mb-2">Comment exercer vos droits ?</h3>
              <p className="text-accent mb-3">
                Envoyez simplement un email à{' '}
                <a href="mailto:dpo@satorea.fr" className="text-primary hover:underline font-medium">dpo@satorea.fr</a>
                {' '}en précisant votre demande. Joignez un justificatif d'identité pour la sécurité.
              </p>
              <p className="text-accent text-sm">
                <strong>Délai de réponse garanti :</strong> 30 jours maximum. Souvent moins !
              </p>
            </div>

            <div className="mt-4 p-4 bg-[#FFF3E8] rounded-lg border border-[#FF8C42]/30">
              <p className="text-[#FF8C42] text-sm">
                <strong>Données saisies par un client :</strong> Si vos données ont été saisies dans Dermotec CRM
                par un centre de formation, adressez-vous directement au centre. Nous l'assisterons dans le traitement.
              </p>
            </div>
          </section>

          {/* 9. Réclamation CNIL */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              9. Réclamation auprès de la CNIL
            </h2>
            <p className="text-lg mb-4">
              <strong>Pas satisfait de notre réponse ?</strong> Vous avez le droit de saisir directement l'autorité de contrôle.
            </p>
            <div className="p-6 bg-slate-50 rounded-lg">
              <p className="text-accent mb-3">
                Vous pouvez introduire une réclamation auprès de la{' '}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Commission Nationale de l'Informatique et des Libertés (CNIL)
                </a>.
              </p>
              <p className="text-sm text-slate-600">
                CNIL - 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
              </p>
            </div>
            <p className="mt-4 text-slate-600">
              <strong>On préfère dialoguer :</strong> Contactez-nous d'abord à{' '}
              <a href="mailto:dpo@satorea.fr" className="text-primary hover:underline">dpo@satorea.fr</a>.
              On résout souvent les problèmes plus vite que l'administration !
            </p>
          </section>

          {/* 10. Sécurité */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              10. Sécurité des données
            </h2>
            <p className="text-lg mb-6">
              <strong>Vos données sont protégées comme un coffre-fort numérique.</strong>
              Voici nos mesures de sécurité techniques et organisationnelles.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h3 className="font-semibold text-emerald-800 mb-2">Chiffrement</h3>
                <p className="text-sm text-emerald-700">TLS 1.3 en transit<br/>AES-256 au repos</p>
              </div>

              <div className="p-4 bg-[#E0EBF5] rounded-lg border border-[#6B8CAE]/30">
                <h3 className="font-semibold text-[#6B8CAE] mb-2">Isolation</h3>
                <p className="text-sm text-[#6B8CAE]">Row Level Security PostgreSQL<br/>Données clients étanches</p>
              </div>

              <div className="p-4 bg-[#FFE0EF] rounded-lg border border-[#FF2D78]/30">
                <h3 className="font-semibold text-[#FF2D78] mb-2">Authentification</h3>
                <p className="text-sm text-[#FF2D78]">MFA disponible<br/>Tous comptes protégés</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">Sauvegardes</h3>
                <p className="text-sm text-orange-700">Quotidiennes automatiques<br/>Rétention 30 jours</p>
              </div>

              <div className="p-4 bg-[#FFE0EF] rounded-lg border border-[#FF2D78]/30">
                <h3 className="font-semibold text-[#FF2D78] mb-2">Monitoring</h3>
                <p className="text-sm text-[#FF2D78]">Logs des accès<br/>Actions sensibles tracées</p>
              </div>

              <div className="p-4 bg-[#FFF3E8] rounded-lg border border-[#FF8C42]/30">
                <h3 className="font-semibold text-[#FF8C42] mb-2">Audits</h3>
                <p className="text-sm text-[#FF8C42]">Sécurité annuelle<br/>Tiers indépendant</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-accent text-sm">
                <strong>En cas de violation de données :</strong> notification sous 48h conformément à l'article 32 du RGPD.
                Politique de gestion des incidents documentée et testée.
              </p>
            </div>
          </section>

          {/* 11. Modifications */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-semibold text-accent font-[family-name:var(--font-heading)] mb-6">
              11. Modifications de la politique
            </h2>
            <p className="text-lg">
              <strong>On vous prévient toujours des changements importants.</strong>
              Toute modification substantielle vous sera notifiée par email ou dans l'application,
              minimum 30 jours avant entrée en vigueur.
            </p>
            <div className="mt-4 p-4 bg-[#E0EBF5] rounded-lg border border-[#6B8CAE]/30">
              <p className="text-[#6B8CAE] text-sm">
                <strong>Modifications mineures</strong> (corrections, clarifications) :
                mise à jour directe avec notification dans l'historique.
              </p>
            </div>
          </section>

        </div>

        {/* Footer contact */}
        <div className="mt-16 bg-gradient-to-r from-primary to-accent p-8 rounded-2xl text-white text-center">
          <h2 className="text-2xl font-semibold font-[family-name:var(--font-heading)] mb-4">
            Une question sur vos données ?
          </h2>
          <p className="text-[#6B8CAE] mb-6">
            Notre Délégué à la Protection des Données vous répond directement.
          </p>
          <a
            href="mailto:dpo@satorea.fr"
            className="inline-flex items-center gap-2 bg-white text-accent px-6 py-3 rounded-lg font-medium hover:bg-[#E0EBF5] transition-colors"
          >
            Contactez notre DPO
          </a>
        </div>

        {/* Dernière mise à jour */}
        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400">Dernière mise à jour : mars 2026</p>
        </div>
      </div>
    </div>
  )
}