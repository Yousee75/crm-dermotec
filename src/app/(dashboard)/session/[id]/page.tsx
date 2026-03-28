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
import { createClient } from '@/lib/infra/supabase-client'
import { formatEuro, formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import { QRCodeGenerator } from '@/components/ui/QRCodeGenerator'
import type {
  StatutSession, StatutInscription, PaiementStatut, StatutModele,
  Session, Lead, Inscription, Modele, Formation, Equipe, Emargement
} from '@/types'

// Couleurs centralisées (source unique : status-config.ts)
import {
  SESSION_STATUS, INSCRIPTION_STATUS, PAIEMENT_STATUS,
  getSessionStatus, getInscriptionStatus
} from '@/lib/status-config'

const STATUTS_SESSION = SESSION_STATUS as Record<StatutSession, { label: string; color: string; bgColor: string; dotColor: string; order: number }>
const STATUTS_INSCRIPTION = INSCRIPTION_STATUS as Record<StatutInscription, { label: string; color: string; bgColor: string; dotColor: string; order: number }>
const STATUTS_PAIEMENT = PAIEMENT_STATUS as Record<PaiementStatut, { label: string; color: string; bgColor: string; dotColor: string; order: number }>

const STATUTS_MODELE: Record<StatutModele, { label: string; color: string }> = {
  INSCRIT: { label: 'Inscrit', color: '#3B82F6' },
  CONFIRME: { label: 'Confirmé', color: 'var(--color-success)' },
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
          <div className="h-8 bg-[#EEEEEE] rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-[#EEEEEE] rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-[#EEEEEE] rounded animate-pulse"></div>
          <div className="h-64 bg-[#EEEEEE] rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!session || !formation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FAFAFA] flex items-center justify-center mb-4">
          <Calendar className="w-6 h-6 text-[#999999]" />
        </div>
        <h3 className="text-sm font-semibold text-[#111111] mb-1">Session introuvable</h3>
        <p className="text-sm text-[#777777] mb-4">Cette session n'existe pas ou a été supprimée</p>
        <Link href="/sessions" className="text-sm text-primary hover:underline">
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
          <Link href="/sessions" className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#777777]" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-accent">
                {formation.nom}
              </h1>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: statutSession.color }}
              >
                {statutSession.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[#777777]">
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
            <p className="text-sm text-[#777777]">Places</p>
            <p className="text-lg font-semibold text-accent">
              {placesOccupees}/{session.places_max}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#777777]">CA prévu</p>
            <p className="text-lg font-semibold text-primary">
              {formatEuro(caPrevu)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#F0F0F0]">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#777777] hover:text-[#3A3A3A] hover:border-[#F0F0F0]'
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
                    <p className="text-xs text-[#777777] mb-1">Dates</p>
                    <p className="font-medium">
                      {formatDate(session.date_debut, { day: 'numeric', month: 'long' })}
                      {session.date_debut !== session.date_fin && (
                        <> au {formatDate(session.date_fin, { day: 'numeric', month: 'long' })}</>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#777777] mb-1">Horaires</p>
                    <p className="font-medium">{session.horaire_debut} — {session.horaire_fin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#777777] mb-1">Salle</p>
                    <p className="font-medium">{session.salle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#777777] mb-1">Adresse</p>
                    <p className="font-medium text-sm">75 Bd Richard Lenoir, Paris 11e</p>
                  </div>
                  {formatrice && (
                    <>
                      <div>
                        <p className="text-xs text-[#777777] mb-1">Formatrice</p>
                        <p className="font-medium">{formatrice.prenom} {formatrice.nom}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#777777] mb-1">Contact</p>
                        <div className="flex items-center gap-2">
                          {formatrice.email && (
                            <a href={`mailto:${formatrice.email}`} className="text-primary hover:underline">
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {formatrice.telephone && (
                            <a href={`tel:${formatrice.telephone}`} className="text-primary hover:underline">
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
                    <span className="text-sm text-[#777777]">Taux de remplissage</span>
                    <span className="font-semibold">{tauxRemplissage}%</span>
                  </div>
                  <div className="w-full bg-[#EEEEEE] rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${tauxRemplissage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#10B981]">{placesOccupees} occupées</span>
                    <span className="text-[#777777]">{placesRestantes} disponibles</span>
                  </div>
                </div>
              </Card>

              {/* CA */}
              <Card title="Chiffre d'affaires" icon={<Euro className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-[#E0EBF5] rounded-lg">
                    <p className="text-2xl font-bold text-primary">{formatEuro(caPrevu)}</p>
                    <p className="text-sm text-[#777777]">CA prévu</p>
                  </div>
                  <div className="text-center p-4 bg-[#ECFDF5] rounded-lg">
                    <p className="text-2xl font-bold text-[#10B981]">{formatEuro(caRealise)}</p>
                    <p className="text-sm text-[#777777]">CA réalisé</p>
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
                    className="w-full h-24 p-3 border border-[#F0F0F0] rounded-lg resize-none focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
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
              <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" />
                Ajouter stagiaire
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0F0F0]">
                    <th className="text-left py-3 font-medium text-[#777777]">Stagiaire</th>
                    <th className="text-left py-3 font-medium text-[#777777]">Statut inscription</th>
                    <th className="text-left py-3 font-medium text-[#777777]">Paiement</th>
                    <th className="text-left py-3 font-medium text-[#777777]">Présence</th>
                    <th className="text-left py-3 font-medium text-[#777777]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inscriptions.map((inscription: any) => {
                    const lead = inscription.lead
                    const statutInsc = STATUTS_INSCRIPTION[inscription.statut as StatutInscription]
                    const statutPaiement = STATUTS_PAIEMENT[inscription.paiement_statut as PaiementStatut]

                    return (
                      <tr key={inscription.id} className="border-b border-[#FAFAFA]">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {lead?.prenom?.charAt(0)}{lead?.nom?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-accent">
                                {lead?.prenom} {lead?.nom}
                              </p>
                              <p className="text-xs text-[#777777]">{lead?.email}</p>
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
                          <p className="text-xs text-[#777777] mt-1">
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
                                    isPresent === true ? 'bg-[#10B981] text-white' :
                                    isPresent === false ? 'bg-[#FF2D78] text-white' :
                                    'bg-[#EEEEEE] text-[#777777]'
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
                            className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-[#999999]" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {inscriptions.length === 0 && (
                <div className="text-center py-8 text-[#777777]">
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
                  <div className="p-3 bg-[#FAFAFA] rounded-lg">
                    <p className="text-sm text-[#777777] mb-2">Lien pour émargement mobile :</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white p-2 rounded border">
                        {emargementUrl}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(emargementUrl)}
                        className="p-2 hover:bg-[#EEEEEE] rounded transition-colors"
                        title="Copier le lien"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <Link
                    href={`/emargement/${session.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
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
                    <tr className="bg-[#FAFAFA]">
                      <th className="text-left p-3 border border-[#F0F0F0] font-medium">Stagiaire</th>
                      <th className="text-center p-3 border border-[#F0F0F0] font-medium">Jour 1 - Matin</th>
                      <th className="text-center p-3 border border-[#F0F0F0] font-medium">Jour 1 - AM</th>
                      <th className="text-center p-3 border border-[#F0F0F0] font-medium">Jour 2 - Matin</th>
                      <th className="text-center p-3 border border-[#F0F0F0] font-medium">Jour 2 - AM</th>
                      <th className="text-center p-3 border border-[#F0F0F0] font-medium">Taux</th>
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
                        <tr key={inscription.id} className="hover:bg-[#FAFAFA]">
                          <td className="p-3 border border-[#F0F0F0]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {lead?.prenom?.charAt(0)}{lead?.nom?.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium">{lead?.prenom} {lead?.nom}</span>
                            </div>
                          </td>
                          {presences.map((present, index) => (
                            <td key={index} className="p-3 border border-[#F0F0F0] text-center">
                              {present === true ? (
                                <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                              ) : present === false ? (
                                <X className="w-5 h-5 text-[#FF2D78] mx-auto" />
                              ) : (
                                <div className="w-5 h-5 bg-[#EEEEEE] rounded mx-auto" />
                              )}
                            </td>
                          ))}
                          <td className="p-3 border border-[#F0F0F0] text-center font-medium">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              tauxPresence >= 80 ? 'bg-[#D1FAE5] text-[#10B981]' :
                              tauxPresence >= 60 ? 'bg-orange-100 text-orange-700' :
                              'bg-[#FFE0EF] text-[#FF2D78]'
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
              <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" />
                Ajouter modèle
              </button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modeles.map((modele: any) => {
                const statutModele = STATUTS_MODELE[modele.statut as StatutModele]

                return (
                  <div key={modele.id} className="border border-[#F0F0F0] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-accent">{modele.prenom} {modele.nom}</h4>
                        <p className="text-sm text-[#777777]">{modele.age} ans</p>
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
                        <p className="text-[#777777]">Prestation :</p>
                        <p className="font-medium">{modele.prestation_souhaitee || '—'}</p>
                      </div>

                      {modele.zone && (
                        <div>
                          <p className="text-[#777777]">Zone :</p>
                          <p className="font-medium">{modele.zone}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2 border-t border-[#F0F0F0]">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[#777777]">Consentement :</span>
                          {modele.consentement_signe ? (
                            <Check className="w-4 h-4 text-[#10B981]" />
                          ) : (
                            <X className="w-4 h-4 text-[#FF2D78]" />
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[#777777]">Photos :</span>
                          <div className="flex gap-1">
                            {modele.photo_avant_url && (
                              <Camera className="w-4 h-4 text-[#10B981]" aria-label="Photo avant" />
                            )}
                            {modele.photo_apres_url && (
                              <Camera className="w-4 h-4 text-[#6B8CAE]" aria-label="Photo après" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {modeles.length === 0 && (
                <div className="col-span-full text-center py-8 text-[#777777]">
                  <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-[#999999]" />
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
    <div className="bg-white rounded-xl border border-[#F0F0F0] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#F0F0F0]">
        <h3 className="font-semibold text-accent flex items-center gap-2">
          <span className="text-primary">{icon}</span>
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
    <div className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg">
      <span className="text-sm font-medium text-[#3A3A3A]">{label}</span>
      <button
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-[#EEEEEE]'
        }`}
      >
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        } mt-0.5`} />
      </button>
    </div>
  )
}