'use client'

import { use } from 'react'
import { useLead, useUpdateLead } from '@/hooks/use-leads'
import { STATUTS_LEAD, ORGANISMES_FINANCEMENT } from '@/types'
import {
  ArrowLeft, Phone, Mail, MessageCircle, MapPin,
  GraduationCap, CreditCard, Calendar, FileText,
  Star, Clock, Edit3, Save
} from 'lucide-react'
import Link from 'next/link'
import { formatEuro, formatDate, formatPhone } from '@/lib/utils'

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: lead, isLoading } = useLead(id)

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>
  }

  if (!lead) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Lead introuvable</div>
  }

  const statut = STATUTS_LEAD[lead.statut]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#082545]" style={{ fontFamily: 'var(--font-heading)' }}>
                {lead.civilite} {lead.prenom} {lead.nom}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: statut.color }}>
                {statut.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                Score: {lead.score_chaud}/100
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {lead.statut_pro ? lead.statut_pro.replace('_', ' ') : 'Profil non renseigné'}
              {lead.objectif_pro && ` · ${lead.objectif_pro}`}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          {lead.telephone && (
            <a href={`tel:${lead.telephone}`} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition">
              <Phone className="w-4 h-4" /> Appeler
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition">
              <Mail className="w-4 h-4" /> Email
            </a>
          )}
          {lead.whatsapp && (
            <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identité */}
          <Section title="Identité" icon={<FileText className="w-4 h-4" />}>
            <InfoGrid items={[
              { label: 'Email', value: lead.email },
              { label: 'Téléphone', value: lead.telephone ? formatPhone(lead.telephone) : undefined },
              { label: 'WhatsApp', value: lead.whatsapp },
              { label: 'Nationalité', value: lead.nationalite },
              { label: 'Date de naissance', value: lead.date_naissance },
              { label: 'Adresse', value: lead.adresse?.rue ? `${lead.adresse.rue}, ${lead.adresse.code_postal} ${lead.adresse.ville}` : undefined },
            ]} />
          </Section>

          {/* Profil professionnel */}
          <Section title="Profil professionnel" icon={<GraduationCap className="w-4 h-4" />}>
            <InfoGrid items={[
              { label: 'Statut', value: lead.statut_pro?.replace('_', ' ') },
              { label: 'Expérience', value: lead.experience_esthetique },
              { label: 'Années', value: lead.experience_annees?.toString() },
              { label: 'Entreprise', value: lead.entreprise_nom },
              { label: 'SIRET', value: lead.siret },
              { label: 'Employeur', value: lead.employeur_nom },
              { label: 'Objectif', value: lead.objectif_pro },
            ]} />
          </Section>

          {/* Formations */}
          <Section title="Formations" icon={<Star className="w-4 h-4" />}>
            {lead.formation_principale ? (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">{lead.formation_principale.nom}</p>
                <p className="text-sm text-blue-600">{lead.formation_principale.categorie} · {formatEuro(lead.formation_principale.prix_ht)} HT</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucune formation sélectionnée</p>
            )}
          </Section>

          {/* Inscriptions */}
          {lead.inscriptions && lead.inscriptions.length > 0 && (
            <Section title="Inscriptions" icon={<Calendar className="w-4 h-4" />}>
              <div className="space-y-3">
                {lead.inscriptions.map((insc) => (
                  <div key={insc.id} className="p-3 border border-gray-100 rounded-lg">
                    <div className="flex justify-between">
                      <p className="font-medium">{insc.session?.formation?.nom}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{insc.statut}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatEuro(insc.montant_total)} · Paiement: {insc.paiement_statut}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Notes */}
          <Section title="Notes" icon={<Edit3 className="w-4 h-4" />}>
            {lead.notes_lead && lead.notes_lead.length > 0 ? (
              <div className="space-y-3">
                {lead.notes_lead.map((note) => (
                  <div key={note.id} className="p-3 border-l-2 border-[#2EC6F3] bg-gray-50 rounded-r-lg">
                    <p className="text-sm">{note.contenu}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {note.type} · {formatDate(note.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucune note</p>
            )}
          </Section>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-6">
          {/* Infos commerciales */}
          <Section title="Commercial" icon={<CreditCard className="w-4 h-4" />}>
            <InfoGrid items={[
              { label: 'Source', value: lead.source.replace('_', ' ') },
              { label: 'Sujet', value: lead.sujet },
              { label: 'Priorité', value: lead.priorite },
              { label: 'Contacts', value: lead.nb_contacts.toString() },
              { label: 'Premier contact', value: lead.date_premier_contact ? formatDate(lead.date_premier_contact) : undefined },
              { label: 'Dernier contact', value: lead.date_dernier_contact ? formatDate(lead.date_dernier_contact) : undefined },
              { label: 'Prochain rappel', value: lead.date_prochain_rappel ? formatDate(lead.date_prochain_rappel) : undefined },
              { label: 'Commercial', value: lead.commercial_assigne ? `${lead.commercial_assigne.prenom} ${lead.commercial_assigne.nom}` : undefined },
            ]} />
          </Section>

          {/* Financement */}
          <Section title="Financement" icon={<CreditCard className="w-4 h-4" />}>
            {lead.financement_souhaite ? (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">Financement souhaité</p>
                {lead.organisme_financement && (
                  <p className="text-sm text-gray-600">{lead.organisme_financement}</p>
                )}
                {lead.financements && lead.financements.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {lead.financements.map((f) => (
                      <div key={f.id} className="p-2 bg-gray-50 rounded text-xs">
                        <p className="font-medium">{f.organisme} — {f.statut}</p>
                        {f.montant_demande && <p>{formatEuro(f.montant_demande)} demandé</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Pas de financement demandé</p>
            )}
          </Section>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <Section title="Tags" icon={<Star className="w-4 h-4" />}>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{tag}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Message original */}
          {lead.message && (
            <Section title="Message original" icon={<Mail className="w-4 h-4" />}>
              <p className="text-sm text-gray-600 italic">&ldquo;{lead.message}&rdquo;</p>
            </Section>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Créé le {formatDate(lead.created_at)}</p>
            <p>Modifié le {formatDate(lead.updated_at)}</p>
            {lead.utm_source && <p>UTM: {lead.utm_source} / {lead.utm_medium} / {lead.utm_campaign}</p>}
          </div>
        </div>
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

function InfoGrid({ items }: { items: { label: string; value?: string }[] }) {
  const filtered = items.filter(i => i.value)
  if (filtered.length === 0) return <p className="text-sm text-gray-400">Non renseigné</p>
  return (
    <div className="grid grid-cols-2 gap-3">
      {filtered.map((item) => (
        <div key={item.label}>
          <p className="text-xs text-gray-400">{item.label}</p>
          <p className="text-sm font-medium text-gray-700 mt-0.5">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
