// ============================================================
// CRM DERMOTEC — Source Badge avec icône + couleur
// Affiche la source du lead de façon visuelle et compacte
// ============================================================

import { Phone, Mail, MessageCircle, Globe, Instagram, Share2, Megaphone, UserPlus, Users, Plus, Sparkles } from 'lucide-react'

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  formulaire: { label: 'Formulaire', icon: Globe, color: '#3B82F6' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  telephone: { label: 'Téléphone', icon: Phone, color: '#F59E0B' },
  instagram: { label: 'Instagram', icon: Instagram, color: '#E4405F' },
  facebook: { label: 'Facebook', icon: Share2, color: '#1877F2' },
  google: { label: 'Google', icon: Globe, color: '#4285F4' },
  bouche_a_oreille: { label: 'Bouche-à-oreille', icon: Megaphone, color: '#8B5CF6' },
  partenariat: { label: 'Partenariat', icon: UserPlus, color: '#06B6D4' },
  ancien_stagiaire: { label: 'Ancien stagiaire', icon: UserPlus, color: '#22C55E' },
  site_web: { label: 'Site web', icon: Globe, color: '#2EC6F3' },
  salon: { label: 'Salon', icon: Users, color: '#EC4899' },
  simulateur: { label: 'Simulateur', icon: Sparkles, color: '#2EC6F3' },
  autre: { label: 'Autre', icon: Plus, color: '#9CA3AF' },
}

export { SOURCE_CONFIG }

export function SourceBadge({ source }: { source: string }) {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.autre
  const Icon = config.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap"
      style={{
        color: config.color,
        backgroundColor: `${config.color}10`,
        borderColor: `${config.color}25`,
      }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}
