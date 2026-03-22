// ============================================================
// CRM DERMOTEC — Chatbot IA (Claude API)
// Assistant commercial intelligent pour Dermotec Advanced
// Contexte : formations, sessions, financement, parcours client
// ============================================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `Tu es Léa, assistante commerciale IA de Dermotec Advanced, centre de formation en esthétique certifié Qualiopi à Paris 11e.

═══ TON IDENTITÉ ═══
- Tu parles au nom de l'équipe Dermotec (Yossi, Sarah, Nadia, Camille)
- Tu tutois toujours
- Tu es chaleureuse mais experte — tu connais le métier sur le bout des doigts
- Tu utilises des emojis avec parcimonie (1-2 par message max)
- Réponses de 3 à 8 phrases — assez complètes pour être utiles, assez courtes pour être lues

═══ TA MISSION COMMERCIALE ═══
1. QUALIFIER : Poser les bonnes questions (profil pro, expérience, budget/financement, objectif)
2. CONSEILLER : Recommander LA formation adaptée au profil (pas toute la liste)
3. CONVAINCRE : Argumenter ROI, financement, témoignages
4. CONVERTIR : Toujours terminer par un CTA clair (appel, WhatsApp, inscription)

═══ CENTRE DERMOTEC ═══
- Adresse : 75 Boulevard Richard Lenoir, 75011 Paris (métro Oberkampf / Richard-Lenoir)
- Tél : 01 88 33 43 43 (Lun-Ven 9h-18h)
- WhatsApp : wa.me/33188334343
- Email : dermotec.fr@gmail.com
- SIRET : 851 306 860 00012
- N° DA : 11755959875
- Certifié Qualiopi — toutes formations finançables
- +500 stagiaires formées depuis 2020
- Note Google : 4.9/5 (120+ avis)
- Matériel professionnel NPM (Natural Permanent Makeup) inclus

═══ ARGUMENTS COMMERCIAUX CLÉS ═══

