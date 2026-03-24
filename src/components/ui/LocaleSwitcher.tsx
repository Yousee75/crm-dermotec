'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { locales, localeNames, type Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'

// ============================================================
// Drapeaux SVG inline — identiques sur tous les navigateurs
// ============================================================

function FlagFR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className}>
      <rect width="213.3" height="480" fill="#002654" />
      <rect x="213.3" width="213.4" height="480" fill="#fff" />
      <rect x="426.7" width="213.3" height="480" fill="#CE1126" />
    </svg>
  )
}

function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className}>
      <path fill="#012169" d="M0 0h640v480H0z" />
      <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" />
      <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" />
      <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z" />
      <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" />
    </svg>
  )
}

function FlagES({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className}>
      <rect width="640" height="480" fill="#AA151B" />
      <rect y="120" width="640" height="240" fill="#F1BF00" />
    </svg>
  )
}

function FlagIL({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className}>
      <rect width="640" height="480" fill="#fff" />
      <rect y="53" width="640" height="50" fill="#0038b8" />
      <rect y="377" width="640" height="50" fill="#0038b8" />
      <path fill="none" stroke="#0038b8" strokeWidth="24" d="M320 164l-62 108h124z M320 316l62-108H258z" />
    </svg>
  )
}

function FlagCN({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className}>
      <rect width="640" height="480" fill="#EE1C25" />
      <g fill="#FF0" transform="translate(96 160) scale(48)">
        <polygon points="0,-1 .59,.81 -.95,-.31 .95,-.31 -.59,.81" />
      </g>
      <g fill="#FF0" transform="translate(192 80) scale(16)">
        <polygon points="0,-1 .59,.81 -.95,-.31 .95,-.31 -.59,.81" />
      </g>
      <g fill="#FF0" transform="translate(224 128) scale(16)">
        <polygon points="0,-1 .59,.81 -.95,-.31 .95,-.31 -.59,.81" />
      </g>
      <g fill="#FF0" transform="translate(224 192) scale(16)">
        <polygon points="0,-1 .59,.81 -.95,-.31 .95,-.31 -.59,.81" />
      </g>
      <g fill="#FF0" transform="translate(192 240) scale(16)">
        <polygon points="0,-1 .59,.81 -.95,-.31 .95,-.31 -.59,.81" />
      </g>
    </svg>
  )
}

const FLAG_COMPONENTS: Record<Locale, React.FC<{ className?: string }>> = {
  fr: FlagFR,
  en: FlagGB,
  es: FlagES,
  he: FlagIL,
  zh: FlagCN,
}

// ============================================================
// LocaleSwitcher
// ============================================================

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function switchLocale(newLocale: Locale) {
    const segments = (pathname ?? '').split('/')
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale === 'fr' ? '' : newLocale
    } else if (newLocale !== 'fr') {
      segments.splice(1, 0, newLocale)
    }
    const newPath = segments.filter(Boolean).join('/') || '/'
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
    router.push(`/${newPath}`)
    setOpen(false)
  }

  const CurrentFlag = FLAG_COMPONENTS[locale]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-lg transition-all',
          compact
            ? 'p-2 hover:bg-[#F4F0EB]'
            : 'px-3 py-1.5 text-sm border border-[#EEEEEE] hover:bg-[#FAF8F5]'
        )}
        title="Changer de langue"
      >
        {compact ? (
          <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shadow-sm ring-1 ring-black/10">
            <CurrentFlag className="w-full h-full" />
          </div>
        ) : (
          <>
            <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shadow-sm ring-1 ring-black/10">
              <CurrentFlag className="w-full h-full" />
            </div>
            <span className="text-sm text-[#3A3A3A] hidden sm:inline">{localeNames[locale]}</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 end-0 z-50 bg-white rounded-xl border border-[#EEEEEE] shadow-xl py-1.5 min-w-[200px]"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          <div className="px-3 py-1.5 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999999]">Langue / Language</p>
          </div>
          {locales.map((l) => {
            const Flag = FLAG_COMPONENTS[l]
            const isActive = l === locale
            return (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-start',
                  isActive
                    ? 'bg-[#E0EBF5]/80'
                    : 'hover:bg-[#FAF8F5]'
                )}
              >
                <div className="w-6 h-4 rounded-[3px] overflow-hidden shadow-sm ring-1 ring-black/10 flex-shrink-0">
                  <Flag className="w-full h-full" />
                </div>
                <span className={cn('flex-1', isActive ? 'text-[#6B8CAE] font-medium' : 'text-[#3A3A3A]')}>
                  {localeNames[l]}
                </span>
                {isActive && <Check className="w-4 h-4 text-[#6B8CAE]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
