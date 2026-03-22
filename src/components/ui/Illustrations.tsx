// ============================================================
// CRM DERMOTEC — Illustrations SVG custom
// Couleurs : #2EC6F3 (cyan), #082545 (bleu nuit), accents
// Usage : empty states, onboarding, succès, erreurs
// ============================================================

import { cn } from '@/lib/utils'

interface IllustrationProps {
  className?: string
  size?: number
}

// --- Empty Leads : personnage avec loupe et pipeline vide ---
export function IllustrationEmptyLeads({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Fond cercle doux */}
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />
      <circle cx="100" cy="100" r="65" fill="#2EC6F3" opacity="0.04" />

      {/* Document/fiche */}
      <rect x="55" y="50" width="60" height="80" rx="8" fill="white" stroke="#2EC6F3" strokeWidth="2" />
      <rect x="65" y="62" width="30" height="3" rx="1.5" fill="#2EC6F3" opacity="0.4" />
      <rect x="65" y="70" width="40" height="3" rx="1.5" fill="#082545" opacity="0.15" />
      <rect x="65" y="78" width="35" height="3" rx="1.5" fill="#082545" opacity="0.15" />
      <rect x="65" y="86" width="25" height="3" rx="1.5" fill="#082545" opacity="0.15" />
      <circle cx="75" cy="104" r="8" fill="#2EC6F3" opacity="0.15" />
      <rect x="88" y="100" width="18" height="3" rx="1.5" fill="#082545" opacity="0.15" />
      <rect x="88" y="107" width="14" height="3" rx="1.5" fill="#082545" opacity="0.1" />

      {/* Loupe */}
      <circle cx="138" cy="75" r="22" fill="white" stroke="#2EC6F3" strokeWidth="2.5" />
      <circle cx="138" cy="75" r="15" fill="#2EC6F3" opacity="0.08" />
      <line x1="153" y1="91" x2="165" y2="103" stroke="#2EC6F3" strokeWidth="3" strokeLinecap="round" />

      {/* Petit personnage silhouette */}
      <circle cx="138" cy="71" r="5" fill="#082545" opacity="0.5" />
      <path d="M131 83 Q138 78 145 83" stroke="#082545" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />

      {/* Petites étoiles décoratives */}
      <circle cx="42" cy="70" r="2" fill="#2EC6F3" opacity="0.3" />
      <circle cx="165" cy="55" r="1.5" fill="#F59E0B" opacity="0.4" />
      <circle cx="50" cy="140" r="2.5" fill="#2EC6F3" opacity="0.2" />
      <path d="M155 130 L157 125 L159 130 L155 130Z" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}

// --- Empty Messages : bulles de conversation vides ---
export function IllustrationEmptyMessages({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />

      {/* Bulle gauche (reçue) */}
      <rect x="35" y="55" width="70" height="35" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="47" y="66" width="45" height="3" rx="1.5" fill="#082545" opacity="0.15" />
      <rect x="47" y="73" width="30" height="3" rx="1.5" fill="#082545" opacity="0.1" />
      <path d="M45 90 L40 100 L55 90" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* Bulle droite (envoyée) */}
      <rect x="95" y="95" width="70" height="35" rx="12" fill="#2EC6F3" />
      <rect x="107" y="106" width="45" height="3" rx="1.5" fill="white" opacity="0.5" />
      <rect x="107" y="113" width="30" height="3" rx="1.5" fill="white" opacity="0.3" />
      <path d="M155 130 L163 138 L148 130" fill="#2EC6F3" />

      {/* Points de suspension (en train d'écrire) */}
      <rect x="50" y="115" width="45" height="25" rx="10" fill="white" stroke="#E5E7EB" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="62" cy="127" r="2.5" fill="#2EC6F3" opacity="0.3" />
      <circle cx="72" cy="127" r="2.5" fill="#2EC6F3" opacity="0.5" />
      <circle cx="82" cy="127" r="2.5" fill="#2EC6F3" opacity="0.7" />

      {/* Décor */}
      <circle cx="170" cy="60" r="2" fill="#2EC6F3" opacity="0.2" />
      <circle cx="30" cy="140" r="3" fill="#F59E0B" opacity="0.2" />
    </svg>
  )
}

