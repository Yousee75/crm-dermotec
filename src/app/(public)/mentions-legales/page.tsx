import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — Dermotec Advanced',
  description: 'Mentions légales du site Dermotec Advanced, centre de formation esthétique à Paris.',
}

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#082545] font-[family-name:var(--font-heading)] mb-8">
        Mentions légales
      </h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        {/* Éditeur */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">1. Éditeur du site</h2>
          <div className="space-y-1">
            <p><strong>Raison sociale :</strong> Dermotec Advanced</p>
            <p><strong>Forme juridique :</strong> [À compléter]</p>
            <p><strong>SIRET :</strong> [À compléter]</p>
            <p><strong>Capital social :</strong> [À compléter]</p>
            <p><strong>RCS :</strong> [À compléter]</p>
            <p><strong>Numéro de déclaration d&apos;activité (formation) :</strong> [À compléter]</p>
            <p><strong>Adresse :</strong> 75 Boulevard Richard Lenoir, 75011 Paris, France</p>
            <p><strong>Téléphone :</strong> 01 88 33 43 43</p>
            <p><strong>Email :</strong> dermotec.fr@gmail.com</p>
          </div>
        </section>

        {/* Directeur de publication */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">2. Directeur de la publication</h2>
          <p>[Nom et prénom du directeur de la publication — à compléter]</p>
        </section>

        {/* Hébergeur */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">3. Hébergeur</h2>
          <div className="space-y-1">
            <p><strong>Raison sociale :</strong> Vercel Inc.</p>
            <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
            <p><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#2EC6F3] hover:underline">https://vercel.com</a></p>
          </div>
        </section>

        {/* Propriété intellectuelle */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">4. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus présents sur ce site (textes, images, logos, graphismes, icônes, logiciels,
            base de données) est protégé par les dispositions du Code de la propriété intellectuelle et appartient
            à Dermotec Advanced ou fait l&apos;objet d&apos;une autorisation d&apos;utilisation.
          </p>
          <p className="mt-2">
            Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des
            éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation
            écrite préalable de Dermotec Advanced.
          </p>
        </section>

        {/* Données personnelles */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">5. Données personnelles</h2>
          <p>
            Les informations relatives à la collecte et au traitement des données personnelles sont détaillées
            dans notre{' '}
            <a href="/politique-confidentialite" className="text-[#2EC6F3] hover:underline">
              Politique de confidentialité
            </a>.
          </p>
        </section>

        {/* Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">6. Cookies</h2>
          <p>
            Ce site utilise des cookies essentiels au fonctionnement du service (authentification, session)
            et des cookies analytiques (Vercel Analytics). Pour en savoir plus, consultez notre{' '}
            <a href="/politique-confidentialite" className="text-[#2EC6F3] hover:underline">
              Politique de confidentialité
            </a>.
          </p>
        </section>

        {/* Limitation de responsabilité */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">7. Limitation de responsabilité</h2>
          <p>
            Dermotec Advanced s&apos;efforce de fournir des informations aussi précises que possible. Toutefois,
            elle ne pourra être tenue responsable des omissions, inexactitudes ou carences dans la mise à jour
            de ces informations, qu&apos;elles soient de son fait ou du fait de tiers partenaires.
          </p>
        </section>

        {/* Droit applicable */}
        <section>
          <h2 className="text-xl font-semibold text-[#082545] mb-3">8. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux
            de Paris seront seuls compétents.
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
