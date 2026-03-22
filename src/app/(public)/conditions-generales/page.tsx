export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales — Dermotec CRM',
  description: 'Nos conditions générales expliquées simplement : ce que vous pouvez attendre de nous, et ce que nous attendons de vous.',
}

export default function ConditionsGeneralesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-accent font-[family-name:var(--font-heading)] mb-4">
              Conditions Générales
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Nos CGV en clair : ce que vous pouvez attendre de nous, et ce que nous attendons de vous.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Version mars 2026
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table des matières */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="font-semibold text-accent mb-4">Sommaire</h3>
              <nav className="space-y-2 text-sm">
                <a href="#objet" className="block text-gray-600 hover:text-primary transition-colors">
                  1. Ce que fait Dermotec CRM
                </a>
                <a href="#definitions" className="block text-gray-600 hover:text-primary transition-colors">
                  2. Les mots importants
                </a>
                <a href="#inscription" className="block text-gray-600 hover:text-primary transition-colors">
                  3. Comment ça marche
                </a>
                <a href="#tarifs" className="block text-gray-600 hover:text-primary transition-colors">
                  4. Combien ça coûte
                </a>
                <a href="#donnees" className="block text-gray-600 hover:text-primary transition-colors">
                  5. Vos données vous appartiennent
                </a>
                <a href="#propriete" className="block text-gray-600 hover:text-primary transition-colors">
                  6. Ce qui est à vous, ce qui est à nous
                </a>
                <a href="#disponibilite" className="block text-gray-600 hover:text-primary transition-colors">
                  7. Notre engagement de service
                </a>
                <a href="#responsabilite" className="block text-gray-600 hover:text-primary transition-colors">
                  8. Nos limites
                </a>
                <a href="#resiliation" className="block text-gray-600 hover:text-primary transition-colors">
                  9. Comment arrêter
                </a>
                <a href="#droit" className="block text-gray-600 hover:text-primary transition-colors">
                  10. Droit applicable
                </a>
              </nav>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3 space-y-8">
            {/* Article 1 - Objet */}
            <section id="objet" className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                1. Ce que fait Dermotec CRM
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                **Dermotec CRM est un logiciel SaaS qui simplifie la gestion de votre centre de formation esthétique.**
              </p>
              <div className="space-y-3 text-gray-700">
                <p>
                  Satorea SAS (nous), société par actions simplifiée située au 75 Boulevard Richard Lenoir, 75011 Paris,
                  édite et exploite Dermotec CRM. Notre solution vous aide à gérer vos leads, sessions de formation,
                  financements et suivi stagiaires en un seul endroit.
                </p>
                <p>
                  En utilisant Dermotec CRM, vous acceptez ces conditions générales d'utilisation et de vente (CGU/CGV).
                  C'est notre contrat : lisible, équitable, et respectueux de vos droits.
                </p>
              </div>
            </section>

            {/* Article 2 - Définitions */}
            <section id="definitions" className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                2. Les mots importants
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                **Pour éviter tout malentendu, voici ce que nous entendons par les termes clés.**
              </p>
              <div className="grid gap-4">
                <div className="bg-white p-4 rounded border-l-4 border-primary">
                  <h3 className="font-semibold text-gray-900 mb-2">Client</h3>
                  <p className="text-gray-700">Votre centre de formation qui souscrit à un plan Dermotec CRM</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-primary">
                  <h3 className="font-semibold text-gray-900 mb-2">Utilisateur</h3>
                  <p className="text-gray-700">Toute personne de votre équipe qui a accès au logiciel</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-primary">
                  <h3 className="font-semibold text-gray-900 mb-2">Vos Données</h3>
                  <p className="text-gray-700">Tout ce que vous saisissez : leads, stagiaires, documents, sessions, etc.</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-primary">
                  <h3 className="font-semibold text-gray-900 mb-2">Données d'Usage</h3>
                  <p className="text-gray-700">Les informations techniques sur votre utilisation du logiciel (connexions, clics, performances)</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-primary">
                  <h3 className="font-semibold text-gray-900 mb-2">Insights</h3>
                  <p className="text-gray-700">Les scores, analyses et statistiques que génère notre intelligence artificielle</p>
                </div>
              </div>
            </section>

            {/* Article 3 - Inscription */}
            <section id="inscription" className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                3. Comment ça marche
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                **Créez votre compte en 2 minutes, sécurisez-le, et commencez à utiliser le CRM immédiatement.**
              </p>
              <div className="space-y-4 text-gray-700">
                <p>
                  L'inscription nécessite une adresse email valide que nous vérifierons. Nous recommandons fortement
                  l'authentification à deux facteurs (MFA) pour protéger votre compte — elle pourra devenir obligatoire
                  sur certains plans dans le futur.
                </p>
                <p>
                  Vous êtes responsable de la sécurité de vos identifiants et de toute activité sur vos comptes.
                  Si vous soupçonnez une intrusion, prévenez-nous immédiatement à{' '}
                  <a href="mailto:support@satorea.fr" className="text-primary hover:underline font-medium">
                    support@satorea.fr
                  </a>.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800">
                    <span className="font-semibold">Note :</span> Nous nous réservons le droit de suspendre tout compte
                    présentant un risque de sécurité ou une utilisation abusive.
                  </p>
                </div>
              </div>
            </section>

            {/* Article 4 - Tarifs */}
            <section id="tarifs" className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                4. Combien ça coûte
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-6">
                **Quatre plans pour s'adapter à votre taille et vos besoins, du gratuit au sur-mesure.**
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="font-bold text-lg text-accent mb-2">Découverte</h3>
                  <div className="text-2xl font-bold text-gray-900 mb-3">Gratuit</div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• 1 utilisateur</li>
                    <li>• 50 leads maximum</li>
                    <li>• Pipeline simple</li>
                    <li>• Fonctions de base</li>
                  </ul>
                  <p className="text-xs text-gray-500">Pour découvrir et tester</p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-primary">
                  <h3 className="font-bold text-lg text-accent mb-2">Pro</h3>
                  <div className="text-2xl font-bold text-gray-900 mb-1">29€ HT/mois</div>
                  <div className="text-sm text-gray-500 mb-3">35€ TTC/mois</div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• 3 utilisateurs</li>
                    <li>• Leads illimités</li>
                    <li>• Pipeline avancé + financement</li>
                    <li>• Sessions et facturation</li>
                  </ul>
                  <p className="text-xs text-gray-500">Pour les centres actifs</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="font-bold text-lg text-accent mb-2">Expert</h3>
                  <div className="text-2xl font-bold text-gray-900 mb-1">79€ HT/mois</div>
                  <div className="text-sm text-gray-500 mb-3">95€ TTC/mois</div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• 10 utilisateurs</li>
                    <li>• Analytics avancés</li>
                    <li>• Support prioritaire + API</li>
                    <li>• Module Qualiopi</li>
                  </ul>
                  <p className="text-xs text-gray-500">Pour optimiser et grandir</p>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="font-bold text-lg text-accent mb-2">Clinique</h3>
                  <div className="text-2xl font-bold text-gray-900 mb-3">Sur devis</div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Utilisateurs illimités</li>
                    <li>• Multi-sites</li>
                    <li>• Intégrations sur mesure</li>
                    <li>• Accompagnement dédié</li>
                  </ul>
                  <p className="text-xs text-gray-500">Pour les groupes et réseaux</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">Facturation mensuelle</span> à date d'anniversaire.
                  Paiement sécurisé par Stripe. Nous pouvons ajuster nos tarifs avec 30 jours de préavis par email.
                </p>
              </div>
            </section>

            {/* Article 5 - Données */}
            <section id="donnees" className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                5. Vos données vous appartiennent
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                **Nous sommes le coffre-fort de vos données, pas leur propriétaire. Elles restent à vous.**
              </p>
              <div className="space-y-4 text-gray-700">
                <p>
                  Nous agissons comme <strong>sous-traitant RGPD</strong> pour vos données clients (leads, stagiaires, etc.)
                  et comme <strong>responsable de traitement</strong> pour les données techniques nécessaires
                  au fonctionnement du service.
                </p>
                <p>
                  En tant que centre de formation, vous restez responsable de la conformité RGPD de vos propres
                  traitements : base légale, information des personnes, réponse aux demandes de droits.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    <span className="font-semibold">Vos obligations :</span> Disposer d'une base légale pour
                    chaque donnée saisie, informer vos stagiaires et prospects, ne pas saisir de données sensibles
                    sauf nécessité justifiée.
                  </p>
                </div>
                <p>
                  Tous les détails sont dans notre{' '}
                  <a href="/dpa" className="text-primary hover:underline font-medium">
                    Accord de Traitement des Données (DPA)
                  </a>.
                </p>
              </div>
            </section>

            {/* Article 6 - Propriété intellectuelle */}
            <section id="propriete" className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                6. Ce qui est à vous, ce qui est à nous
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                **Simple : vos données restent vôtres, notre technologie reste nôtre.**
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="font-semibold text-primary mb-3">💾 À vous</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Toutes vos données (leads, stagiaires, documents)</li>
                    <li>• Le contenu que vous créez</li>
                    <li>• Votre base de connaissances</li>
                    <li>• Export garanti en cas d'arrêt</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="font-semibold text-accent mb-3">⚙️ À nous</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Le logiciel Dermotec CRM</li>
                    <li>• Nos algorithmes et IA</li>
                    <li>• Les analyses et scores générés</li>
                    <li>• Notre base de données produit</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <span className="font-semibold">Usage autorisé :</span> Vous pouvez utiliser Dermotec CRM
                  dans le cadre de votre plan, mais pas le copier, le revendre ou l'ingénierie inverse.
                </p>
              </div>
            </section>

            {/* Article 7 - Disponibilité */}
            <section id="disponibilite" className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                7. Notre engagement de service
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                **Nous visons 99,5% de disponibilité et des performances optimales, avec transparence totale.**
              </p>
              <div className="space-y-4 text-gray-700">
                <p>
                  Notre infrastructure moderne (Vercel, Supabase) nous permet d'atteindre d'excellents niveaux
                  de service. Nous surveillons la performance 24h/24 et communiquons proactivement sur tout incident.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Ce que nous garantissons</h4>
                    <ul className="text-green-700 space-y-1 text-sm">
                      <li>• Sauvegardes automatiques</li>
                      <li>• Sécurité renforcée</li>
                      <li>• Monitoring continu</li>
                      <li>• Support réactif</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Maintenances</h4>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• Prévues en heures creuses</li>
                      <li>• Notification 48h à l'avance</li>
                      <li>• Durée minimisée</li>
                      <li>• Zero-downtime quand possible</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Note :</span> Ces objectifs de disponibilité sont un engagement
                  de moyens, pas une garantie contractuelle absolue — parce qu'Internet reste Internet.
                </p>
              </div>
            </section>

            {/* Article 8 - Responsabilité */}
            <section id="responsabilite" className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                8. Nos limites
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                **Nous assumons nos responsabilités, mais dans des limites raisonnables et équitables.**
              </p>
              <div className="space-y-4 text-gray-700">
                <p>
                  En cas de problème causé par Dermotec CRM, notre responsabilité est limitée au montant
                  de vos abonnements des 12 derniers mois. C'est la pratique standard du SaaS — et c'est
                  pourquoi nous investissons massivement dans la prévention plutôt que dans les assurances.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-red-300">
                    <h4 className="font-semibold text-red-800 mb-2">Exclusions</h4>
                    <ul className="text-red-700 space-y-1 text-sm">
                      <li>• Panne d'internet chez vous</li>
                      <li>• Erreur de manipulation</li>
                      <li>• Virus sur vos appareils</li>
                      <li>• Force majeure</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-300">
                    <h4 className="font-semibold text-green-800 mb-2">Notre engagement</h4>
                    <ul className="text-green-700 space-y-1 text-sm">
                      <li>• Résolution rapide des bugs</li>
                      <li>• Support réactif</li>
                      <li>• Remboursement pro-rata si service indisponible</li>
                      <li>• Transparence totale</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Article 9 - Résiliation */}
            <section id="resiliation" className="bg-white rounded-lg p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                9. Comment arrêter
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                **Vous pouvez arrêter quand vous voulez, et nous vous accompagnons pour récupérer vos données.**
              </p>
              <div className="space-y-4 text-gray-700">
                <p>
                  Aucun engagement de durée : résiliez votre abonnement depuis les paramètres de votre compte
                  ou par email à{' '}
                  <a href="mailto:support@satorea.fr" className="text-primary hover:underline font-medium">
                    support@satorea.fr
                  </a>.
                  L'accès continue jusqu'à la fin de votre période de facturation en cours.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Récupération de vos données</h4>
                  <p className="text-blue-700 text-sm">
                    Pendant 30 jours après résiliation, vous pouvez télécharger un export complet de vos données
                    (JSON + CSV). Passé ce délai, elles sont définitivement supprimées de nos serveurs.
                  </p>
                </div>
                <p>
                  Nous pouvons également suspendre votre compte en cas de non-paiement (15 jours après
                  mise en demeure) ou d'usage abusif. Mais nous privilégions toujours le dialogue.
                </p>
              </div>
            </section>

            {/* Article 10 - Droit applicable */}
            <section id="droit" className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)] mb-3">
                10. Droit applicable
              </h2>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                **Droit français, tribunaux de Paris. Simple et sans surprise.**
              </p>
              <div className="space-y-4 text-gray-700">
                <p>
                  Ces conditions générales sont régies par le droit français. En cas de litige,
                  nous privilégions la résolution amiable, mais les tribunaux de Paris restent compétents
                  si nécessaire.
                </p>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-gray-800 text-sm">
                    <span className="font-semibold">Modification des CGV :</span> Si nous devons les modifier,
                    nous vous prévenons par email 30 jours avant. Continuer à utiliser le service vaut acceptation.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-accent text-white rounded-lg p-8">
              <h2 className="text-xl font-bold mb-4">Des questions ?</h2>
              <p className="mb-4">
                Notre équipe est là pour vous aider. Contactez-nous pour toute question sur ces conditions
                ou sur l'utilisation de Dermotec CRM.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:support@satorea.fr"
                  className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors text-center"
                >
                  support@satorea.fr
                </a>
                <a
                  href="/contact"
                  className="border border-gray-300 text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-accent transition-colors text-center"
                >
                  Formulaire de contact
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}