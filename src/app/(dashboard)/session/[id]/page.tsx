'use client'

export const dynamic = 'force-dynamic'

import React, { use, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, User, GraduationCap,
  Euro, CheckCircle, QrCode, FileText, Mail, Phone, Eye,
  Camera, Plus, Check, X, BookOpen, Target, BarChart3
} from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { formatEuro, formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import { QRCodeGenerator } from '@/components/ui/QRCodeGenerator'
import type {
  StatutSession, StatutInscription, PaiementStatut, StatutModele,
  Session, Lead, Inscription, Modele, Formation, Equipe, Emargement
} from '@/types'

// Status configurations
const STATUTS_SESSION: Record<StatutSession, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: '#9CA3AF' },
  PLANIFIEE: { label: 'Planifiée', color: '#3B82F6' },
  CONFIRMEE: { label: 'Confirmée', color: '#22C55E' },
  EN_COURS: { label: 'En cours', color: '#06B6D4' },
  TERMINEE: { label: 'Terminée', color: '#22C55E' },
  ANNULEE: { label: 'Annulée', color: '#EF4444' },
  REPORTEE: { label: 'Reportée', color: '#F97316' },
}

const STATUTS_INSCRIPTION: Record<StatutInscription, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: '#F59E0B' },
  CONFIRMEE: { label: 'Confirmée', color: '#22C55E' },
  EN_COURS: { label: 'En cours', color: '#06B6D4' },
  COMPLETEE: { label: 'Complétée', color: '#22C55E' },
  ANNULEE: { label: 'Annulée', color: '#EF4444' },
  REMBOURSEE: { label: 'Remboursée', color: '#F97316' },
  NO_SHOW: { label: 'Absent', color: '#DC2626' },
}

const STATUTS_PAIEMENT: Record<PaiementStatut, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: '#9CA3AF' },
  ACOMPTE: { label: 'Acompte', color: '#F59E0B' },
  PARTIEL: { label: 'Partiel', color: '#F97316' },
  PAYE: { label: 'Payé', color: '#22C55E' },
  REMBOURSE: { label: 'Remboursé', color: '#EF4444' },
  LITIGE: { label: 'Litige', color: '#DC2626' },
}

