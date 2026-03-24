'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Star, Scissors, MapPin, Wallet, Zap,
  ChevronRight, Building2, Users, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IntelligenceComplete } from '@/lib/enrichment-proxy'

interface EnrichmentTabsProps {
  leadId: string
}

const tabs = [
  { id: 'reputation', label: 'Réputation', icon: Star },
  { id: 'soins', label: 'Soins', icon: Scissors },
  { id: 'zone', label: 'Zone', icon: MapPin },
  { id: 'financement', label: 'Financement', icon: Wallet },
  { id: 'signaux', label: 'Signaux', icon: Zap },
]

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percentage = Math.min((value / max) * 100, 100)
  const isGood = percentage > 80
  return (
    <div className="w-full h-2 bg-[#EEEEEE] rounded-full overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          isGood ? "bg-primary" : "bg-[#999999]"
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

function Badge({ variant = 'default', children }: {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
}) {
  const variants = {
    default: 'bg-surface-hover text-[#777777] border-[#EEEEEE]',
    success: 'bg-success-50 text-success border-success/20',
    warning: 'bg-warning-50 text-warning border-warning/20',
    error: 'bg-error-50 text-error border-error/20',
    info: 'bg-info-50 text-info border-info/20',
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
      variants[variant]
    )}>
      {children}
    </span>
  )
}

