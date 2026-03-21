'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Download,
  PenTool,
  Star,
  StarIcon,
  BookOpen,
  GraduationCap,
  CheckCircle,
  XCircle,
  Euro,
  AlertCircle,
  Loader2,
  FileSignature,
} from 'lucide-react'
import type { PortailData } from '@/types'

type TabId = 'formation' | 'planning' | 'convention' | 'documents' | 'emargements' | 'evaluation' | 'factures'

interface TabOption {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: TabOption[] = [
  { id: 'formation', label: 'Ma Formation', icon: BookOpen },
  { id: 'planning', label: 'Mon Planning', icon: Calendar },
  { id: 'convention', label: 'Ma Convention', icon: FileSignature },
  { id: 'documents', label: 'Mes Documents', icon: FileText },
  { id: 'emargements', label: 'Mes Émargements', icon: PenTool },
  { id: 'evaluation', label: 'Mon Évaluation', icon: Star },
  { id: 'factures', label: 'Mes Factures', icon: Euro },
]

export default function PortailPage() {
  const params = useParams()
  const token = params?.token as string

  const [data, setData] = useState<PortailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('formation')
  const [evaluation, setEvaluation] = useState({
    note: 0,
    recommanderait: null as boolean | null,
    points_forts: '',
    points_amelioration: '',
  })
  const [submittingEval, setSubmittingEval] = useState(false)

  useEffect(() => {
    fetchPortailData()
  }, [token])

  const fetchPortailData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/portail/${token}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Portail non trouvé')
        } else {
          setError('Erreur lors du chargement des données')
        }
        return
      }

      const portailData = await response.json()
      setData(portailData)

      // Pré-remplir l'évaluation si elle existe
      if (portailData.inscription) {
        setEvaluation({
          note: portailData.inscription.note_satisfaction || 0,
          recommanderait: portailData.inscription.recommanderait,
          points_forts: portailData.inscription.points_forts || '',
          points_amelioration: portailData.inscription.points_amelioration || '',
        })
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const submitEvaluation = async () => {
    if (!data?.inscription.id) return

    try {
      setSubmittingEval(true)

      const response = await fetch(`/api/portail/${token}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluation),
      })

      if (response.ok) {
        // Recharger les données pour avoir la version à jour
        await fetchPortailData()
      }
    } catch (err) {
      console.error('Erreur soumission évaluation:', err)
    } finally {
      setSubmittingEval(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100)
  }

  const getSessionDates = () => {
    if (!data?.session) return []

    const dates = []
    const start = new Date(data.session.date_debut)
    const end = new Date(data.session.date_fin)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }

    return dates
  }

  const isFormationCompleted = () => {
    return data?.inscription.statut === 'COMPLETEE'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-text-secondary">Chargement de votre portail...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <AlertCircle className="h-12 w-12 text-error mx-auto" />
          <h1 className="text-2xl font-heading font-bold text-text">Oops !</h1>
          <p className="text-text-secondary">{error}</p>
          <p className="text-sm text-text-muted">
            Vérifiez votre lien ou contactez-nous si le problème persiste.
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start space-x-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-text">
              Bonjour {data.lead.prenom} !
            </h1>
            <p className="text-lg text-text-secondary mt-1">
              Bienvenue sur votre portail stagiaire
            </p>
          </div>
        </div>
      </div>

      {/* Navigation mobile */}
      <div className="lg:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as TabId)}
          className="w-full p-3 border border-border rounded-lg bg-white text-text focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation desktop */}
        <nav className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-border p-2 sticky top-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg border border-border">
            {/* Ma Formation */}
            {activeTab === 'formation' && (
              <div className="p-6">
                <h2 className="text-2xl font-heading font-bold text-text mb-6">Ma Formation</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Détails formation */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-text text-lg mb-2">{data.formation.nom}</h3>
                      <div className="bg-primary/5 p-3 rounded-lg">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {data.formation.categorie}
                        </span>
                      </div>
                    </div>

                    {data.formation.description && (
                      <div>
                        <h4 className="font-medium text-text mb-2">Description</h4>
                        <p className="text-text-secondary text-sm leading-relaxed">
                          {data.formation.description}
                        </p>
                      </div>
                    )}

                    {data.formation.objectifs.length > 0 && (
                      <div>
                        <h4 className="font-medium text-text mb-2">Objectifs</h4>
                        <ul className="space-y-1">
                          {data.formation.objectifs.map((objectif, idx) => (
                            <li key={idx} className="flex items-start space-x-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-text-secondary">{objectif}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Infos session */}
                  <div className="bg-surface rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-text">Informations pratiques</h4>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-text">Dates</p>
                          <p className="text-sm text-text-secondary">
                            Du {formatDate(data.session.date_debut)} au {formatDate(data.session.date_fin)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-text">Horaires</p>
                          <p className="text-sm text-text-secondary">
                            {data.session.horaire_debut} - {data.session.horaire_fin}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-text">Lieu</p>
                          <p className="text-sm text-text-secondary">
                            {data.session.salle}<br />
                            75 Bd Richard Lenoir<br />
                            75011 Paris
                          </p>
                        </div>
                      </div>

                      {data.session.formatrice && (
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-text">Formatrice</p>
                            <p className="text-sm text-text-secondary">
                              {data.session.formatrice.prenom} {data.session.formatrice.nom}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mon Planning */}
            {activeTab === 'planning' && (
              <div className="p-6">
                <h2 className="text-2xl font-heading font-bold text-text mb-6">Mon Planning</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getSessionDates().map((date, idx) => {
                    const dayNumber = idx + 1
                    const isPresent = data.inscription[`presence_jour${dayNumber}` as keyof typeof data.inscription] as boolean

                    return (
                      <div key={idx} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-text">Jour {dayNumber}</h3>
                          <div className="flex items-center space-x-2">
                            {isPresent === true ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : isPresent === false ? (
                              <XCircle className="h-5 w-5 text-error" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-border" />
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-text-secondary mb-1">
                          {formatDate(date.toISOString())}
                        </p>

                        <p className="text-xs text-text-muted">
                          {data.session.horaire_debut} - {data.session.horaire_fin}
                        </p>

                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isPresent === true
                              ? 'bg-success/10 text-success'
                              : isPresent === false
                              ? 'bg-error/10 text-error'
                              : 'bg-border text-text-muted'
                          }`}>
                            {isPresent === true
                              ? 'Présent(e)'
                              : isPresent === false
                              ? 'Absent(e)'
                              : 'À venir'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ma Convention */}
            {activeTab === 'convention' && (
              <div className="p-6">
                <h2 className="text-2xl font-heading font-bold text-text mb-6">Ma Convention</h2>

                <div className="bg-surface rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-text text-lg">Convention de Formation</h3>
                      <p className="text-text-secondary text-sm mt-1">
                        {data.formation.nom} • Du {formatDate(data.session.date_debut)} au {formatDate(data.session.date_fin)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {data.inscription.convention_signee ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="text-sm font-medium text-success">Signée</span>
                        </>
                      ) : (
                        <>
                          <div className="h-5 w-5 rounded-full bg-warning" />
                          <span className="text-sm font-medium text-warning">En attente de signature</span>
                        </>
                      )}
                    </div>
                  </div>

                  {data.inscription.convention_signee ? (
                    <div className="space-y-4">
                      <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="font-medium text-success">Convention signée avec succès</span>
                        </div>
                        <p className="text-sm text-text-secondary">
                          Votre convention a été signée électroniquement.
                          Un exemplaire vous a été envoyé par email.
                        </p>
                      </div>

                      {data.inscription.convention_url && (
                        <a
                          href={data.inscription.convention_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-primary hover:underline"
                        >
                          <Download className="h-4 w-4" />
                          <span>Télécharger ma convention</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-text-secondary text-sm leading-relaxed">
                        Votre convention de formation doit être signée avant le début de votre formation.
                        Elle contient tous les détails de votre parcours de formation.
                      </p>

                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h4 className="font-medium text-text mb-2">Informations importantes :</h4>
                        <ul className="space-y-1 text-sm text-text-secondary">
                          <li>• Formation : {data.formation.nom}</li>
                          <li>• Durée : {data.formation.duree_jours} jour{data.formation.duree_jours > 1 ? 's' : ''} ({data.formation.duree_heures}h)</li>
                          <li>• Montant : {data.inscription.montant_total.toFixed(2)} € HT</li>
                          <li>• Reste à charge : {data.inscription.reste_a_charge.toFixed(2)} €</li>
                        </ul>
                      </div>

                      <a
                        href={`/portail/${token}/convention`}
                        className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                      >
                        <FileSignature className="h-5 w-5" />
                        <span>Signer ma convention</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mes Documents */}
            {activeTab === 'documents' && (
              <div className="p-6">
                <h2 className="text-2xl font-heading font-bold text-text mb-6">Mes Documents</h2>

                {data.documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">Aucun document disponible pour le moment</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.documents.map((doc) => (
                      <div key={doc.id} className="border border-border rounded-lg p-4 hover:bg-surface-hover transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-6 w-6 text-primary" />
                            <div>
                              <h3 className="font-medium text-text capitalize">
                                {doc.type.replace('_', ' ')}
                              </h3>
                              <p className="text-sm text-text-secondary">{doc.filename}</p>
                            </div>
                          </div>

                          <a
                            href={`/api/portail/${token}/document/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mes Émargements */}
            {activeTab === 'emargements' && (
              <div className="p-6">
                <h2 className="text-2xl font-heading font-bold text-text mb-6">Mes Émargements</h2>

                {data.emargements.length === 0 ? (
                  <div className="text-center py-8">
                    <PenTool className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">Aucun émargement disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.emargements.map((emargement) => (
                      <div key={emargement.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-text">
                              {formatDate(emargement.date)} - {emargement.creneau.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">
                              {emargement.signed_at
                                ? `Signé le ${new Date(emargement.signed_at).toLocaleString('fr-FR')}`
                                : 'Non signé'}
                            </p>
                          </div>

                          <div className="flex items-center space-x-3">
                            {emargement.signed_at ? (
                              <CheckCircle className="h-6 w-6 text-success" />
                            ) : (
                              <a
                                href={`/api/portail/${token}/emargement/${emargement.id}/sign`}
                                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                              >
                                Signer
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mon Évaluation */}
            {activeTab === 'evaluation' && (
              <div className="p-6">
                <h2 className="text-2xl font-heading font-bold text-text mb-6">Mon Évaluation</h2>

                {!isFormationCompleted() ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">
                      L'évaluation sera disponible à la fin de votre formation
                    </p>
                  </div>
                ) : (
                  <div className="max-w-2xl space-y-6">
                    {/* Note satisfaction */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-3">
                        Quelle note donneriez-vous à cette formation ? *
                      </label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEvaluation({ ...evaluation, note: star })}
                            className="p-1 transition-colors"
                          >
                            <StarIcon
                              className={`h-8 w-8 ${
                                star <= evaluation.note
                                  ? 'fill-warning text-warning'
                                  : 'text-border hover:text-warning'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recommandation */}
                    <div>
                      <label className="block text-sm font-medium text-text mb-3">
                        Recommanderiez-vous cette formation ? *
                      </label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setEvaluation({ ...evaluation, recommanderait: true })}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            evaluation.recommanderait === true
                              ? 'bg-success text-white border-success'
                              : 'border-border hover:bg-surface-hover'
                          }`}
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setEvaluation({ ...evaluation, recommanderait: false })}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            evaluation.recommanderait === false
                              ? 'bg-error text-white border-error'
                              : 'border-border hover:bg-surface-hover'
                          }`}
                        >
                          Non
                        </button>
                      </div>
                    </div>

                    {/* Points forts */}
                    <div>
                      <label htmlFor="points-forts" className="block text-sm font-medium text-text mb-2">
                        Points forts de la formation
                      </label>
                      <textarea
                        id="points-forts"
                        rows={3}
                        value={evaluation.points_forts}
                        onChange={(e) => setEvaluation({ ...evaluation, points_forts: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Qu'avez-vous le plus apprécié ?"
                      />
                    </div>

                    {/* Points amélioration */}
                    <div>
                      <label htmlFor="points-amelioration" className="block text-sm font-medium text-text mb-2">
                        Points d'amélioration
                      </label>
                      <textarea
                        id="points-amelioration"
                        rows={3}
                        value={evaluation.points_amelioration}
                        onChange={(e) => setEvaluation({ ...evaluation, points_amelioration: e.target.value })}
                        className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Que pourrait-on améliorer selon vous ?"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      onClick={submitEvaluation}
                      disabled={submittingEval || evaluation.note === 0 || evaluation.recommanderait === null}
                      className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {submittingEval && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>Enregistrer mon évaluation</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mes Factures */}
            {activeTab === 'factures' && (
              <div className="p-6">
                <h2 className="text-2xl font-heading font-bold text-text mb-6">Mes Factures</h2>

                {data.factures.length === 0 ? (
                  <div className="text-center py-8">
                    <Euro className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">Aucune facture disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.factures.map((facture) => (
                      <div key={facture.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-text capitalize">
                              {facture.type} {facture.numero_facture}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">
                              Émise le {new Date(facture.created_at).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-lg font-semibold text-text mt-2">
                              {formatAmount(facture.total_ttc)}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              facture.statut === 'PAYEE'
                                ? 'bg-success/10 text-success'
                                : facture.statut === 'EN_RETARD'
                                ? 'bg-error/10 text-error'
                                : 'bg-warning/10 text-warning'
                            }`}>
                              {facture.statut.replace('_', ' ').toLowerCase()}
                            </span>

                            <div className="mt-2">
                              <a
                                href={`/api/portail/${token}/facture/${facture.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 text-primary hover:underline text-sm"
                              >
                                <Download className="h-4 w-4" />
                                <span>Télécharger</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}