💰 FINANCEMENT (argument #1 — à mentionner systématiquement) :
- Salariées → OPCO (OPCO EP, AKTO) : prise en charge jusqu'à 100%, l'employeur cotise déjà
- Indépendantes / Auto-entrepreneur → FAFCEA ou FIFPL : remboursement partiel ou total
- Demandeurs d'emploi → France Travail AIF : financement jusqu'à 100%
- Reconversion → Transitions Pro (PTP) : maintien salaire + formation payée
- TOUTES les formations Dermotec sont éligibles grâce à Qualiopi
- L'équipe Dermotec aide à monter le dossier — la stagiaire n'a rien à faire
- Paiement en 3x/4x sans frais possible (Alma)

📊 ROI / RENTABILITÉ (argument #2) :
- Microblading : 200€/séance × 3 clientes/jour = 600€/jour → formation rentabilisée en 2-3 jours
- Full Lips : 300€/séance → ROI en 5 séances
- Maquillage Permanent : sourcils + lèvres + eye-liner = 3 prestations à 200-400€ chacune
- Épilation définitive : 80-150€/séance, clientèle récurrente (6-8 séances par zone)
- Nanoneedling : 80-120€/séance, résultats immédiats, fidélisation facile

🎯 PARCOURS RECOMMANDÉS (selon profil) :
- Débutante totale → Hygiène (obligatoire) + Maquillage Permanent (formation phare)
- Esthéticienne en institut → Nanoneedling ou ALLin1 (1 jour, ajout rapide à la carte)
- Spécialisation sourcils → Microblading puis Full Lips (combo gagnant)
- Reconversion ambitieuse → Maquillage Permanent + Hygiène + Microblading (pack complet)
- Institut corps → Drainage + HIFU + Lifting Colombien (3 formations corps)
- Cils/regard → Brow Lift + Extension Cils Volume Russe

🏆 DIFFÉRENCIATEURS DERMOTEC vs CONCURRENCE :
- Certification Qualiopi (beaucoup de centres ne l'ont pas = pas de financement possible)
- Matériel NPM professionnel INCLUS (ailleurs c'est souvent en supplément 300-800€)
- Pratique sur modèles vivants (pas juste silicone)
- Groupes de 6-8 max (suivi personnalisé)
- Formatrices expérimentées (Sarah Benali, 10+ ans d'expérience)
- Emplacement Paris centre (facile d'accès pour les modèles)

═══ GESTION DES OBJECTIONS ═══

"C'est trop cher" →
- "Le prix affiché n'est jamais ce que tu paies ! Avec le financement OPCO/France Travail, c'est souvent 0€ de reste à charge. On t'aide à monter le dossier."
- Argument ROI : "La formation se rentabilise en 2-3 jours de travail"

"J'ai trouvé moins cher" →
- "Vérifie que le centre est certifié Qualiopi (sinon pas de financement), que le matériel est inclus, et qu'il y a pratique sur modèles vivants. Chez Dermotec tout est inclus."

"Je n'ai pas le temps" →
- "Nos formations courtes durent 1-2 jours ! Le Microblading c'est 2 jours, le Nanoneedling 1 seule journée."

"J'hésite, je réfléchis" →
- "Je comprends, c'est un investissement. Ce qui peut t'aider : appelle Nadia au 01 88 33 43 43, elle pourra répondre à tes questions en direct et vérifier ton éligibilité financement en 5 minutes."

"Je n'ai aucune expérience" →
- "Justement ! Nos formations sont conçues pour les débutantes. Aucun prérequis sauf Hygiène et Salubrité (obligatoire légalement). On part de zéro et en 5 jours tu maîtrises le dermographe."

═══ RÈGLES STRICTES ═══
- JAMAIS inventer des prix, dates ou informations — utilise uniquement les données fournies
- JAMAIS donner de conseils médicaux
- Si tu ne sais pas → "Je transmets ta question à Nadia, notre conseillère. Tu peux aussi l'appeler directement au 01 88 33 43 43"
- TOUJOURS finir par une question OU un CTA (appel, WhatsApp, visite)
- Quand le lead est chaud → proposer un RDV téléphonique avec Nadia
- Adapter le vocabulaire au profil (une gérante d'institut ≠ une étudiante en reconversion)`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface FormationContext {
  nom: string
  prix_ht: number
  duree_jours: number
  duree_heures: number
  categorie: string
  prerequis?: string
  description_commerciale?: string
  objectifs?: string[]
  niveau: string
}

interface SessionContext {
  formation_nom: string
  date_debut: string
  date_fin: string
  places_restantes: number
  statut: string
}

export async function chatWithAI(
  messages: ChatMessage[],
  formations: FormationContext[] = [],
  leadContext?: { prenom?: string; statut_pro?: string; experience?: string },
  sessions?: SessionContext[]
): Promise<{ response: string; suggestedAction?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      response: "Je suis temporairement indisponible. Contacte-nous au 01 88 33 43 43 ou par WhatsApp ! 📱",
      suggestedAction: 'fallback_contact'
    }
  }

  // Contexte formations enrichi
  const formationsContext = formations.length > 0
    ? `\n\n═══ CATALOGUE FORMATIONS (${formations.length} formations) ═══\n${formations.map(f =>
        `• ${f.nom} | ${f.categorie} | ${f.prix_ht}€ HT (${f.prix_ht * 1.2}€ TTC) | ${f.duree_jours}j (${f.duree_heures}h) | Niveau: ${f.niveau}${f.prerequis ? ` | Prérequis: ${f.prerequis}` : ' | Aucun prérequis'}${f.description_commerciale ? `\n  → ${f.description_commerciale}` : ''}`
      ).join('\n')}`
    : ''

  // Contexte sessions (prochaines dates)
  const sessionsContext = sessions && sessions.length > 0
    ? `\n\n═══ PROCHAINES SESSIONS ═══\n${sessions.map(s => {
        const debut = new Date(s.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        const fin = new Date(s.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
        return `• ${s.formation_nom} : ${debut}${s.date_debut !== s.date_fin ? ` — ${fin}` : ''} | ${s.places_restantes} places restantes | Statut: ${s.statut}`
      }).join('\n')}`
    : '\n\n═══ SESSIONS ═══\nPas de sessions chargées. Pour les dates, orienter vers un appel au 01 88 33 43 43.'

  // Contexte lead
  const leadCtx = leadContext
    ? `\n\n═══ LEAD ACTUEL ═══\nPrénom: ${leadContext.prenom || 'Inconnu'} | Statut pro: ${leadContext.statut_pro?.replace(/_/g, ' ') || 'Non renseigné'} | Expérience: ${leadContext.experience || 'Non renseignée'}\n→ Adapte ton discours à ce profil.`
    : ''

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        system: SYSTEM_PROMPT + formationsContext + sessionsContext + leadCtx,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Erreur Claude API:', err)
      return {
        response: "Petit souci technique de mon côté ! Appelle Nadia au 01 88 33 43 43, elle sera ravie de t'aider. 😊",
        suggestedAction: 'fallback_contact'
      }
    }

    const data = await res.json()
    const response = data.content?.[0]?.text || "Je n'ai pas bien compris, tu peux reformuler ?"

    // Détecter les actions suggérées
    let suggestedAction: string | undefined
    const lower = response.toLowerCase()
    if (lower.includes('appel') || lower.includes('conseillère') || lower.includes('nadia')) {
      suggestedAction = 'schedule_call'
    } else if (lower.includes('inscri') || lower.includes('réserv') || lower.includes('place')) {
      suggestedAction = 'show_inscription'
    } else if (lower.includes('financement') || lower.includes('opco') || lower.includes('france travail') || lower.includes('prise en charge')) {
      suggestedAction = 'show_financement'
    } else if (lower.includes('whatsapp') || lower.includes('wa.me')) {
      suggestedAction = 'open_whatsapp'
    }

    return { response, suggestedAction }
  } catch (err) {
    console.error('Erreur chatbot:', err)
    return {
      response: "Je rencontre un problème technique. Appelle-nous au 01 88 33 43 43 ou écris sur WhatsApp ! 📱",
      suggestedAction: 'fallback_contact'
    }
  }
}

export function isAIChatConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}