const STATUTS_MODELE: Record<StatutModele, { label: string; color: string }> = {
  INSCRIT: { label: 'Inscrit', color: '#3B82F6' },
  CONFIRME: { label: 'Confirmé', color: '#22C55E' },
  PRESENT: { label: 'Présent', color: '#10B981' },
  ABSENT: { label: 'Absent', color: '#EF4444' },
  ANNULE: { label: 'Annulé', color: '#9CA3AF' },
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState('overview')
  const [notes, setNotes] = useState('')
  const [checklistItems, setChecklistItems] = useState({
    materiel_prepare: false,
    supports_envoyes: false,
    convocations_envoyees: false,
    emargement_pret: false
  })

  // Fetch session data with all related entities (Supabase direct)
  const supabase = createClient()
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          formation:formations(*),
          formatrice:equipe!formatrice_id(*),
          inscriptions(*, lead:leads(id, prenom, nom, email, telephone, statut_pro)),
          modeles(*)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const session = sessionData
  const formation = sessionData?.formation
  const formatrice = sessionData?.formatrice
  const inscriptions = sessionData?.inscriptions || []
  const modeles = sessionData?.modeles || []
  const emargements: any[] = []

  // Initialize state when session loads
  useEffect(() => {
    if (session) {
      setNotes(session.notes || '')
      setChecklistItems({
        materiel_prepare: session.materiel_prepare || false,
        supports_envoyes: session.supports_envoyes || false,
        convocations_envoyees: session.convocations_envoyees || false,
        emargement_pret: session.emargement_pret || false
      })
    }
  }, [session])

  const handleChecklistToggle = async (field: keyof typeof checklistItems) => {
    const newValue = !checklistItems[field]
    setChecklistItems(prev => ({ ...prev, [field]: newValue }))

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ [field]: newValue })
        .eq('id', id)
      if (error) throw error
      toast.success('Checklist mise à jour')
    } catch {
      setChecklistItems(prev => ({ ...prev, [field]: !newValue }))
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleNotesUpdate = async () => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ notes })
        .eq('id', id)
      if (error) throw error
      toast.success('Notes sauvegardées')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!session || !formation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <Calendar className="w-6 h-6 text-gray-300" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Session introuvable</h3>
        <p className="text-sm text-gray-500 mb-4">Cette session n'existe pas ou a été supprimée</p>
        <Link href="/sessions" className="text-sm text-[#2EC6F3] hover:underline">
          Retour aux sessions
        </Link>
      </div>
    )
  }

  const statutSession = STATUTS_SESSION[session.statut as StatutSession]
  const placesOccupees = inscriptions.length
  const placesRestantes = session.places_max - placesOccupees
  const tauxRemplissage = Math.round((placesOccupees / session.places_max) * 100)
  const caPrevu = placesOccupees * (formation.prix_ht || 0)
  const caRealise = inscriptions
    .filter((i: any) => i.paiement_statut === 'PAYE')
    .reduce((sum: number, i: any) => sum + (i.montant_total || 0), 0)

  const emargementUrl = `${process.env.NEXT_PUBLIC_APP_URL}/emargement/${session.id}`

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'stagiaires', label: `Stagiaires (${placesOccupees})`, icon: <Users className="w-4 h-4" /> },
    { id: 'emargement', label: 'Émargement', icon: <QrCode className="w-4 h-4" /> },
    { id: 'modeles', label: `Modèles (${modeles.length})`, icon: <User className="w-4 h-4" /> }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sessions" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
                {formation.nom}
              </h1>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: statutSession.color }}
              >
                {statutSession.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(session.date_debut, { day: 'numeric', month: 'long', year: 'numeric' })}
                {session.date_debut !== session.date_fin && (
                  <> → {formatDate(session.date_fin, { day: 'numeric', month: 'long' })}</>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {session.horaire_debut} — {session.horaire_fin}
              </div>
              {formatrice && (
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {formatrice.prenom} {formatrice.nom}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-sm text-gray-500">Places</p>
            <p className="text-lg font-semibold text-[#082545]">
              {placesOccupees}/{session.places_max}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">CA prévu</p>
            <p className="text-lg font-semibold text-[#2EC6F3]">
              {formatEuro(caPrevu)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#2EC6F3] text-[#2EC6F3]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Vue d'ensemble */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card title="Informations session" icon={<Calendar className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Dates</p>
                    <p className="font-medium">
                      {formatDate(session.date_debut, { day: 'numeric', month: 'long' })}
                      {session.date_debut !== session.date_fin && (
                        <> au {formatDate(session.date_fin, { day: 'numeric', month: 'long' })}</>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Horaires</p>
                    <p className="font-medium">{session.horaire_debut} — {session.horaire_fin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Salle</p>
                    <p className="font-medium">{session.salle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Adresse</p>
                    <p className="font-medium text-sm">75 Bd Richard Lenoir, Paris 11e</p>
                  </div>
                  {formatrice && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Formatrice</p>
                        <p className="font-medium">{formatrice.prenom} {formatrice.nom}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Contact</p>
                        <div className="flex items-center gap-2">
                          {formatrice.email && (
                            <a href={`mailto:${formatrice.email}`} className="text-[#2EC6F3] hover:underline">
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {formatrice.telephone && (
                            <a href={`tel:${formatrice.telephone}`} className="text-[#2EC6F3] hover:underline">
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Places visualization */}
              <Card title="Places" icon={<Users className="w-4 h-4" />}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taux de remplissage</span>
                    <span className="font-semibold">{tauxRemplissage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-[#2EC6F3] h-3 rounded-full transition-all duration-300"
                      style={{ width: `${tauxRemplissage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">{placesOccupees} occupées</span>
                    <span className="text-gray-500">{placesRestantes} disponibles</span>
                  </div>
                </div>
              </Card>

              {/* CA */}
              <Card title="Chiffre d'affaires" icon={<Euro className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-[#2EC6F3]">{formatEuro(caPrevu)}</p>
                    <p className="text-sm text-gray-600">CA prévu</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{formatEuro(caRealise)}</p>
                    <p className="text-sm text-gray-600">CA réalisé</p>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              <Card title="Notes" icon={<FileText className="w-4 h-4" />}>
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleNotesUpdate}
                    placeholder="Ajouter des notes sur cette session..."
                    className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/20 outline-none text-sm"
                  />
                </div>
              </Card>
            </div>

            {/* Checklist */}
            <div className="space-y-6">
              <Card title="Checklist préparation" icon={<CheckCircle className="w-4 h-4" />}>
                <div className="space-y-3">
                  {Object.entries(checklistItems).map(([key, checked]) => {
                    const labels = {
                      materiel_prepare: 'Matériel préparé',
                      supports_envoyes: 'Supports envoyés',
                      convocations_envoyees: 'Convocations envoyées',
                      emargement_pret: 'Émargement prêt'
                    }
                    return (
                      <ChecklistItem
                        key={key}
                        label={labels[key as keyof typeof labels]}
                        checked={checked}
                        onChange={() => handleChecklistToggle(key as keyof typeof checklistItems)}
                      />
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Stagiaires */}
        {activeTab === 'stagiaires' && (
          <Card
            title={`Stagiaires (${placesOccupees})`}
            icon={<Users className="w-4 h-4" />}
            action={
              <button className="flex items-center gap-2 px-3 py-2 bg-[#2EC6F3] text-white rounded-lg text-sm hover:bg-[#1fb5e3] transition-colors">
                <Plus className="w-4 h-4" />
                Ajouter stagiaire
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 font-medium text-gray-600">Stagiaire</th>
                    <th className="text-left py-3 font-medium text-gray-600">Statut inscription</th>
                    <th className="text-left py-3 font-medium text-gray-600">Paiement</th>
                    <th className="text-left py-3 font-medium text-gray-600">Présence</th>
                    <th className="text-left py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inscriptions.map((inscription: any) => {
                    const lead = inscription.lead
                    const statutInsc = STATUTS_INSCRIPTION[inscription.statut as StatutInscription]
                    const statutPaiement = STATUTS_PAIEMENT[inscription.paiement_statut as PaiementStatut]

                    return (
                      <tr key={inscription.id} className="border-b border-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#2EC6F3]/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-[#2EC6F3]">
                                {lead?.prenom?.charAt(0)}{lead?.nom?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-[#082545]">
                                {lead?.prenom} {lead?.nom}
                              </p>
                              <p className="text-xs text-gray-500">{lead?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: statutInsc.color }}
                          >
                            {statutInsc.label}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: statutPaiement.color }}
                          >
                            {statutPaiement.label}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatEuro(inscription.montant_total)}
                          </p>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }, (_, i) => {
                              const day = i + 1
                              const presenceField = `presence_jour${day}` as keyof typeof inscription
                              const isPresent = inscription[presenceField]

                              return (
                                <div
                                  key={day}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    isPresent === true ? 'bg-green-500 text-white' :
                                    isPresent === false ? 'bg-red-500 text-white' :
                                    'bg-gray-200 text-gray-500'
                                  }`}
                                  title={`Jour ${day}: ${
                                    isPresent === true ? 'Présent' :
                                    isPresent === false ? 'Absent' :
                                    'Non défini'
                                  }`}
                                >
                                  •
                                </div>
                              )
                            })}
                          </div>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/lead/${lead?.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {inscriptions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun stagiaire inscrit pour cette session
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Émargement */}
        {activeTab === 'emargement' && (
          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="QR Code Émargement" icon={<QrCode className="w-4 h-4" />}>
                <QRCodeGenerator
                  value={emargementUrl}
                  sessionInfo={{
                    formationNom: formation.nom,
                    date: formatDate(session.date_debut, { day: 'numeric', month: 'long', year: 'numeric' }),
                    creneaux: ['Matin', 'Après-midi']
                  }}
                />
              </Card>

              <Card title="Lien d'émargement" icon={<FileText className="w-4 h-4" />}>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Lien pour émargement mobile :</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white p-2 rounded border">
                        {emargementUrl}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(emargementUrl)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title="Copier le lien"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <Link
                    href={`/emargement/${session.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-lg text-sm hover:bg-[#1fb5e3] transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ouvrir l'émargement
                  </Link>
                </div>
              </Card>
            </div>

            {/* Émargement Grid */}
            <Card title="Feuille d'émargement" icon={<CheckCircle className="w-4 h-4" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border border-gray-200 font-medium">Stagiaire</th>
                      <th className="text-center p-3 border border-gray-200 font-medium">Jour 1 - Matin</th>
                      <th className="text-center p-3 border border-gray-200 font-medium">Jour 1 - AM</th>
                      <th className="text-center p-3 border border-gray-200 font-medium">Jour 2 - Matin</th>
                      <th className="text-center p-3 border border-gray-200 font-medium">Jour 2 - AM</th>
                      <th className="text-center p-3 border border-gray-200 font-medium">Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscriptions.map((inscription: any) => {
                      const lead = inscription.lead
                      const presences = Array.from({ length: 5 }, (_, i: number) => {
                        const field = `presence_jour${i + 1}` as keyof typeof inscription
                        return inscription[field]
                      })
                      const tauxPresence = Math.round((presences.filter(Boolean).length / presences.length) * 100)

                      return (
                        <tr key={inscription.id} className="hover:bg-gray-50">
                          <td className="p-3 border border-gray-200">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-[#2EC6F3]/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-[#2EC6F3]">
                                  {lead?.prenom?.charAt(0)}{lead?.nom?.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium">{lead?.prenom} {lead?.nom}</span>
                            </div>
                          </td>
                          {presences.map((present, index) => (
                            <td key={index} className="p-3 border border-gray-200 text-center">
                              {present === true ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : present === false ? (
                                <X className="w-5 h-5 text-red-500 mx-auto" />
                              ) : (
                                <div className="w-5 h-5 bg-gray-200 rounded mx-auto" />
                              )}
                            </td>
                          ))}
                          <td className="p-3 border border-gray-200 text-center font-medium">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              tauxPresence >= 80 ? 'bg-green-100 text-green-700' :
                              tauxPresence >= 60 ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {tauxPresence}%
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Modèles */}
        {activeTab === 'modeles' && (
          <Card
            title={`Modèles (${modeles.length})`}
            icon={<User className="w-4 h-4" />}
            action={
              <button className="flex items-center gap-2 px-3 py-2 bg-[#2EC6F3] text-white rounded-lg text-sm hover:bg-[#1fb5e3] transition-colors">
                <Plus className="w-4 h-4" />
                Ajouter modèle
              </button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modeles.map((modele: any) => {
                const statutModele = STATUTS_MODELE[modele.statut as StatutModele]

                return (
                  <div key={modele.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-[#082545]">{modele.prenom} {modele.nom}</h4>
                        <p className="text-sm text-gray-500">{modele.age} ans</p>
                      </div>
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: statutModele.color }}
                      >
                        {statutModele.label}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600">Prestation :</p>
                        <p className="font-medium">{modele.prestation_souhaitee || '—'}</p>
                      </div>

                      {modele.zone && (
                        <div>
                          <p className="text-gray-600">Zone :</p>
                          <p className="font-medium">{modele.zone}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">Consentement :</span>
                          {modele.consentement_signe ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">Photos :</span>
                          <div className="flex gap-1">
                            {modele.photo_avant_url && (
                              <Camera className="w-4 h-4 text-green-500" aria-label="Photo avant" />
                            )}
                            {modele.photo_apres_url && (
                              <Camera className="w-4 h-4 text-blue-500" aria-label="Photo après" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {modeles.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <p>Aucun modèle pour cette session</p>
                  <p className="text-sm">Nécessaires : {session.modeles_necessaires} • Inscrits : {session.modeles_inscrits}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// Helper Components
function Card({
  title,
  icon,
  children,
  action
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-semibold text-[#082545] flex items-center gap-2">
          <span className="text-[#2EC6F3]">{icon}</span>
          {title}
        </h3>
        {action}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

function ChecklistItem({
  label,
  checked,
  onChange
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#2EC6F3]' : 'bg-gray-200'
        }`}
      >
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        } mt-0.5`} />
      </button>
    </div>
  )
}