// --- Empty Dossier : dossier ouvert avec documents ---
export function IllustrationEmptyDossier({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />

      {/* Dossier fond */}
      <path d="M45 75 L45 145 Q45 150 50 150 L150 150 Q155 150 155 145 L155 75 Z" fill="white" stroke="#2EC6F3" strokeWidth="1.5" />
      {/* Languette dossier */}
      <path d="M45 75 L45 65 Q45 60 50 60 L85 60 Q90 60 92 65 L98 75 Z" fill="#2EC6F3" opacity="0.15" stroke="#2EC6F3" strokeWidth="1.5" />

      {/* Document 1 — qui dépasse */}
      <rect x="60" y="50" width="45" height="55" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1" transform="rotate(-5 82 77)" />
      <rect x="68" y="60" width="25" height="2" rx="1" fill="#082545" opacity="0.15" transform="rotate(-5 80 61)" />
      <rect x="68" y="66" width="30" height="2" rx="1" fill="#082545" opacity="0.1" transform="rotate(-5 83 67)" />

      {/* Document 2 */}
      <rect x="95" y="55" width="45" height="55" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1" transform="rotate(3 117 82)" />
      <rect x="103" y="65" width="25" height="2" rx="1" fill="#2EC6F3" opacity="0.3" transform="rotate(3 115 66)" />
      <rect x="103" y="71" width="30" height="2" rx="1" fill="#082545" opacity="0.1" transform="rotate(3 118 72)" />

      {/* Check vert */}
      <circle cx="150" cy="58" r="12" fill="#22C55E" opacity="0.15" />
      <path d="M144 58 L148 62 L156 54" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Ligne de progression */}
      <rect x="60" y="130" width="80" height="4" rx="2" fill="#E5E7EB" />
      <rect x="60" y="130" width="30" height="4" rx="2" fill="#2EC6F3" />

      {/* Décor */}
      <circle cx="40" cy="50" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="165" cy="140" r="2" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}

