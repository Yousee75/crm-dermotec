'use client'

import { useState } from 'react'
import { FileSignature, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface DocuSealButtonProps {
  /** Type de document : convention ou certificat */
  type: 'convention' | 'certificat'
  /** ID du template DocuSeal */
  templateId: number
  /** Données du stagiaire */
  stagiaire: {
    email: string
    nom: string
    prenom: string
  }
  /** Données de la formation */
  formation: {
    nom: string
    dates?: string
    date_fin?: string
    lieu?: string
    prix_ttc?: string
  }
  /** Formatrice (pour certificats) */
  formatrice?: {
    email: string
    nom: string
  }
  /** Variante du bouton */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg'
  /** Classes additionnelles */
  className?: string
  /** Callback après envoi réussi */
  onSuccess?: (submissionId: number) => void
}

export function DocuSealButton({
  type,
  templateId,
  stagiaire,
  formation,
  formatrice,
  variant = 'secondary',
  size = 'sm',
  className,
  onSuccess,
}: DocuSealButtonProps) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/docuseal/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          templateId,
          stagiaire,
          formation,
          formatrice,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(err.error || 'Erreur lors de l\'envoi')
      }

      const data = await res.json()
      setSent(true)
      toast.success(`${type === 'convention' ? 'Convention' : 'Certificat'} envoyé(e) à ${stagiaire.email}`)
      onSuccess?.(data.id)
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'envoi du document')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Button variant="ghost" size={size} className={className} disabled>
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        Envoyé
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSignature className="w-4 h-4" />
      )}
      {type === 'convention' ? 'Envoyer convention' : 'Envoyer certificat'}
    </Button>
  )
}
