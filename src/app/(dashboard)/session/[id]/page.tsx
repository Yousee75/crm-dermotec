'use client'

import React, { use, useState } from 'react'
import { useSession, useUpdateSession } from '@/hooks/use-sessions'
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, GraduationCap,
  Euro, CheckCircle, XCircle, User, Camera, FileText,
  Phone, Mail, Settings, Save, Plus, Eye
} from 'lucide-react'
import Link from 'next/link'
import { formatEuro, formatDate, formatPhone } from '@/lib/utils'
import { toast } from 'sonner'
import type { StatutSession, StatutInscription, PaiementStatut, StatutModele } from '@/types'

const STATUTS_SESSION: Record<StatutSession, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: '#9CA3AF' },
  PLANIFIEE: { label: 'Planifiée', color: '#3B82F6' },
  CONFIRMEE: { label: 'Confirmée', color: '#22C55E' },
  EN_COURS: { label: 'En cours', color: '#F59E0B' },
  TERMINEE: { label: 'Terminée', color: '#6366F1' },
  ANNULEE: { label: 'Annulée', color: '#EF4444' },
  REPORTEE: { label: 'Reportée', color: '#F97316' },
}

const STATUTS_INSCRIPTION: Record<StatutInscription, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: '#9CA3AF' },
  CONFIRMEE: { label: 'Confirmée', color: '#22C55E' },
  EN_COURS: { label: 'En cours', color: '#F59E0B' },
  COMPLETEE: { label: 'Complétée', color: '#6366F1' },
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
  const { data: session, isLoading } = useSession(id)
  const updateSession = useUpdateSession()
  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState('')

  // Initialiser les notes quand la session est chargée
  React.useEffect(() => {
    if (session?.notes) setNotes(session.notes)
  }, [session])

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>
  }

  if (!session) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Session introuvable</div>
  }

  const statutSession = STATUTS_SESSION[session.statut]
  const placesRestantes = session.places_max - session.places_occupees
  const tauxRemplissage = Math.round((session.places_occupees / session.places_max) * 100)

  const handleChecklistToggle = async (field: keyof typeof session, value: boolean) => {
    try {
      await updateSession.mutateAsync({
        id: session.id,
        [field]: value,
      })
      toast.success('Checklist mise à jour')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleSaveNotes = async () => {
    try {
      await updateSession.mutateAsync({
        id: session.id,
        notes,
      })
      setIsEditing(false)
      toast.success('Notes sauvegardées')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleChangeStatut = async (newStatut: StatutSession) => {
    try {
      await updateSession.mutateAsync({
        id: session.id,
        statut: newStatut,
      })
      toast.success('Statut mis à jour')
    } catch (error) {
      toast.error('Erreur lors du changement de statut')
    }
  }

  const tabs = [
    { id: 'info', label: 'Informations', icon: <FileText className="w-4 h-4" /> },
    { id: 'inscrits', label: `Inscrits (${session.places_occupees})`, icon: <Users className="w-4 h-4" /> },
    { id: 'modeles', label: `Modèles (${session.modeles?.length || 0})`, icon: <User className="w-4 h-4" /> },
    { id: 'checklist', label: 'Checklist', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'notes', label: 'Notes', icon: <FileText className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sessions" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
                {session.formation?.nom}
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
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {session.salle}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Changement statut */}
          <select
            value={session.statut}
            onChange={(e) => handleChangeStatut(e.target.value as StatutSession)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#2EC6F3] outline-none"
          >
            {Object.entries(STATUTS_SESSION).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          {/* Places indicator */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: session.places_max }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < session.places_occupees ? 'bg-[#2EC6F3]' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {session.places_occupees}/{session.places_max} ({tauxRemplissage}%)
            </span>
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
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition ${
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
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Info formation */}
            <Section title="Formation" icon={<GraduationCap className="w-4 h-4" />}>
              <div className="space-y-3">
                <InfoItem label="Formation" value={session.formation?.nom} />
                <InfoItem label="Catégorie" value={session.formation?.categorie} />
                <InfoItem label="Durée" value={`${session.formation?.duree_jours} jours (${session.formation?.duree_heures}h)`} />
                <InfoItem label="Prix" value={formatEuro(session.formation?.prix_ht || 0)} />
                <InfoItem label="Niveau" value={session.formation?.niveau} />
              </div>
            </Section>

            {/* Info planning */}
            <Section title="Planning" icon={<Calendar className="w-4 h-4" />}>
              <div className="space-y-3">
                <InfoItem label="Date début" value={formatDate(session.date_debut)} />
                <InfoItem label="Date fin" value={formatDate(session.date_fin)} />
                <InfoItem label="Horaires" value={`${session.horaire_debut} — ${session.horaire_fin}`} />
                <InfoItem label="Salle" value={session.salle} />
                <InfoItem label="Adresse" value={session.adresse} />
              </div>
            </Section>

            {/* Info équipe */}
            <Section title="Équipe" icon={<User className="w-4 h-4" />}>
              <div className="space-y-3">
                <InfoItem
                  label="Formatrice"
                  value={session.formatrice ? `${session.formatrice.prenom} ${session.formatrice.nom}` : 'Non assignée'}
                />
                <InfoItem label="Email" value={session.formatrice?.email} />
                <InfoItem label="Téléphone" value={session.formatrice?.telephone} />
                <InfoItem label="Spécialités" value={session.formatrice?.specialites?.join(', ')} />
              </div>
            </Section>

            {/* Info financière */}
            <Section title="Financier" icon={<Euro className="w-4 h-4" />}>
              <div className="space-y-3">
                <InfoItem label="CA prévu" value={formatEuro(session.ca_prevu)} />
                <InfoItem label="CA réalisé" value={formatEuro(session.ca_realise)} />
                <InfoItem label="Places max" value={session.places_max.toString()} />
                <InfoItem label="Places occupées" value={session.places_occupees.toString()} />
                <InfoItem label="Modèles nécessaires" value={session.modeles_necessaires.toString()} />
                <InfoItem label="Modèles inscrits" value={session.modeles_inscrits.toString()} />
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'inscrits' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-[#082545]">Inscrits ({session.inscriptions?.length || 0})</h3>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#2EC6F3] text-white rounded-lg text-sm hover:bg-[#1BA8D4]">
                <Plus className="w-4 h-4" />
                Ajouter inscription
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">Stagiaire</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Contact</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Montant</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Paiement</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Présence</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {session.inscriptions?.map((inscription) => {
                    const statutInsc = STATUTS_INSCRIPTION[inscription.statut]
                    const statutPaiement = STATUTS_PAIEMENT[inscription.paiement_statut]
                    const lead = inscription.lead

                    return (
                      <tr key={inscription.id} className="border-t border-gray-50">
                        <td className="px-4 py-3">
                          <Link href={`/lead/${lead?.id}`} className="block">
                            <p className="font-medium text-[#082545] hover:text-[#2EC6F3]">
                              {lead?.prenom} {lead?.nom}
                            </p>
                            <p className="text-xs text-gray-400">{lead?.statut_pro?.replace('_', ' ')}</p>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {lead?.telephone && (
                              <a href={`tel:${lead.telephone}`} className="p-1 hover:bg-blue-50 rounded">
                                <Phone className="w-3 h-3 text-blue-500" />
                              </a>
                            )}
                            {lead?.email && (
                              <a href={`mailto:${lead.email}`} className="p-1 hover:bg-blue-50 rounded">
                                <Mail className="w-3 h-3 text-blue-500" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{formatEuro(inscription.montant_total)}</p>
                          {inscription.montant_finance > 0 && (
                            <p className="text-xs text-gray-400">
                              Financé: {formatEuro(inscription.montant_finance)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: statutPaiement.color }}
                          >
                            {statutPaiement.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((jour) => {
                              const presenceField = `presence_jour${jour}` as keyof typeof inscription
                              const isPresent = inscription[presenceField]
                              return (
                                <div
                                  key={jour}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                                    isPresent === true ? 'bg-green-100 text-green-700' :
                                    isPresent === false ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-400'
                                  }`}
                                  title={`Jour ${jour}: ${isPresent === true ? 'Présent' : isPresent === false ? 'Absent' : 'Non défini'}`}
                                >
                                  {jour}
                                </div>
                              )
                            })}
                          </div>
                          {inscription.taux_presence && (
                            <p className="text-xs text-gray-500 mt-1">{inscription.taux_presence}%</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/lead/${lead?.id}`}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Voir le lead"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                          </Link>
                        </td>
                      </tr>
                    )
                  }) || (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        Aucune inscription pour cette session
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'modeles' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-[#082545]">Modèles ({session.modeles?.length || 0})</h3>
              <button className="flex items-center gap-2 px-3 py-2 bg-[#2EC6F3] text-white rounded-lg text-sm hover:bg-[#1BA8D4]">
                <Plus className="w-4 h-4" />
                Ajouter modèle
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">Nom</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Contact</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Âge</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Prestation</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Statut</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Consentement</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Photos</th>
                  </tr>
                </thead>
                <tbody>
                  {session.modeles?.map((modele) => {
                    const statutModele = STATUTS_MODELE[modele.statut]

                    return (
                      <tr key={modele.id} className="border-t border-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#082545]">{modele.prenom} {modele.nom}</p>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="space-y-1">
                            {modele.email && <p>{modele.email}</p>}
                            {modele.telephone && <p>{formatPhone(modele.telephone)}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{modele.age || '—'}</td>
                        <td className="px-4 py-3 text-xs">
                          <p>{modele.prestation_souhaitee || '—'}</p>
                          {modele.zone && <p className="text-gray-400">Zone: {modele.zone}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: statutModele.color }}
                          >
                            {statutModele.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {modele.consentement_signe ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {modele.photo_avant_url && (
                              <span title="Photo avant"><Camera className="w-4 h-4 text-green-500" /></span>
                            )}
                            {modele.photo_apres_url && (
                              <span title="Photo après"><Camera className="w-4 h-4 text-blue-500" /></span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  }) || (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        Aucun modèle pour cette session
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <Section title="Checklist préparation" icon={<CheckCircle className="w-4 h-4" />}>
            <div className="space-y-4">
              <ChecklistItem
                label="Matériel préparé"
                checked={session.materiel_prepare}
                onChange={(checked) => handleChecklistToggle('materiel_prepare', checked)}
              />
              <ChecklistItem
                label="Supports envoyés"
                checked={session.supports_envoyes}
                onChange={(checked) => handleChecklistToggle('supports_envoyes', checked)}
              />
              <ChecklistItem
                label="Convocations envoyées"
                checked={session.convocations_envoyees || false}
                onChange={(checked) => handleChecklistToggle('convocations_envoyees', checked)}
              />
              <ChecklistItem
                label="Émargement prêt"
                checked={session.emargement_pret || false}
                onChange={(checked) => handleChecklistToggle('emargement_pret', checked)}
              />
            </div>
          </Section>
        )}

        {activeTab === 'notes' && (
          <Section title="Notes de session" icon={<FileText className="w-4 h-4" />}>
            <div className="space-y-4">
              {isEditing ? (
                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajouter des notes sur cette session..."
                    className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:border-[#2EC6F3] focus:ring-1 focus:ring-[#2EC6F3]/20 outline-none"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveNotes}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2EC6F3] text-white rounded-lg text-sm hover:bg-[#1BA8D4]"
                    >
                      <Save className="w-4 h-4" />
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setNotes(session.notes || '')
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {session.notes ? (
                    <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                      {session.notes}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">Aucune note pour cette session</p>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-3 flex items-center gap-2 px-4 py-2 text-[#2EC6F3] border border-[#2EC6F3] rounded-lg text-sm hover:bg-[#2EC6F3]/10"
                  >
                    <FileText className="w-4 h-4" />
                    {session.notes ? 'Modifier' : 'Ajouter des notes'}
                  </button>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-[#082545] flex items-center gap-2 mb-4 text-sm">
        <span className="text-[#2EC6F3]">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{value}</p>
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
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2EC6F3]"></div>
      </label>
    </div>
  )
}