// --- Empty Pipeline : colonnes Kanban vides ---
export function IllustrationEmptyPipeline({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />

      {/* Colonne 1 */}
      <rect x="25" y="50" width="45" height="100" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="30" y="55" width="35" height="4" rx="2" fill="#94A3B8" opacity="0.3" />
      <rect x="30" y="65" width="35" height="25" rx="4" fill="#2EC6F3" opacity="0.08" stroke="#2EC6F3" strokeWidth="1" strokeDasharray="3 3" />

      {/* Colonne 2 — avec une card */}
      <rect x="78" y="50" width="45" height="100" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="83" y="55" width="35" height="4" rx="2" fill="#2EC6F3" opacity="0.4" />
      <rect x="83" y="65" width="35" height="28" rx="4" fill="white" stroke="#2EC6F3" strokeWidth="1.5" />
      <circle cx="92" cy="73" r="4" fill="#2EC6F3" opacity="0.2" />
      <rect x="99" y="71" width="15" height="2" rx="1" fill="#082545" opacity="0.2" />
      <rect x="99" y="76" width="12" height="2" rx="1" fill="#082545" opacity="0.1" />

      {/* Colonne 3 */}
      <rect x="131" y="50" width="45" height="100" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="136" y="55" width="35" height="4" rx="2" fill="#22C55E" opacity="0.3" />
      <rect x="136" y="65" width="35" height="25" rx="4" fill="#22C55E" opacity="0.06" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 3" />

      {/* Flèche de progression */}
      <path d="M72 100 L76 96 L76 104 Z" fill="#2EC6F3" opacity="0.4" />
      <path d="M125 100 L129 96 L129 104 Z" fill="#2EC6F3" opacity="0.4" />

      {/* Décor */}
      <circle cx="165" cy="45" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="35" cy="160" r="2.5" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}

// --- Succès / Célébration ---
export function IllustrationSuccess({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#22C55E" opacity="0.06" />

      {/* Grand cercle check */}
      <circle cx="100" cy="90" r="35" fill="white" stroke="#22C55E" strokeWidth="3" />
      <circle cx="100" cy="90" r="28" fill="#22C55E" opacity="0.1" />
      <path d="M85 90 L95 100 L115 80" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Confetti */}
      <rect x="50" y="45" width="6" height="3" rx="1.5" fill="#2EC6F3" opacity="0.6" transform="rotate(-20 53 46)" />
      <rect x="145" y="50" width="6" height="3" rx="1.5" fill="#F59E0B" opacity="0.6" transform="rotate(15 148 51)" />
      <rect x="60" y="130" width="5" height="3" rx="1.5" fill="#EC4899" opacity="0.5" transform="rotate(-10 62 131)" />
      <rect x="140" y="125" width="5" height="3" rx="1.5" fill="#8B5CF6" opacity="0.5" transform="rotate(25 142 126)" />
      <circle cx="45" cy="80" r="3" fill="#F59E0B" opacity="0.4" />
      <circle cx="155" cy="85" r="2.5" fill="#2EC6F3" opacity="0.4" />
      <circle cx="80" cy="40" r="2" fill="#EC4899" opacity="0.4" />
      <circle cx="125" cy="140" r="2" fill="#22C55E" opacity="0.3" />

      {/* Étoiles */}
      <path d="M40 110 L42 105 L44 110 L39 107 L45 107 Z" fill="#F59E0B" opacity="0.4" />
      <path d="M158 70 L160 66 L162 70 L157 68 L163 68 Z" fill="#2EC6F3" opacity="0.3" />

      {/* Texte "Bravo" suggestion */}
      <rect x="70" y="138" width="60" height="20" rx="10" fill="#22C55E" opacity="0.1" />
      <rect x="83" y="146" width="34" height="4" rx="2" fill="#22C55E" opacity="0.3" />
    </svg>
  )
}

// --- Onboarding / Bienvenue ---
export function IllustrationWelcome({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />

      {/* Écran/dashboard stylisé */}
      <rect x="45" y="45" width="110" height="75" rx="8" fill="white" stroke="#082545" strokeWidth="2" />
      <rect x="45" y="45" width="110" height="15" rx="8" fill="#082545" />
      <circle cx="55" cy="52.5" r="2" fill="#EF4444" opacity="0.8" />
      <circle cx="62" cy="52.5" r="2" fill="#F59E0B" opacity="0.8" />
      <circle cx="69" cy="52.5" r="2" fill="#22C55E" opacity="0.8" />

      {/* Contenu dashboard */}
      <rect x="52" y="67" width="25" height="15" rx="3" fill="#2EC6F3" opacity="0.15" />
      <rect x="82" y="67" width="25" height="15" rx="3" fill="#22C55E" opacity="0.15" />
      <rect x="112" y="67" width="25" height="15" rx="3" fill="#F59E0B" opacity="0.15" />
      <rect x="52" y="88" width="85" height="4" rx="2" fill="#E5E7EB" />
      <rect x="52" y="88" width="50" height="4" rx="2" fill="#2EC6F3" opacity="0.4" />
      <rect x="52" y="97" width="85" height="15" rx="3" fill="#082545" opacity="0.04" />

      {/* Curseur */}
      <path d="M130 100 L130 112 L135 108 L140 115" stroke="#2EC6F3" strokeWidth="2" strokeLinecap="round" />

      {/* Main qui salue */}
      <path d="M95 135 Q100 128 105 135" stroke="#082545" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
      <circle cx="100" cy="145" r="3" fill="#082545" opacity="0.15" />

      {/* Étoiles accueil */}
      <circle cx="35" cy="60" r="2" fill="#F59E0B" opacity="0.4" />
      <circle cx="170" cy="55" r="2.5" fill="#2EC6F3" opacity="0.3" />
      <circle cx="40" cy="130" r="2" fill="#2EC6F3" opacity="0.2" />
      <path d="M165 110 L167 106 L169 110 L164 108 L170 108 Z" fill="#F59E0B" opacity="0.3" />
    </svg>
  )
}

