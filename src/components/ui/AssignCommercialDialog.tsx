'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUpdateLead } from '@/hooks/use-leads'
import { createClient } from '@/lib/infra/supabase-client'
import type { Equipe, Lead } from '@/types'
import { toast } from 'sonner'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog'
import { Button } from './Button'
import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  lead: Lead
}

export function AssignCommercialDialog({ open, onClose, lead }: Props) {
  const supabase = createClient()
  const updateLead = useUpdateLead()
  const [selectedId, setSelectedId] = useState(lead.commercial_assigne?.id || '')

  const { data: commerciaux } = useQuery({
    queryKey: ['commerciaux'],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipe')
        .select('*')
        .in('role', ['commercial', 'admin', 'manager'])
        .eq('is_active', true)
        .order('prenom')
      return (data || []) as Equipe[]
    },
    enabled: open,
  })

  const handleAssign = async () => {
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        commercial_assigne_id: selectedId || null,
      } as any)
      const selected = commerciaux?.find(c => c.id === selectedId)
      toast.success(selectedId
        ? `Assigné à ${selected?.prenom} ${selected?.nom}`
        : 'Commercial retiré'
      )
      onClose()
    } catch {
      toast.error("Erreur d'assignation")
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Assigner un commercial</DialogTitle>
        <DialogDescription>{lead.prenom} {lead.nom}</DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {/* Option: personne */}
        <button
          type="button"
          onClick={() => setSelectedId('')}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left',
            !selectedId ? 'border-primary bg-primary/5' : 'border-[#F4F0EB] hover:border-[#EEEEEE]'
          )}
        >
          <div className="w-9 h-9 rounded-full bg-[#F4F0EB] flex items-center justify-center text-[#999999] text-xs">—</div>
          <span className="text-sm text-[#777777]">Non assigné</span>
        </button>

        {commerciaux?.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left',
              selectedId === c.id ? 'border-primary bg-primary/5' : 'border-[#F4F0EB] hover:border-[#EEEEEE]'
            )}
          >
            <Avatar name={`${c.prenom} ${c.nom}`} size="sm" color={c.avatar_color} status="online" />
            <div>
              <p className="text-sm font-medium text-accent">{c.prenom} {c.nom}</p>
              <p className="text-xs text-[#999999] capitalize">{c.role}</p>
            </div>
          </button>
        ))}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={handleAssign} loading={updateLead.isPending}>Assigner</Button>
      </DialogFooter>
    </Dialog>
  )
}
