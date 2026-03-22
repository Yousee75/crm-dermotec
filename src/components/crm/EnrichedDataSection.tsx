'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Building2, Globe, Star, MapPin, Instagram, Facebook,
  ChevronDown, ChevronUp, Users, Calendar, Briefcase,
  Phone, Link, Clock, TrendingUp, Sparkles, Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldWithSource, type FieldSourceInfo } from './FieldWithSource'

interface EnrichedDataSectionProps {
  leadId: string
  enrichmentData?: any // enrichment_data depuis prospect_reports
  onFieldUpdate?: (field: string, value: string, source: string) => void
}

function CollapsibleBlock({ icon, title, children, defaultOpen = false, badge }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full px-3 py-2 hover:bg-gray-50 transition">
        <div className="flex items-center gap-2">
          <span className="text-primary [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
          <span className="text-xs font-semibold text-accent">{title}</span>
          {badge && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
      </button>
      {open && <div className="px-3 pb-3 pt-1 border-t border-gray-50">{children}</div>}
    </div>
  )
}

export function EnrichedDataSection({ leadId, enrichmentData: propData, onFieldUpdate }: EnrichedDataSectionProps) {
  // Charger les données enrichies depuis le dernier rapport
  const { data: reportData } = useQuery({
    queryKey: ['enriched-data', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/enrichment/report?leadId=${leadId}&version=latest`)
      if (!res.ok) return null
      const json = await res.json()
      return json.report?.enrichment_data || null
    },
    enabled: !propData,
  })

  const e = propData || reportData || {}

  const makeSource = (src: string, date?: string): FieldSourceInfo => ({
    source: src as any,
    updated_by: 'system',
    at: date || new Date().toISOString(),
  })

  const hasSirene = !!e.sirene
  const hasPappers = !!e.pappers
  const hasGoogle = !!e.google
  const hasSocial = !!e.social
  const hasQuartier = !!e.quartier
  const hasReviews = !!e.reviews
  const totalSources = [hasSirene, hasPappers, hasGoogle, hasSocial, hasQuartier, hasReviews].filter(Boolean).length

  if (totalSources === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <Database className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-500">Aucune donnée enrichie</p>
        <p className="text-[10px] text-gray-400 mt-1">Lancez le pipeline d'enrichissement depuis le briefing IA</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-accent">Données Enrichies</h3>
          <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-medium">{totalSources} sources</span>
        </div>
      </div>

      {/* ── ENTREPRISE (Sirene + Pappers) ── */}
      {(hasSirene || hasPappers) && (
        <CollapsibleBlock icon={<Building2 />} title="Entreprise" defaultOpen={true} badge={hasPappers ? 'Pappers' : 'Sirene'}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <FieldWithSource label="Raison sociale" value={e.sirene?.nom} source={makeSource('api:sirene')} onSave={v => onFieldUpdate?.('entreprise_nom', v, 'manual')} compact />
            <FieldWithSource label="SIRET" value={e.sirene?.siret} source={makeSource('api:sirene')} editable={false} compact />
            <FieldWithSource label="Code NAF" value={e.sirene?.code_naf} source={makeSource('api:sirene')} editable={false} compact />
            <FieldWithSource label="Forme juridique" value={e.pappers?.formeJuridique || e.sirene?.forme_juridique} source={makeSource(hasPappers ? 'api:pappers' : 'api:sirene')} editable={false} compact />
            {e.pappers?.chiffreAffaires !== undefined && (
              <FieldWithSource label="Chiffre d'affaires" value={e.pappers.chiffreAffaires ? `${Math.round(e.pappers.chiffreAffaires / 1000)} K€` : 'N/A'} source={makeSource('api:pappers')} editable={false} compact />
            )}
            {e.pappers?.effectif !== undefined && (
              <FieldWithSource label="Effectif" value={e.pappers.effectif ? `${e.pappers.effectif} salarié(s)` : 'N/A'} source={makeSource('api:pappers')} editable={false} compact />
            )}
            {e.pappers?.capitalSocial !== undefined && (
              <FieldWithSource label="Capital social" value={e.pappers.capitalSocial ? `${e.pappers.capitalSocial} €` : 'N/A'} source={makeSource('api:pappers')} editable={false} compact />
            )}
            {e.pappers?.dateCreation && (
              <FieldWithSource label="Date création" value={e.pappers.dateCreation} source={makeSource('api:pappers')} editable={false} compact />
            )}
            {e.sirene?.adresse && (
              <FieldWithSource label="Adresse" value={`${e.sirene.adresse}, ${e.sirene.code_postal} ${e.sirene.ville}`} source={makeSource('api:sirene')} compact className="col-span-2" onSave={v => onFieldUpdate?.('adresse', v, 'manual')} />
            )}
            {e.opco && (
              <FieldWithSource label="OPCO" value={e.opco} source={makeSource('api:sirene')} editable={false} compact />
            )}
          </div>

          {/* Dirigeants */}
          {e.pappers?.dirigeants && e.pappers.dirigeants.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Dirigeant(s)</p>
              {e.pappers.dirigeants.map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-700">{d.nom}</span>
                  <span className="text-[10px] text-gray-400">— {d.fonction}</span>
                </div>
              ))}
            </div>
          )}

          {/* Statut entreprise */}
          {e.sirene && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', e.sirene.is_active ? 'bg-emerald-500' : 'bg-red-500')} />
              <span className={cn('text-[11px] font-medium', e.sirene.is_active ? 'text-emerald-700' : 'text-red-700')}>
                {e.sirene.is_active ? 'Établissement actif' : 'Établissement fermé'}
              </span>
            </div>
          )}
        </CollapsibleBlock>
      )}

      {/* ── RÉPUTATION (Google) ── */}
      {hasGoogle && (
        <CollapsibleBlock icon={<Star />} title="Réputation" defaultOpen={true} badge={`${e.google.rating || '—'}/5`}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <FieldWithSource label="Note Google" value={e.google.rating ? `${e.google.rating}/5` : 'N/A'} source={makeSource(e.reviews?.placeData ? 'api:outscraper' : 'api:google')} editable={false} compact />
            <FieldWithSource label="Nombre d'avis" value={e.google.reviewsCount} source={makeSource(e.reviews?.placeData ? 'api:outscraper' : 'api:google')} editable={false} compact />
            {e.google.telephone && (
              <FieldWithSource label="Téléphone Google" value={e.google.telephone} source={makeSource('api:google')} onSave={v => onFieldUpdate?.('telephone', v, 'manual')} compact />
            )}
            {e.google.website && (
              <FieldWithSource label="Site web" value={e.google.website} source={makeSource('api:google')} onSave={v => onFieldUpdate?.('website', v, 'manual')} compact />
            )}
            {e.google.photos > 0 && (
              <FieldWithSource label="Photos Google" value={`${e.google.photos} photos`} source={makeSource('api:google')} editable={false} compact />
            )}
          </div>

          {/* Types d'établissement Outscraper */}
          {e.reviews?.placeData?.subtypes && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Catégories</p>
              <div className="flex flex-wrap gap-1">
                {e.reviews.placeData.subtypes.map((t: string, i: number) => (
                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Horaires Outscraper */}
          {e.reviews?.placeData?.working_hours && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Horaires</p>
              <div className="grid grid-cols-2 gap-0.5">
                {Object.entries(e.reviews.placeData.working_hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between text-[10px]">
                    <span className="text-gray-500">{day}</span>
                    <span className="text-gray-700">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description Outscraper */}
          {e.reviews?.placeData?.description && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Description Google</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">{e.reviews.placeData.description}</p>
            </div>
          )}
        </CollapsibleBlock>
      )}

      {/* ── PRÉSENCE DIGITALE (Social) ── */}
      {hasSocial && (
        <CollapsibleBlock icon={<Globe />} title="Présence Digitale" badge={[e.social?.website && 'Site', e.social?.instagram && 'IG', e.social?.facebook && 'FB'].filter(Boolean).join(' + ')}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {e.social?.website && (
              <FieldWithSource label="Site web" value={e.social.website} source={makeSource('api:google')} onSave={v => onFieldUpdate?.('website', v, 'manual')} compact className="col-span-2" />
            )}
            {e.social?.instagram && (
              <FieldWithSource label="Instagram" value={`@${e.social.instagram.username}`} source={makeSource('api:outscraper')} editable={false} compact
                displayValue={`@${e.social.instagram.username}${e.social.instagram.followers ? ` (${e.social.instagram.followers} abonnés)` : ''}`} />
            )}
            {e.social?.facebook && (
              <FieldWithSource label="Facebook" value={e.social.facebook.url || 'Présent'} source={makeSource('api:outscraper')} editable={false} compact />
            )}
            {e.social?.linkedin && (
              <FieldWithSource label="LinkedIn" value={e.social.linkedin.url || 'Présent'} source={makeSource('api:outscraper')} editable={false} compact />
            )}
          </div>
        </CollapsibleBlock>
      )}

      {/* ── QUARTIER ── */}
      {hasQuartier && (
        <CollapsibleBlock icon={<MapPin />} title="Environnement Local" badge={`Trafic ${e.quartier.footTrafficScore}/100`}>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[
              { icon: '🚇', value: e.quartier.metros, label: 'Métros' },
              { icon: '🍽', value: e.quartier.restaurants, label: 'Restos' },
              { icon: '💅', value: e.quartier.concurrentsBeaute, label: 'Beauté' },
              { icon: '💊', value: e.quartier.pharmacies, label: 'Pharma' },
            ].map((item, i) => (
              <div key={i} className="text-center bg-gray-50 rounded-lg p-2">
                <span className="text-sm">{item.icon}</span>
                <p className="text-xs font-bold text-accent">{item.value}</p>
                <p className="text-[9px] text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
          {/* Barre trafic */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500">Trafic piéton</span>
              <span className={cn('text-[10px] font-bold', e.quartier.footTrafficScore >= 60 ? 'text-emerald-600' : e.quartier.footTrafficScore >= 30 ? 'text-amber-600' : 'text-red-600')}>
                {e.quartier.footTrafficScore}/100
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${e.quartier.footTrafficScore}%`,
                  backgroundColor: e.quartier.footTrafficScore >= 60 ? '#10B981' : e.quartier.footTrafficScore >= 30 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>
          </div>
        </CollapsibleBlock>
      )}
    </div>
  )
}