// --- Empty Documents ---
export function IllustrationEmptyDocuments({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />

      {/* Stack de documents */}
      <rect x="60" y="65" width="55" height="70" rx="5" fill="#E5E7EB" opacity="0.3" transform="rotate(-3 87 100)" />
      <rect x="65" y="60" width="55" height="70" rx="5" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1" transform="rotate(2 92 95)" />
      <rect x="70" y="55" width="55" height="70" rx="5" fill="white" stroke="#2EC6F3" strokeWidth="1.5" />

      {/* Contenu doc */}
      <rect x="80" y="67" width="30" height="3" rx="1.5" fill="#2EC6F3" opacity="0.3" />
      <rect x="80" y="75" width="35" height="2" rx="1" fill="#082545" opacity="0.12" />
      <rect x="80" y="81" width="28" height="2" rx="1" fill="#082545" opacity="0.12" />
      <rect x="80" y="87" width="32" height="2" rx="1" fill="#082545" opacity="0.08" />

      {/* Zone signature en bas */}
      <rect x="80" y="100" width="35" height="12" rx="3" fill="#2EC6F3" opacity="0.06" stroke="#2EC6F3" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M85 108 Q90 103 95 107 Q100 111 105 106" stroke="#2EC6F3" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />

      {/* Plus upload */}
      <circle cx="145" cy="105" r="16" fill="white" stroke="#2EC6F3" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M145 98 L145 112 M138 105 L152 105" stroke="#2EC6F3" strokeWidth="2" strokeLinecap="round" />

      {/* Décor */}
      <circle cx="45" cy="75" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="160" cy="65" r="2" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}

// --- Erreur / Not Found ---
export function IllustrationError({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#EF4444" opacity="0.04" />

      {/* Cercle attention */}
      <circle cx="100" cy="85" r="35" fill="white" stroke="#EF4444" strokeWidth="2" opacity="0.8" />
      <circle cx="100" cy="85" r="28" fill="#EF4444" opacity="0.06" />
      <rect x="97" y="68" width="6" height="22" rx="3" fill="#EF4444" opacity="0.6" />
      <circle cx="100" cy="97" r="3.5" fill="#EF4444" opacity="0.6" />

      {/* Petits éclats */}
      <circle cx="55" cy="65" r="2" fill="#EF4444" opacity="0.2" />
      <circle cx="145" cy="70" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="65" cy="130" r="2.5" fill="#EF4444" opacity="0.15" />
      <path d="M140 120 L145 115 M140 115 L145 120" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />

      {/* Zone texte */}
      <rect x="65" y="135" width="70" height="5" rx="2.5" fill="#082545" opacity="0.08" />
      <rect x="75" y="145" width="50" height="4" rx="2" fill="#082545" opacity="0.05" />
    </svg>
  )
}

// --- Empty Sessions : calendrier avec créneaux vides ---
export function IllustrationEmptySessions({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />
      {/* Calendrier */}
      <rect x="40" y="50" width="120" height="100" rx="8" fill="white" stroke="#2EC6F3" strokeWidth="1.5" />
      <rect x="40" y="50" width="120" height="22" rx="8" fill="#2EC6F3" opacity="0.1" />
      <rect x="40" y="64" width="120" height="8" fill="#2EC6F3" opacity="0.1" />
      {/* Accroche calendrier */}
      <rect x="65" y="44" width="4" height="14" rx="2" fill="#2EC6F3" opacity="0.4" />
      <rect x="131" y="44" width="4" height="14" rx="2" fill="#2EC6F3" opacity="0.4" />
      {/* Jours header */}
      {['L','M','M','J','V'].map((d, i) => (
        <text key={i} x={58 + i * 22} y="62" fontSize="8" fill="#082545" opacity="0.3" textAnchor="middle" fontFamily="sans-serif">{d}</text>
      ))}
      {/* Grille jours */}
      {[0,1,2,3].map(row => [0,1,2,3,4].map(col => (
        <rect key={`${row}-${col}`} x={48 + col * 22} y={78 + row * 17} width="18" height="13" rx="3"
          fill={row === 1 && col === 2 ? '#2EC6F3' : 'white'}
          opacity={row === 1 && col === 2 ? 0.15 : 1}
          stroke={row === 1 && col === 2 ? '#2EC6F3' : '#E5E7EB'}
          strokeWidth="1"
          strokeDasharray={row > 2 ? '2 2' : 'none'}
        />
      )))}
      {/* Point jour sélectionné */}
      <circle cx="95" cy="101" r="2.5" fill="#2EC6F3" />
      {/* Décor */}
      <circle cx="170" cy="48" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="30" cy="130" r="2.5" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}

// --- Empty Équipe : silhouettes de personnes ---
export function IllustrationEmptyEquipe({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />
      {/* Personne centrale */}
      <circle cx="100" cy="72" r="16" fill="white" stroke="#2EC6F3" strokeWidth="2" />
      <circle cx="100" cy="68" r="7" fill="#2EC6F3" opacity="0.2" />
      <path d="M86 82 Q100 76 114 82" stroke="#2EC6F3" strokeWidth="1.5" fill="none" opacity="0.3" />
      <path d="M75 110 Q100 95 125 110 L125 125 Q125 130 120 130 L80 130 Q75 130 75 125 Z" fill="#2EC6F3" opacity="0.1" stroke="#2EC6F3" strokeWidth="1.5" />
      {/* Personne gauche */}
      <circle cx="55" cy="85" r="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx="55" cy="82" r="5" fill="#082545" opacity="0.1" />
      <path d="M43 100 Q55 92 67 100 L67 112 Q67 115 64 115 L46 115 Q43 115 43 112 Z" fill="#082545" opacity="0.06" stroke="#E5E7EB" strokeWidth="1" />
      {/* Personne droite */}
      <circle cx="145" cy="85" r="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx="145" cy="82" r="5" fill="#082545" opacity="0.1" />
      <path d="M133 100 Q145 92 157 100 L157 112 Q157 115 154 115 L136 115 Q133 115 133 112 Z" fill="#082545" opacity="0.06" stroke="#E5E7EB" strokeWidth="1" />
      {/* Plus (ajouter) */}
      <circle cx="100" cy="148" r="12" fill="white" stroke="#2EC6F3" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M100 142 L100 154 M94 148 L106 148" stroke="#2EC6F3" strokeWidth="2" strokeLinecap="round" />
      {/* Décor */}
      <circle cx="35" cy="65" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="168" cy="60" r="2" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}

// --- Empty Commandes : panier / colis ---
export function IllustrationEmptyCommandes({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />
      {/* Colis principal */}
      <rect x="55" y="60" width="70" height="60" rx="6" fill="white" stroke="#2EC6F3" strokeWidth="2" />
      {/* Rabat colis */}
      <path d="M55 60 L90 45 L125 60" fill="white" stroke="#2EC6F3" strokeWidth="2" strokeLinejoin="round" />
      <path d="M90 45 L90 80" stroke="#2EC6F3" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Croix bande colis */}
      <line x1="55" y1="90" x2="125" y2="90" stroke="#2EC6F3" strokeWidth="1" opacity="0.2" />
      <line x1="90" y1="60" x2="90" y2="120" stroke="#2EC6F3" strokeWidth="1" opacity="0.2" />
      {/* Petit colis derrière */}
      <rect x="120" y="80" width="40" height="35" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <path d="M120 80 L140 72 L160 80" fill="none" stroke="#E5E7EB" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Étoile gratuite */}
      <circle cx="148" cy="70" r="8" fill="#F59E0B" opacity="0.15" />
      <text x="148" y="73" fontSize="8" fill="#F59E0B" textAnchor="middle" fontFamily="sans-serif" opacity="0.6">€</text>
      {/* Ligne de progression livraison */}
      <rect x="50" y="135" width="100" height="4" rx="2" fill="#E5E7EB" />
      <rect x="50" y="135" width="0" height="4" rx="2" fill="#2EC6F3" opacity="0.5" />
      <circle cx="50" cy="137" r="4" fill="#2EC6F3" opacity="0.3" />
      {/* Décor */}
      <circle cx="40" cy="55" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="165" cy="50" r="2.5" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}

// --- Empty Formations / Catalogue ---
export function IllustrationEmptyFormations({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />
      {/* Livre/programme ouvert */}
      <path d="M100 55 L100 140" stroke="#082545" strokeWidth="1.5" opacity="0.15" />
      <path d="M100 55 Q70 50 40 60 L40 135 Q70 125 100 140" fill="white" stroke="#2EC6F3" strokeWidth="1.5" />
      <path d="M100 55 Q130 50 160 60 L160 135 Q130 125 100 140" fill="white" stroke="#2EC6F3" strokeWidth="1.5" />
      {/* Lignes page gauche */}
      <rect x="52" y="72" width="35" height="2" rx="1" fill="#082545" opacity="0.1" />
      <rect x="52" y="80" width="30" height="2" rx="1" fill="#082545" opacity="0.08" />
      <rect x="52" y="88" width="33" height="2" rx="1" fill="#082545" opacity="0.08" />
      <rect x="52" y="96" width="25" height="2" rx="1" fill="#082545" opacity="0.06" />
      {/* Image page droite */}
      <rect x="112" y="70" width="35" height="22" rx="3" fill="#2EC6F3" opacity="0.08" stroke="#2EC6F3" strokeWidth="1" />
      <circle cx="122" cy="78" r="4" fill="#2EC6F3" opacity="0.15" />
      <path d="M112 87 L125 80 L135 85 L147 78 L147 92 L112 92 Z" fill="#2EC6F3" opacity="0.1" />
      <rect x="112" y="98" width="35" height="2" rx="1" fill="#082545" opacity="0.1" />
      <rect x="112" y="105" width="28" height="2" rx="1" fill="#082545" opacity="0.08" />
      {/* Chapeau diplomé */}
      <path d="M88 40 L100 34 L112 40 L100 46 Z" fill="#2EC6F3" opacity="0.3" />
      <line x1="100" y1="46" x2="100" y2="55" stroke="#2EC6F3" strokeWidth="1.5" opacity="0.3" />
      {/* Décor */}
      <circle cx="30" cy="75" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="172" cy="65" r="2" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}

// --- Empty Stagiaires ---
export function IllustrationEmptyStagiaires({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />
      {/* Bureau / table */}
      <rect x="35" y="115" width="130" height="5" rx="2.5" fill="#082545" opacity="0.1" />
      {/* Écran */}
      <rect x="65" y="60" width="70" height="50" rx="5" fill="white" stroke="#082545" strokeWidth="1.5" opacity="0.8" />
      <rect x="65" y="60" width="70" height="10" rx="5" fill="#082545" opacity="0.06" />
      {/* Contenu écran */}
      <rect x="72" y="76" width="20" height="12" rx="2" fill="#2EC6F3" opacity="0.1" />
      <rect x="96" y="76" width="20" height="12" rx="2" fill="#22C55E" opacity="0.1" />
      <rect x="120" y="76" width="8" height="12" rx="2" fill="#F59E0B" opacity="0.1" />
      <rect x="72" y="92" width="56" height="3" rx="1.5" fill="#082545" opacity="0.06" />
      <rect x="72" y="98" width="40" height="3" rx="1.5" fill="#082545" opacity="0.04" />
      {/* Pied écran */}
      <rect x="95" y="110" width="10" height="5" rx="1" fill="#082545" opacity="0.1" />
      {/* Chapeau diplômé à gauche */}
      <path d="M42 90 L55 84 L68 90 L55 96 Z" fill="#2EC6F3" opacity="0.2" />
      <line x1="55" y1="96" x2="55" y2="108" stroke="#2EC6F3" strokeWidth="1" opacity="0.2" />
      <path d="M50 108 Q55 112 60 108" stroke="#2EC6F3" strokeWidth="1" fill="none" opacity="0.2" />
      {/* Certificat à droite */}
      <rect x="140" y="78" width="28" height="35" rx="3" fill="white" stroke="#F59E0B" strokeWidth="1" opacity="0.6" />
      <rect x="146" y="84" width="16" height="2" rx="1" fill="#F59E0B" opacity="0.2" />
      <rect x="146" y="90" width="12" height="2" rx="1" fill="#082545" opacity="0.08" />
      <circle cx="154" cy="102" r="4" fill="#F59E0B" opacity="0.15" />
      {/* Décor */}
      <circle cx="35" cy="65" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="172" cy="55" r="2" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}

// --- Empty Financement : dossier avec pièces financières ---
export function IllustrationEmptyFinancement({ className, size = 160 }: IllustrationProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="#2EC6F3" opacity="0.06" />
      {/* Calculatrice */}
      <rect x="45" y="55" width="50" height="70" rx="6" fill="white" stroke="#082545" strokeWidth="1.5" opacity="0.8" />
      <rect x="51" y="61" width="38" height="16" rx="3" fill="#082545" opacity="0.06" />
      <text x="82" y="74" fontSize="11" fill="#082545" opacity="0.3" textAnchor="end" fontFamily="monospace">1 400€</text>
      {/* Boutons calculatrice */}
      {[0,1,2].map(row => [0,1,2].map(col => (
        <rect key={`c${row}-${col}`} x={53 + col * 13} y={82 + row * 13} width="10" height="10" rx="2"
          fill={col === 2 && row === 2 ? '#2EC6F3' : '#082545'}
          opacity={col === 2 && row === 2 ? 0.2 : 0.06}
        />
      )))}
      {/* Document CPF / OPCO */}
      <rect x="110" y="50" width="50" height="65" rx="5" fill="white" stroke="#2EC6F3" strokeWidth="1.5" />
      <rect x="117" y="58" width="30" height="3" rx="1.5" fill="#2EC6F3" opacity="0.3" />
      <rect x="117" y="66" width="36" height="2" rx="1" fill="#082545" opacity="0.1" />
      <rect x="117" y="72" width="30" height="2" rx="1" fill="#082545" opacity="0.1" />
      <rect x="117" y="78" width="33" height="2" rx="1" fill="#082545" opacity="0.08" />
      {/* Check validé */}
      <circle cx="135" cy="96" r="8" fill="#22C55E" opacity="0.12" />
      <path d="M130 96 L133.5 99.5 L140 93" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Pièces euro en bas */}
      <circle cx="75" cy="145" r="10" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" opacity="0.2" />
      <text x="75" y="149" fontSize="10" fill="#F59E0B" textAnchor="middle" fontFamily="sans-serif" opacity="0.4">€</text>
      <circle cx="95" cy="148" r="8" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" opacity="0.15" />
      <circle cx="112" cy="146" r="7" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" opacity="0.1" />
      {/* Décor */}
      <circle cx="40" cy="40" r="2" fill="#F59E0B" opacity="0.3" />
      <circle cx="168" cy="45" r="2" fill="#2EC6F3" opacity="0.2" />
    </svg>
  )
}
