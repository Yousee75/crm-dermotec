'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type EmailTemplate } from '@/types'
import {
  Bold, Italic, Link2, Variable, Save, SendHorizonal,
  X, Eye, Code2, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Variables disponibles
// ---------------------------------------------------------------------------
const AVAILABLE_VARIABLES = [
  { key: '{prenom}', label: 'Prenom', icon: 'U' },
  { key: '{nom}', label: 'Nom', icon: 'U' },
  { key: '{email}', label: 'Email', icon: '@' },
  { key: '{formation}', label: 'Formation', icon: 'F' },
  { key: '{date_session}', label: 'Date session', icon: 'D' },
  { key: '{formatrice}', label: 'Formatrice', icon: 'F' },
  { key: '{montant}', label: 'Montant', icon: 'E' },
  { key: '{lien_portail}', label: 'Lien portail', icon: 'L' },
  { key: '{lien_paiement}', label: 'Lien paiement', icon: 'L' },
  { key: '{entreprise}', label: 'Entreprise', icon: 'E' },
] as const

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const CATEGORIES: { value: EmailTemplate['categorie']; label: string }[] = [
  { value: 'relance', label: 'Relance' },
  { value: 'confirmation', label: 'Confirmation' },
  { value: 'convocation', label: 'Convocation' },
  { value: 'rappel', label: 'Rappel' },
  { value: 'bienvenue', label: 'Bienvenue' },
  { value: 'satisfaction', label: 'Satisfaction' },
  { value: 'financement', label: 'Financement' },
  { value: 'certificat', label: 'Certificat' },
  { value: 'eshop', label: 'E-shop' },
  { value: 'autre', label: 'Autre' },
]

// ---------------------------------------------------------------------------
// 8 templates pre-definis
// ---------------------------------------------------------------------------
export const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'created_at'>[] = [
  {
    nom: 'Relance lead nouveau',
    slug: 'relance_nouveau',
    sujet: 'Bonjour {prenom}, votre projet formation vous attend !',
    contenu_html: `<p>Bonjour <strong>{prenom}</strong>,</p>
<p>Nous avons bien recu votre demande concernant la formation <strong>{formation}</strong>.</p>
<p>Avez-vous des questions ? Notre equipe est disponible pour vous accompagner dans votre projet.</p>
<p>N'hesitez pas a nous repondre directement ou a consulter votre <a href="{lien_portail}">espace personnel</a>.</p>
<p>A bientot,<br/>L'equipe Dermotec Advanced</p>`,
    variables: ['prenom', 'formation', 'lien_portail'],
    categorie: 'relance',
    is_active: true,
  },
  {
    nom: 'Confirmation inscription',
    slug: 'confirmation_inscription',
    sujet: 'Inscription confirmee - {formation}',
    contenu_html: `<p>Bonjour <strong>{prenom} {nom}</strong>,</p>
<p>Votre inscription a la formation <strong>{formation}</strong> est confirmee !</p>
<ul>
  <li><strong>Date :</strong> {date_session}</li>
  <li><strong>Formatrice :</strong> {formatrice}</li>
  <li><strong>Montant :</strong> {montant}</li>
</ul>
<p>Retrouvez tous les details sur votre <a href="{lien_portail}">portail stagiaire</a>.</p>
<p>A tres bientot,<br/>L'equipe Dermotec Advanced</p>`,
    variables: ['prenom', 'nom', 'formation', 'date_session', 'formatrice', 'montant', 'lien_portail'],
    categorie: 'confirmation',
    is_active: true,
  },
  {
    nom: 'Convocation session (J-7)',
    slug: 'convocation',
    sujet: 'Convocation - {formation} le {date_session}',
    contenu_html: `<p>Bonjour <strong>{prenom}</strong>,</p>
<p>Votre formation <strong>{formation}</strong> aura lieu dans 7 jours :</p>
<ul>
  <li><strong>Date :</strong> {date_session}</li>
  <li><strong>Formatrice :</strong> {formatrice}</li>
  <li><strong>Lieu :</strong> 75 Bd Richard Lenoir, 75011 Paris</li>
</ul>
<p>Merci de confirmer votre presence en repondant a cet email.</p>
<p>Cordialement,<br/>L'equipe Dermotec Advanced</p>`,
    variables: ['prenom', 'formation', 'date_session', 'formatrice'],
    categorie: 'convocation',
    is_active: true,
  },
  {
    nom: 'Rappel session (J-1)',
    slug: 'rappel_session',
    sujet: "C'est demain ! - {formation}",
    contenu_html: `<p>Bonjour <strong>{prenom}</strong>,</p>
<p>Un petit rappel : votre formation <strong>{formation}</strong> a lieu <strong>demain</strong> !</p>
<ul>
  <li><strong>Date :</strong> {date_session}</li>
  <li><strong>Horaire :</strong> 9h00 - 17h00</li>
  <li><strong>Formatrice :</strong> {formatrice}</li>
  <li><strong>Adresse :</strong> 75 Bd Richard Lenoir, 75011 Paris</li>
</ul>
<p>Pensez a apporter une piece d'identite.</p>
<p>A demain !<br/>L'equipe Dermotec Advanced</p>`,
    variables: ['prenom', 'formation', 'date_session', 'formatrice'],
    categorie: 'rappel',
    is_active: true,
  },
  {
    nom: 'Bienvenue jour de formation',
    slug: 'bienvenue_formation',
    sujet: 'Bienvenue a votre formation {formation} !',
    contenu_html: `<p>Bonjour <strong>{prenom}</strong>,</p>
<p>Bienvenue a la formation <strong>{formation}</strong> !</p>
<p>Votre formatrice <strong>{formatrice}</strong> vous accueille aujourd'hui.</p>
<p>Votre espace stagiaire est accessible ici : <a href="{lien_portail}">Portail stagiaire</a></p>
<p>Excellente journee de formation !<br/>L'equipe Dermotec Advanced</p>`,
    variables: ['prenom', 'formation', 'formatrice', 'lien_portail'],
    categorie: 'bienvenue',
    is_active: true,
  },
  {
    nom: 'Suivi post-formation (J+3)',
    slug: 'suivi_post_formation',
    sujet: '{prenom}, comment s\'est passee votre formation ?',
    contenu_html: `<p>Bonjour <strong>{prenom}</strong>,</p>
<p>Nous esperons que votre formation <strong>{formation}</strong> s'est bien passee !</p>
<p>Votre certificat et vos documents sont disponibles sur votre <a href="{lien_portail}">portail stagiaire</a>.</p>
<p>Si vous avez des questions sur la mise en pratique, n'hesitez pas a nous contacter.</p>
<p>A bientot,<br/>L'equipe Dermotec Advanced</p>`,
    variables: ['prenom', 'formation', 'lien_portail'],
    categorie: 'satisfaction',
    is_active: true,
  },
  {
    nom: 'Demande avis Google (J+7)',
    slug: 'demande_avis',
    sujet: '{prenom}, votre avis compte pour nous !',
    contenu_html: `<p>Bonjour <strong>{prenom}</strong>,</p>
<p>Votre formation <strong>{formation}</strong> est terminee depuis une semaine.</p>
<p>Votre retour d'experience est precieux. Pourriez-vous nous laisser un avis sur Google ?</p>
<p>Cela ne prend que 2 minutes et aide d'autres professionnelles a decouvrir nos formations.</p>
<p>Merci infiniment !<br/>L'equipe Dermotec Advanced</p>`,
    variables: ['prenom', 'formation'],
    categorie: 'satisfaction',
    is_active: true,
  },
  {
    nom: 'Relance dossier financement',
    slug: 'relance_financement',
    sujet: 'Des nouvelles de votre dossier de financement, {prenom} ?',
    contenu_html: `<p>Bonjour <strong>{prenom}</strong>,</p>
<p>Nous revenons vers vous concernant votre dossier de financement pour la formation <strong>{formation}</strong>.</p>
<p>Ou en etes-vous ? Notre equipe peut vous aider a completer votre dossier et accelerer le processus.</p>
<p>Montant de la formation : <strong>{montant}</strong></p>
<p>N'hesitez pas a nous contacter pour toute question.</p>
<p>Cordialement,<br/>L'equipe Dermotec Advanced</p>`,
    variables: ['prenom', 'formation', 'montant'],
    categorie: 'financement',
    is_active: true,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function replaceVariables(html: string): string {
  const sampleData: Record<string, string> = {
    '{prenom}': 'Marie',
    '{nom}': 'Dupont',
    '{email}': 'marie.dupont@email.com',
    '{formation}': 'Microneedling Avance',
    '{date_session}': '15 avril 2026',
    '{formatrice}': 'Dr. Sophie Martin',
    '{montant}': '1 200,00 EUR',
    '{lien_portail}': '#',
    '{lien_paiement}': '#',
    '{entreprise}': 'Institut Beaute Paris',
  }
  let result = html
  for (const [key, value] of Object.entries(sampleData)) {
    result = result.replaceAll(key, `<span style="background:#dbeafe;padding:1px 4px;border-radius:3px;font-weight:600;color:#1d4ed8">${value}</span>`)
  }
  return result
}

function extractVariablesFromBody(body: string): string[] {
  const matches = body.match(/\{(\w+)\}/g) || []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface EmailTemplateEditorProps {
  template?: EmailTemplate | null
  onClose: () => void
  onSaved?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EmailTemplateEditor({ template, onClose, onSaved }: EmailTemplateEditorProps) {
  const isNew = !template?.id
  const supabase = createClient()
  const queryClient = useQueryClient()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [nom, setNom] = useState(template?.nom || '')
  const [sujet, setSujet] = useState(template?.sujet || '')
  const [corps, setCorps] = useState(template?.contenu_html || '')
  const [categorie, setCategorie] = useState<EmailTemplate['categorie']>(template?.categorie || 'autre')
  const [showVariables, setShowVariables] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  // Reset form when template changes
  useEffect(() => {
    setNom(template?.nom || '')
    setSujet(template?.sujet || '')
    setCorps(template?.contenu_html || '')
    setCategorie(template?.categorie || 'autre')
  }, [template])

  // Generate slug from nom
  const slug = useMemo(() => {
    if (template?.slug) return template.slug
    return nom
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  }, [nom, template?.slug])

  // Insert text at cursor position in textarea
  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = corps.slice(0, start)
    const after = corps.slice(end)
    const newValue = before + text + after
    setCorps(newValue)
    // Restore cursor position
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + text.length
    })
  }, [corps])

  // Toolbar actions
  const wrapSelection = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = corps.slice(start, end)
    const replacement = `${before}${selected || 'texte'}${after}`
    const newValue = corps.slice(0, start) + replacement + corps.slice(end)
    setCorps(newValue)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = start + before.length + (selected.length || 5)
    })
  }, [corps])

  // Preview HTML
  const previewHtml = useMemo(() => {
    const replaced = replaceVariables(corps)
    return `
      <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1f2937;line-height:1.6;font-size:14px;">
        <div style="border-bottom:3px solid #FF5C00;padding-bottom:16px;margin-bottom:24px;">
          <strong style="color:#1A1A1A;font-size:18px;">Dermotec Advanced</strong>
        </div>
        ${replaced}
        <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:32px;font-size:12px;color:#9ca3af;">
          <p>Dermotec Advanced | 75 Bd Richard Lenoir, 75011 Paris</p>
          <p>01 XX XX XX XX | contact@dermotec.fr</p>
        </div>
      </div>
    `
  }, [corps])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const variables = extractVariablesFromBody(corps)
      const payload = {
        nom,
        slug,
        sujet,
        contenu_html: corps,
        variables,
        categorie,
        is_active: template?.is_active ?? true,
        updated_at: new Date().toISOString(),
      }

      if (isNew) {
        const { error } = await supabase
          .from('email_templates')
          .insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('email_templates')
          .update(payload)
          .eq('id', template!.id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success(isNew ? 'Template cree avec succes' : 'Template mis a jour')
      onSaved?.()
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  })

  // Send test mutation
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@dermotec.fr',
          subject: `[TEST] ${sujet}`,
          html: corps,
          template_slug: slug,
        }),
      })
      if (!res.ok) throw new Error('Erreur envoi')
    },
    onSuccess: () => toast.success('Email de test envoye'),
    onError: () => toast.error("Erreur lors de l'envoi du test"),
  })

  const isValid = nom.trim() && sujet.trim() && corps.trim()

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-accent">
            {isNew ? 'Nouveau template' : 'Modifier le template'}
          </h2>
          <Badge variant="primary" size="sm">{categorie}</Badge>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 -m-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Name + Subject */}
      <div className="px-6 py-4 border-b border-gray-50 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Nom du template"
            value={nom}
            onChange={e => setNom(e.target.value)}
            placeholder="Ex: Relance lead nouveau"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Categorie</label>
            <select
              value={categorie}
              onChange={e => setCategorie(e.target.value as EmailTemplate['categorie'])}
              className="w-full rounded-lg border border-gray-200 bg-white text-sm px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Sujet de l'email"
          value={sujet}
          onChange={e => setSujet(e.target.value)}
          placeholder="Ex: Bonjour {prenom}, votre formation vous attend !"
          hint="Utilisez les variables entre accolades : {prenom}, {formation}, etc."
        />
      </div>

      {/* Variables bar */}
      <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition"
          >
            <Variable className="w-3.5 h-3.5" />
            Variables
            <ChevronDown className={cn('w-3 h-3 transition-transform', showVariables && 'rotate-180')} />
          </button>
          {showVariables && AVAILABLE_VARIABLES.map(v => (
            <button
              key={v.key}
              onClick={() => insertAtCursor(v.key)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition"
            >
              {v.key}
            </button>
          ))}
          {!showVariables && (
            <span className="text-xs text-gray-400">
              Cliquez pour afficher les 10 variables disponibles
            </span>
          )}
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Editor (60%) */}
        <div className="w-[60%] flex flex-col border-r border-gray-100">
          {/* Toolbar */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-gray-50/50">
            <button
              onClick={() => wrapSelection('<strong>', '</strong>')}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition"
              title="Gras"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => wrapSelection('<em>', '</em>')}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition"
              title="Italique"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => wrapSelection('<a href="', '">lien</a>')}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition"
              title="Lien"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={() => insertAtCursor('<p></p>')}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition text-xs font-mono"
              title="Paragraphe"
            >
              {'<p>'}
            </button>
            <button
              onClick={() => insertAtCursor('<br/>')}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition text-xs font-mono"
              title="Saut de ligne"
            >
              {'<br>'}
            </button>
            <button
              onClick={() => insertAtCursor('<ul>\n  <li></li>\n</ul>')}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition text-xs font-mono"
              title="Liste"
            >
              {'<ul>'}
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={corps}
            onChange={e => setCorps(e.target.value)}
            placeholder="Ecrivez le contenu HTML de votre email ici..."
            className="flex-1 w-full resize-none p-4 text-sm font-mono text-gray-800 bg-white focus:outline-none placeholder:text-gray-400 leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Right: Preview (40%) */}
        <div className="w-[40%] flex flex-col bg-gray-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Apercu</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={cn(
                  'px-2 py-1 text-xs rounded transition',
                  previewMode === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Desktop
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={cn(
                  'px-2 py-1 text-xs rounded transition',
                  previewMode === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Mobile
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className={cn(
              'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mx-auto',
              previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
            )}>
              {/* Email subject preview */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-gray-500">Sujet</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {replaceVariables(sujet).replace(/<[^>]+>/g, '')}
                </p>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                className="email-preview"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
        <div className="text-xs text-gray-400">
          {extractVariablesFromBody(corps).length} variable(s) detectee(s)
          {slug && <span className="ml-3">Slug: <code className="bg-gray-100 px-1 rounded">{slug}</code></span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendTestMutation.mutate()}
            loading={sendTestMutation.isPending}
            disabled={!isValid}
            icon={<SendHorizonal className="w-4 h-4" />}
          >
            Envoyer un test
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!isValid}
            icon={<Save className="w-4 h-4" />}
          >
            Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  )
}
