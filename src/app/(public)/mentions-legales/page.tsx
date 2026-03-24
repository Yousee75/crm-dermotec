export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/Badge'
import { Building, MapPin, Phone, Mail, Shield, Globe, Users, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mentions légales — Dermotec Advanced',
  description: 'Transparence totale sur qui nous sommes et comment nous fonctionnons. Centre de formation esthétique certifié Qualiopi à Paris.',
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              Mis à jour mars 2026
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-accent font-[family-name:var(--font-heading)] mb-4">
            Mentions légales
          </h1>
          <p className="text-lg text-[#777777] max-w-2xl mx-auto">
            Transparence, c&apos;est notre engagement. Voici tout ce que vous devez savoir sur qui nous sommes et comment nous fonctionnons.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Qui sommes-nous */}
          <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)]">
                Qui sommes-nous
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#777777]">Raison sociale</p>
                  <p className="text-[#111111] font-medium">SAS Dermotec</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#777777]">SIRET</p>
                  <p className="text-[#111111] font-mono">851 306 860 00012</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#777777]">Capital social</p>
                  <p className="text-[#111111]">1 000 €</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#777777]">TVA intracommunautaire</p>
                  <p className="text-[#111111] font-mono">FR26851306860</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#777777]">Code APE</p>
                  <p className="text-[#111111]">4775Z (Commerce de parfumerie et cosmétiques)</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#777777]">NDA formation</p>
                  <p className="text-[#111111] font-mono">11755959875</p>
                  <p className="text-xs text-[#777777]">Ne vaut pas agrément de l&apos;État</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#777777]">Certification</p>
                  <p className="text-[#111111] font-medium text-primary">Qualiopi</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#777777]">Directeur de publication</p>
                  <p className="text-[#111111]">M. Bryan Houri</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-6 pt-6 border-t border-[#F4F0EB]">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-[#111111] font-medium">75 Boulevard Richard Lenoir</p>
                    <p className="text-[#777777]">75011 Paris</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <p className="text-[#111111] font-medium">01 88 33 43 43</p>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <a href="mailto:dermotec.fr@gmail.com" className="text-primary hover:underline font-medium">
                    dermotec.fr@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Hébergement & Données */}
          <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)]">
                Hébergement & Données
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-[#111111] mb-3">Application web</h3>
                <div className="space-y-2">
                  <p className="text-[#777777]"><strong>Hébergeur :</strong> Vercel Inc.</p>
                  <p className="text-[#777777]">440 N Barranca Ave #4133</p>
                  <p className="text-[#777777]">Covina, CA 91723, USA</p>
                  <a href="https://vercel.com" target="_blank" rel="noopener noreferrer"
                     className="text-primary hover:underline text-sm">
                    vercel.com ↗
                  </a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[#111111] mb-3">Base de données</h3>
                <div className="space-y-2">
                  <p className="text-[#777777]"><strong>Hébergeur :</strong> Supabase Inc.</p>
                  <p className="text-[#777777]"><strong>Localisation :</strong> Union Européenne (Francfort)</p>
                  <p className="text-[#777777]"><strong>Conformité :</strong> RGPD</p>
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer"
                     className="text-primary hover:underline text-sm">
                    supabase.com ↗
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-[#3A3A3A]">
                <Shield className="w-4 h-4 text-primary inline mr-2" />
                Vos données personnelles sont stockées exclusivement dans l&apos;Union Européenne et protégées par le RGPD.
              </p>
            </div>
          </div>

          {/* Propriété intellectuelle */}
          <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)]">
                Propriété intellectuelle
              </h2>
            </div>

            <div className="space-y-4 text-[#777777]">
              <p>
                Tous les contenus de ce site sont protégés par le Code de la propriété intellectuelle.
                Cela inclut les textes, images, logos, design et fonctionnalités.
              </p>
              <p>
                Toute reproduction sans autorisation écrite préalable est interdite.
                Pour toute demande d&apos;utilisation, contactez-nous.
              </p>
            </div>
          </div>

          {/* Données personnelles */}
          <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)]">
                Données personnelles
              </h2>
            </div>

            <div className="space-y-4 text-[#777777]">
              <p>
                Nous prenons la protection de vos données très au sérieux.
                Toutes les informations sur la collecte et le traitement sont détaillées dans notre politique dédiée.
              </p>
              <div className="flex items-center gap-3 p-4 bg-[#FAF8F5] rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-[#3A3A3A]">Pour tout savoir sur vos droits et nos pratiques : </span>
                <a href="/politique-confidentialite" className="text-primary hover:underline font-medium">
                  Politique de confidentialité →
                </a>
              </div>
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-accent font-[family-name:var(--font-heading)]">
                Cookies
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-[#ECFDF5] rounded-lg border border-[#10B981]/30">
                  <h3 className="font-semibold text-[#10B981] mb-2">Cookies essentiels</h3>
                  <p className="text-[#10B981] text-sm">
                    Nécessaires au fonctionnement : authentification, session, sécurité.
                    Pas besoin de consentement.
                  </p>
                </div>
                <div className="p-4 bg-[#E0EBF5] rounded-lg border border-[#6B8CAE]/30">
                  <h3 className="font-semibold text-[#6B8CAE] mb-2">Cookies analytiques</h3>
                  <p className="text-[#6B8CAE] text-sm">
                    Vercel Analytics pour améliorer l&apos;expérience.
                    Données anonymisées, pas de tracking personnel.
                  </p>
                </div>
              </div>
              <p className="text-[#777777] text-sm">
                Nous n&apos;utilisons aucun cookie publicitaire ou de tracking personnel.
                Plus de détails dans notre{' '}
                <a href="/politique-confidentialite" className="text-primary hover:underline">
                  politique de confidentialité
                </a>.
              </p>
            </div>
          </div>

          {/* Footer Une question ? */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl text-white p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)]">
                Une question ?
              </h2>
            </div>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Notre équipe est là pour répondre à toutes vos questions juridiques ou techniques.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="mailto:dermotec.fr@gmail.com"
                 className="flex items-center gap-2 bg-white text-accent px-6 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors">
                <Mail className="w-4 h-4" />
                Nous contacter
              </a>
              <a href="tel:0188334343"
                 className="flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
                <Phone className="w-4 h-4" />
                01 88 33 43 43
              </a>
            </div>
          </div>

          {/* Droit applicable */}
          <div className="text-center text-[#777777] text-sm">
            <p>
              Mentions légales régies par le droit français •
              Tribunaux de Paris compétents en cas de litige •
              Dernière mise à jour : mars 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
