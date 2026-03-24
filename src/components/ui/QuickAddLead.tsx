'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, User, Phone, BookOpen, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase-client'
import { toast } from 'sonner'

const FORMATIONS = [
  'Maquillage Permanent',
  'Microblading',
  'Full Lips',
  'Tricopigmentation',
  'Aréole Mammaire',
  'Nanoneedling',
  'Soin ALLin1',
  'Peeling / Dermaplaning',
  'Détatouage',
  'Épilation Définitive',
  'Hygiène & Salubrité',
]

export function QuickAddLead() {
  const [open, setOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [formation, setFormation] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const nomRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => nomRef.current?.focus(), 200)
    }
  }, [open])

  // Écouter l'événement personnalisé depuis SmartActionBar
  useEffect(() => {
    const handleOpenQuickAdd = () => {
      setOpen(true)
    }

    window.addEventListener('open-quick-add-lead', handleOpenQuickAdd)
    return () => window.removeEventListener('open-quick-add-lead', handleOpenQuickAdd)
  }, [])

  const reset = () => {
    setNom('')
    setTelephone('')
    setFormation('')
    setSuccess(false)
  }

  const handleSubmit = async () => {
    if (!nom.trim() || !telephone.trim()) {
      toast.error('Nom et téléphone requis')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('leads').insert({
        nom: nom.trim(),
        telephone: telephone.trim(),
        formation_souhaitee: formation || null,
        source: 'QUICK_ADD',
        statut: 'NOUVEAU',
        score: 0,
      })

      if (error) throw error

      setSuccess(true)
      toast.success(`${nom.trim()} ajouté !`)

      // Lancer enrichissement auto en background
      try {
        await fetch('/api/leads/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: nom.trim(), telephone: telephone.trim() }),
        }).catch(() => {})
      } catch { /* silent — enrichissement optionnel */ }

      setTimeout(() => {
        reset()
        setOpen(false)
      }, 1500)
    } catch (err) {
      toast.error('Erreur lors de l\'ajout')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && nom.trim() && telephone.trim()) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setOpen(false)
      reset()
    }
  }

  return (
    <>
      {/* FAB Button — toujours visible, en bas à gauche (chatbot est à droite) */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-[65] bg-success hover:bg-success text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-shadow md:bottom-6 md:left-auto md:right-24"
        whileHover={{ scale: 1.08, rotate: open ? 0 : 90 }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', damping: 20 }}
        aria-label="Ajouter un lead rapidement"
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </motion.button>

      {/* Quick Add Form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-6 md:left-auto md:right-24 z-[65] w-[320px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-[#EEEEEE]/80 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-success text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <span className="font-semibold text-sm">Ajout rapide</span>
              </div>
              <span className="text-[10px] text-white/60">5 secondes</span>
            </div>

            {success ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <Check size={32} className="text-success" />
                </motion.div>
                <p className="font-semibold text-accent">Lead ajouté !</p>
                <p className="text-xs text-[#777777] mt-1">Enrichissement en cours...</p>
              </div>
            ) : (
              <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
                {/* Nom */}
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-[#999999]" />
                  <input
                    ref={nomRef}
                    type="text"
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    placeholder="Nom du prospect *"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EEEEEE] rounded-xl text-sm focus:outline-none focus:border-success focus:ring-1 focus:ring-success/30"
                    autoComplete="off"
                  />
                </div>

                {/* Téléphone */}
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-[#999999]" />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    placeholder="Téléphone *"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EEEEEE] rounded-xl text-sm focus:outline-none focus:border-success focus:ring-1 focus:ring-success/30"
                    autoComplete="off"
                  />
                </div>

                {/* Formation (optionnel) */}
                <div className="relative">
                  <BookOpen size={14} className="absolute left-3 top-3 text-[#999999]" />
                  <select
                    value={formation}
                    onChange={e => setFormation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EEEEEE] rounded-xl text-sm focus:outline-none focus:border-success appearance-none"
                  >
                    <option value="">Formation (optionnel)</option>
                    {FORMATIONS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !nom.trim() || !telephone.trim()}
                  className="w-full bg-success hover:bg-success disabled:opacity-40 text-white rounded-xl py-3 font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {loading ? 'Ajout...' : 'Ajouter le prospect'}
                </button>

                <p className="text-[10px] text-[#999999] text-center">
                  Entrée pour valider · Échap pour fermer
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
