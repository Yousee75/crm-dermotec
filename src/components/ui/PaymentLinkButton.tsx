'use client'

import { useState } from 'react'
import { CreditCard, Copy, Check, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './Button'
import type { Lead, Inscription } from '@/types'

interface Props {
  lead: Lead
  inscription: Inscription
}

export function PaymentLinkButton({ lead, inscription }: Props) {
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerateLink = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formationNom: inscription.session?.formation?.nom || 'Formation',
          montant: inscription.reste_a_charge || inscription.montant_total,
          inscriptionId: inscription.id,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur')
      }

      const data = await res.json()
      setLink(data.url)
      toast.success('Lien de paiement généré !')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  if (link) {
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié' : 'Copier lien'}
        </Button>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateLink}
      loading={loading}
      icon={<CreditCard className="w-3.5 h-3.5" />}
    >
      Lien de paiement
    </Button>
  )
}
