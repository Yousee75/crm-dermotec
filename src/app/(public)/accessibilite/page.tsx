import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Accessibilité & Handicap | Dermotec Advanced',
  description: 'Notre engagement pour l\'accessibilité de nos formations aux personnes en situation de handicap. Référent handicap, aménagements possibles.',
}

export default function AccessibilitePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Hero */}
      <section className="py-16" style={{ backgroundColor: '#111111' }}>
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
            style={{ backgroundColor: 'rgba(255, 92, 0, 0.15)', color: '#FF8C42' }}>
            ♿ Accessibilité
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-heading, "Bricolage Grotesque", serif)' }}>
            Formation accessible à tous
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#999999' }}>
            Dermotec Advanced s'engage à rendre ses formations accessibles aux personnes en situation de handicap,
            conformément au critère 26 du référentiel Qualiopi.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-4xl py-16 space-y-12">
        {/* Référent handicap */}
        <section className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Référent handicap
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm mb-4" style={{ color: '#3A3A3A' }}>
                Notre référent handicap est votre interlocuteur privilégié pour toute question liée à l'accessibilité
                de nos formations. N'hésitez pas à le contacter avant votre inscription.
              </p>
              <div className="space-y-2 text-sm" style={{ color: '#111111' }}>
                <div><strong>Contact :</strong> dermotec.fr@gmail.com</div>
                <div><strong>Téléphone :</strong> 01 88 33 43 43</div>
                <div><strong>Disponibilité :</strong> Lun-Ven, 9h-18h</div>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#FFF0E5', border: '1px solid #FFCAAA' }}>
              <h3 className="font-semibold text-sm mb-2" style={{ color: '#E65200' }}>Quand nous contacter ?</h3>
              <ul className="text-sm space-y-1.5" style={{ color: '#3A3A3A' }}>
                <li>• Avant l'inscription pour évaluer vos besoins</li>
                <li>• Pour connaître les aménagements possibles</li>
                <li>• Pour être orienté(e) vers les partenaires compétents</li>
                <li>• Pour toute difficulté pendant la formation</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Aménagements possibles */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Aménagements possibles
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Accessibilité physique',
                items: ['Locaux accessibles PMR (ascenseur, toilettes adaptées)', 'Places de parking réservées à proximité', 'Accès métro Bastille (lignes 1, 5, 8)'],
              },
              {
                title: 'Aménagements pédagogiques',
                items: ['Supports de cours en format numérique accessible', 'Temps supplémentaire pour les exercices pratiques', 'Adaptation du rythme de formation'],
              },
              {
                title: 'Aménagements organisationnels',
                items: ['Horaires aménagés si nécessaire', 'Pauses supplémentaires', 'Accompagnement individualisé'],
              },
              {
                title: 'Aides techniques',
                items: ['Éclairage adapté pour les postes de travail', 'Position de travail ergonomique', 'Matériel adapté sur demande'],
              },
            ].map((section, i) => (
              <div key={i} className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: '#111111' }}>{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: '#3A3A3A' }}>
                      <span style={{ color: '#10B981' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Partenaires */}
        <section className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Nos partenaires handicap
          </h2>
          <p className="text-sm mb-4" style={{ color: '#3A3A3A' }}>
            Nous travaillons en lien avec les acteurs spécialisés pour vous accompagner au mieux :
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'Agefiph', desc: 'Aide à l\'emploi des personnes handicapées', url: 'https://www.agefiph.fr' },
              { name: 'Cap Emploi', desc: 'Accompagnement vers et dans l\'emploi', url: 'https://www.capemploi.net' },
              { name: 'MDPH', desc: 'Maison départementale des personnes handicapées', url: 'https://mdph.fr' },
            ].map((partner, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: '#FAFAFA' }}>
                <h4 className="font-bold text-sm mb-1" style={{ color: '#111111' }}>{partner.name}</h4>
                <p className="text-xs mb-2" style={{ color: '#777777' }}>{partner.desc}</p>
                <a href={partner.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium hover:underline" style={{ color: '#FF5C00' }}>
                  Visiter →
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Procédure */}
        <section>
          <h2 className="text-xl font-bold mb-6" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Notre procédure d'accueil
          </h2>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Premier contact', desc: 'Échange avec le référent handicap pour identifier vos besoins spécifiques.' },
              { step: 2, title: 'Évaluation', desc: 'Analyse des aménagements nécessaires avec les partenaires spécialisés si besoin.' },
              { step: 3, title: 'Mise en place', desc: 'Adaptation de la formation (rythme, supports, environnement) avant votre arrivée.' },
              { step: 4, title: 'Suivi', desc: 'Point régulier pendant la formation pour ajuster les aménagements si nécessaire.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                  style={{ backgroundColor: '#FF5C00' }}>
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: '#111111' }}>{item.title}</h3>
                  <p className="text-sm mt-0.5" style={{ color: '#3A3A3A' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Contact */}
        <section className="text-center py-8">
          <p className="text-sm mb-4" style={{ color: '#777777' }}>
            Vous avez des questions sur l'accessibilité de nos formations ?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:0188334343"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
              style={{ backgroundColor: '#FF5C00' }}>
              📞 01 88 33 43 43
            </a>
            <a href="mailto:dermotec.fr@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold"
              style={{ border: '2px solid #EEEEEE', color: '#111111' }}>
              ✉️ dermotec.fr@gmail.com
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
