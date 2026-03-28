'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Award,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Shield,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface CertificatData {
  numero: string
  prenom: string
  nom: string
  formation: string
  categorie: string
  duree_jours: number
  duree_heures: number
  date_debut: string
  date_fin: string
  taux_presence: number
  valid: boolean
}

export default function CertificatVerificationPage() {
  const params = useParams()
  const numero = params?.numero as string

  const [data, setData] = useState<CertificatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function verify() {
      if (!numero) {
        setError(true)
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/certificat/${encodeURIComponent(numero)}`)
        if (!res.ok) {
          setError(true)
          setLoading(false)
          return
        }
        const result = await res.json()
        if (!result.found) {
          setError(true)
          setLoading(false)
          return
        }
        setData(result.certificat)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [numero])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: '#FF5C00' }} />
          <p style={{ color: '#777777' }}>Vérification du certificat...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAFA' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#FFE0EF' }}>
            <XCircle size={40} style={{ color: '#FF2D78' }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            Certificat non trouvé
          </h1>
          <p style={{ color: '#777777' }}>
            Le numéro de certificat « {numero} » n'a pas été trouvé dans notre système.
            Vérifiez le numéro ou contactez notre centre de formation.
          </p>
          <div className="mt-8 text-sm" style={{ color: '#999999' }}>
            <p>Dermotec Advanced — Centre certifié Qualiopi</p>
            <p>75 Bd Richard Lenoir, 75011 Paris</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* En-tete verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: data.valid ? '#D1FAE5' : '#FFE0EF' }}>
            {data.valid ? (
              <CheckCircle size={40} style={{ color: '#10B981' }} />
            ) : (
              <XCircle size={40} style={{ color: '#FF2D78' }} />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
            {data.valid ? 'Certificat vérifié' : 'Certificat non valide'}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: data.valid ? '#10B981' : '#FF2D78' }}>
            <Shield size={14} />
            {data.valid
              ? 'Ce certificat est authentique et valide'
              : 'La formation n\'est pas encore terminée'
            }
          </div>
        </motion.div>

        {/* Details certificat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}
        >
          {/* Barre orange top */}
          <div className="h-2" style={{ backgroundColor: '#FF5C00' }} />

          <div className="p-6 space-y-6">
            {/* Logo + numero */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold" style={{ color: '#111111', fontFamily: 'var(--font-heading)' }}>
                  Dermotec Advanced
                </div>
                <div className="text-xs" style={{ color: '#777777' }}>
                  Centre certifié Qualiopi
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium" style={{ color: '#777777' }}>N° Certificat</div>
                <div className="text-sm font-bold font-mono" style={{ color: '#FF5C00' }}>
                  {data.numero}
                </div>
              </div>
            </div>

            <div className="h-px" style={{ backgroundColor: '#EEEEEE' }} />

            {/* Stagiaire */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FFF0E5' }}>
                <User size={20} style={{ color: '#FF5C00' }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: '#777777' }}>Stagiaire</div>
                <div className="text-lg font-bold" style={{ color: '#111111' }}>
                  {data.prenom} {data.nom}
                </div>
              </div>
            </div>

            {/* Formation */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FFE0EF' }}>
                <GraduationCap size={20} style={{ color: '#FF2D78' }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: '#777777' }}>Formation</div>
                <div className="font-bold" style={{ color: '#111111' }}>
                  {data.formation}
                </div>
                <div className="text-xs" style={{ color: '#999999' }}>
                  {data.categorie}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#FAFAFA' }}>
                <div className="flex items-center gap-2 text-xs mb-1" style={{ color: '#777777' }}>
                  <Calendar size={12} />
                  Dates
                </div>
                <div className="text-sm font-semibold" style={{ color: '#111111' }}>
                  {new Date(data.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {data.date_debut !== data.date_fin && (
                  <div className="text-xs" style={{ color: '#777777' }}>
                    au {new Date(data.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#FAFAFA' }}>
                <div className="flex items-center gap-2 text-xs mb-1" style={{ color: '#777777' }}>
                  <Clock size={12} />
                  Durée
                </div>
                <div className="text-sm font-semibold" style={{ color: '#111111' }}>
                  {data.duree_jours} jour{data.duree_jours > 1 ? 's' : ''} — {data.duree_heures}h
                </div>
              </div>
            </div>

            {/* Taux presence */}
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: '#10B981' }}>
                  Taux de présence
                </span>
                <span className="text-lg font-bold" style={{ color: '#10B981' }}>
                  {data.taux_presence}%
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4" style={{ backgroundColor: '#FAFAFA', borderTop: '1px solid #EEEEEE' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#999999' }}>
              <Award size={12} style={{ color: '#FF5C00' }} />
              Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris — Certifié Qualiopi
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
