'use client'

import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { useState, useCallback } from 'react'
import { StarRating } from './StarRating'
import type { AnalyzedCompetitor } from '@/lib/competitor/analyzer'

interface CompetitorMapProps {
  center: { lat: number; lng: number }
  competitors: AnalyzedCompetitor[]
  prospectName?: string
  onMarkerClick?: (competitor: AnalyzedCompetitor) => void
}

const mapContainerStyle = { width: '100%', height: '400px', borderRadius: '12px' }

function getMarkerColor(score: number): string {
  if (score >= 70) return 'var(--color-success)'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

export function CompetitorMap({ center, competitors, prospectName, onMarkerClick }: CompetitorMapProps) {
  const [selected, setSelected] = useState<AnalyzedCompetitor | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    const bounds = new google.maps.LatLngBounds()
    bounds.extend(center)
    competitors.forEach(c => bounds.extend({ lat: c.lat, lng: c.lng }))
    map.fitBounds(bounds, 50)
  }, [center, competitors])

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] rounded-xl bg-[#F4F0EB] animate-pulse flex items-center justify-center text-[#999999]">
        Chargement de la carte...
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={14}
      onLoad={onMapLoad}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      }}
    >
      {/* Marker Dermotec (bleu, plus gros) */}
      <Marker
        position={center}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: 'var(--color-primary)',
          fillOpacity: 1,
          strokeColor: 'var(--color-accent)',
          strokeWeight: 3,
        }}
        title={prospectName || 'Dermotec'}
        zIndex={1000}
      />

      {/* Markers concurrents */}
      {competitors.map((comp, idx) => (
        <Marker
          key={comp.siret || idx}
          position={{ lat: comp.lat, lng: comp.lng }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: getMarkerColor(comp.reputationScore),
            fillOpacity: 0.9,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          }}
          title={comp.nom}
          onClick={() => {
            setSelected(comp)
            onMarkerClick?.(comp)
          }}
          label={{
            text: String(comp.rank || idx + 1),
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: 'bold',
          }}
        />
      ))}

      {/* InfoWindow */}
      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div className="p-1 min-w-[180px]">
            <p className="font-semibold text-sm text-accent mb-1">{selected.nom}</p>
            {selected.googleRating && (
              <StarRating rating={selected.googleRating} reviewsCount={selected.googleReviewsCount} size={10} />
            )}
            <div className="flex items-center justify-between mt-1.5 text-xs text-[#777777]">
              <span>{selected.distanceM}m</span>
              {selected.chiffreAffaires && (
                <span className="font-medium text-[#10B981]">
                  {(selected.chiffreAffaires / 1000).toFixed(0)}K€
                </span>
              )}
              <span className="font-bold" style={{ color: getMarkerColor(selected.reputationScore) }}>
                {selected.reputationScore}/100
              </span>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