export function EnrichmentTabs({ leadId }: EnrichmentTabsProps) {
  const [activeTab, setActiveTab] = useState('reputation')

  // Charger les données intelligence depuis l'API enrichment/intelligence
  const { data: intelligenceResponse, isLoading } = useQuery({
    queryKey: ['intelligence-data', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/enrichment/intelligence?leadId=${leadId}`)
      if (!res.ok) return null
      const json = await res.json()
      return json
    },
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#EEEEEE] p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-[#EEEEEE] rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-[#EEEEEE] rounded"></div>
        </div>
      </div>
    )
  }

  if (!intelligenceResponse?.intelligence) {
    return (
      <div className="bg-surface-hover rounded-xl p-4 text-center">
        <Zap className="w-6 h-6 text-[#999999] mx-auto mb-2" />
        <p className="text-sm text-[#777777]">Aucune donnée enrichie disponible</p>
        <p className="text-xs text-[#999999] mt-1">
          {intelligenceResponse?.message || 'Lancez l\'enrichissement depuis le briefing IA'}
        </p>
      </div>
    )
  }

  const intelligence = intelligenceResponse.intelligence as IntelligenceComplete

  return (
    <div className="bg-white rounded-xl border border-[#EEEEEE] overflow-hidden">
      {/* Header avec onglets */}
      <div className="border-b border-[#EEEEEE]">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all',
                  'min-w-0 touch-none', // Touch target
                  isActive
                    ? 'border-primary text-primary bg-primary-50'
                    : 'border-transparent text-[#777777] hover:text-[#3A3A3A] hover:border-[#EEEEEE]'
                )}
                style={{ minHeight: '44px' }} // Touch target
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="p-4">
        {/* Onglet Réputation */}
        {activeTab === 'reputation' && (
          <div className="space-y-4">
            {intelligence.plateformes_avis && intelligence.plateformes_avis.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold text-[#111111]">Réputation multi-plateformes</h3>

                {/* Tableau des plateformes */}
                <div className="space-y-2">
                  {intelligence.plateformes_avis.map((plateforme, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-sm font-medium text-[#111111]">{plateforme.plateforme}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#111111]">
                            {plateforme.note ? `${plateforme.note}/5` : '—'}
                          </div>
                          <div className="text-xs text-[#777777]">
                            {plateforme.nb_avis ? `${plateforme.nb_avis} avis` : '0 avis'}
                          </div>
                        </div>
                        {plateforme.note && (
                          <div className="w-16">
                            <ProgressBar value={plateforme.note} max={5} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Synthèse globale */}
                {intelligence.reputation && (
                  <div className="bg-primary-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#111111]">Note pondérée globale</span>
                      <span className="text-lg font-bold text-primary">
                        {intelligence.reputation.note_globale ? `${intelligence.reputation.note_globale.toFixed(1)}/5` : '—'}
                      </span>
                    </div>
                    {intelligence.reputation.nb_avis_total && (
                      <p className="text-xs text-[#777777] mt-1">
                        Basé sur {intelligence.reputation.nb_avis_total} avis total
                      </p>
                    )}
                  </div>
                )}

                {/* Badge avis insuffisants */}
                {intelligence.signaux?.avis_insuffisants && (
                  <Badge variant="warning">{"Peu d'avis en ligne (< 10)"}</Badge>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Star className="w-8 h-8 text-[#999999] mx-auto mb-2" />
                <p className="text-sm text-[#777777]">Aucune donnée de réputation</p>
              </div>
            )}
          </div>
        )}

        {/* Onglet Soins */}
        {activeTab === 'soins' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#111111]">
              {intelligence.carte_soins?.length ? `${intelligence.carte_soins.length} soins détectés` : 'Soins proposés'}
            </h3>

            {intelligence.carte_soins && intelligence.carte_soins.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {intelligence.carte_soins.map((soin, index) => (
                  <Badge key={index} variant="default">
                    {soin}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Scissors className="w-8 h-8 text-[#999999] mx-auto mb-2" />
                <p className="text-sm text-[#777777]">Aucun soin détecté sur les plateformes</p>
              </div>
            )}
          </div>
        )}

        {/* Onglet Zone */}
        {activeTab === 'zone' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#111111]">Environnement local</h3>

            {/* Concurrents zone */}
            {intelligence.concurrents_zone && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#3A3A3A]">Concurrents proximité</span>
                  <Badge variant="info">
                    {intelligence.concurrents_zone.length} établissements dans 2km
                  </Badge>
                </div>

                {intelligence.concurrents_zone.slice(0, 5).map((concurrent, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-[#F4F0EB] last:border-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#999999]" />
                      <span className="text-sm text-[#111111]">{concurrent.nom || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#777777]">
                      <span className="capitalize">{concurrent.type}</span>
                      {concurrent.distance_metres && (
                        <>
                          <span>•</span>
                          <span>{Math.round(concurrent.distance_metres)}m</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Standing et revenu */}
            <div className="grid grid-cols-2 gap-4">
              {intelligence.zone?.standing && (
                <div>
                  <span className="text-xs text-[#777777] uppercase tracking-wider">Standing</span>
                  <Badge variant={intelligence.zone.standing === 'premium' ? 'success' : 'default'}>
                    {intelligence.zone.standing.replace('_', ' ')}
                  </Badge>
                </div>
              )}

              {intelligence.zone?.revenu_median_quartier && (
                <div>
                  <span className="text-xs text-[#777777] uppercase tracking-wider">Revenu médian</span>
                  <p className="text-sm font-semibold text-[#111111]">
                    {intelligence.zone.revenu_median_quartier.toLocaleString()}€
                  </p>
                </div>
              )}
            </div>

            {/* Signal zone saturée */}
            {intelligence.signaux?.zone_saturee && (
              <Badge variant="warning">Zone satur&eacute;e (&gt; 10 beauty shops)</Badge>
            )}
          </div>
        )}

        {/* Onglet Financement */}
        {activeTab === 'financement' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#111111]">Options de financement</h3>

            {/* Convention collective */}
            {intelligence.convention_collective && (
              <div className="bg-surface-hover rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#777777] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#111111]">
                      IDCC {intelligence.convention_collective.code_convention} — {intelligence.convention_collective.intitule}
                    </p>
                    <p className="text-xs text-[#777777] mt-1">
                      {intelligence.convention_collective.droit_formation_heures}h/an de formation
                    </p>
                    {intelligence.convention_collective.est_secteur_beaute && (
                      <Badge variant="success">Secteur beauté</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Aides disponibles */}
            {intelligence.aides_disponibles && intelligence.aides_disponibles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#3A3A3A] mb-2">Aides disponibles</p>
                <div className="space-y-2">
                  {intelligence.aides_disponibles.map((aide, index) => (
                    <div key={index} className="bg-white border border-[#EEEEEE] rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#111111]">{aide.nom}</p>
                          <p className="text-xs text-[#777777]">{aide.financeur}</p>
                        </div>
                        <div className="text-right">
                          {aide.montant_max && (
                            <p className="text-sm font-semibold text-[#10B981]">
                              Max {aide.montant_max.toLocaleString()}€
                            </p>
                          )}
                          <Badge variant="default">{aide.type}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signal droits formation */}
            {intelligence.signaux?.droits_formation_non_consommes && (
              <Badge variant="success">Droits formation disponibles</Badge>
            )}
          </div>
        )}

        {/* Onglet Signaux */}
        {activeTab === 'signaux' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#111111]">Signaux commerciaux</h3>

            {intelligence.signaux ? (
              <div className="space-y-2">
                {intelligence.signaux.est_sur_promo && (
                  <Badge variant="warning">
                    Sur plateforme promo — prospect chaud
                  </Badge>
                )}

                {intelligence.signaux.est_organisme_concurrent && (
                  <Badge variant="error">
                    Concurrent organisme de formation
                  </Badge>
                )}

                {intelligence.signaux.en_difficulte && (
                  <Badge variant="error">
                    Difficulté financière détectée
                  </Badge>
                )}

                {intelligence.signaux.avis_insuffisants && (
                  <Badge variant="warning">
                    {"Peu d'avis en ligne (< 10)"}
                  </Badge>
                )}

                {intelligence.signaux.zone_saturee && (
                  <Badge variant="warning">
                    {"Zone saturée (> 10 beauty shops)"}
                  </Badge>
                )}

                {intelligence.signaux.droits_formation_non_consommes && (
                  <Badge variant="success">
                    Droits formation disponibles
                  </Badge>
                )}

                {/* Si aucun signal actif */}
                {!Object.values(intelligence.signaux).some(Boolean) && (
                  <div className="text-center py-4">
                    <p className="text-sm text-[#777777]">Aucun signal particulier détecté</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Zap className="w-8 h-8 text-[#999999] mx-auto mb-2" />
                <p className="text-sm text-[#777777]">Aucun signal disponible</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}