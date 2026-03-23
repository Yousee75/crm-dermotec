'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { type EmailTemplate } from '@/types'
import {
  Mail, Plus, Edit2, Copy, ToggleLeft, ToggleRight,
  Eye, Search, Filter, ArrowLeft, Trash2, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import EmailTemplateEditor, { DEFAULT_TEMPLATES } from '@/components/emails/EmailTemplateEditor'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Couleurs par categorie
// ---------------------------------------------------------------------------
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  relance:      { label: 'Relance',      color: '#F59E0B', bgColor: '#FEF3C7' },
  confirmation: { label: 'Confirmation', color: '#22C55E', bgColor: '#DCFCE7' },
  convocation:  { label: 'Convocation',  color: '#3B82F6', bgColor: '#DBEAFE' },
  rappel:       { label: 'Rappel',       color: '#FF2D78', bgColor: '#EDE9FE' },
  bienvenue:    { label: 'Bienvenue',    color: '#FF5C00', bgColor: '#E0F7FF' },
  satisfaction: { label: 'Satisfaction',  color: '#EC4899', bgColor: '#FCE7F3' },
  financement:  { label: 'Financement',  color: '#F97316', bgColor: '#FFF7ED' },
  certificat:   { label: 'Certificat',   color: '#14B8A6', bgColor: '#CCFBF1' },
  eshop:        { label: 'E-shop',       color: '#FF2D78', bgColor: '#E0E7FF' },
  autre:        { label: 'Autre',        color: '#6B7280', bgColor: '#F3F4F6' },
}

function getCategoryConfig(cat: string) {
  return CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.autre
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EmailTemplatesPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // State
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Query
  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('categorie')
        .order('nom')
      if (error) throw error
      return data as EmailTemplate[]
    },
  })

  // Toggle active
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success('Statut mis a jour')
    },
    onError: () => toast.error('Erreur lors de la mise a jour'),
  })

  // Duplicate
  const duplicateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          nom: `${template.nom} (copie)`,
          slug: `${template.slug}_copie_${Date.now()}`,
          sujet: template.sujet,
          contenu_html: template.contenu_html,
          contenu_text: template.contenu_text,
          variables: template.variables,
          categorie: template.categorie,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success('Template duplique')
    },
    onError: () => toast.error('Erreur lors de la duplication'),
  })

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success('Template supprime')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  // Seed defaults
  const seedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('email_templates')
        .upsert(
          DEFAULT_TEMPLATES.map(t => ({
            ...t,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'slug' }
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast.success('8 templates par defaut charges')
    },
    onError: () => toast.error('Erreur lors du chargement'),
  })

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    if (!templates) return []
    return templates.filter(t => {
      const matchesSearch = !search ||
        t.nom.toLowerCase().includes(search.toLowerCase()) ||
        t.sujet.toLowerCase().includes(search.toLowerCase()) ||
        t.categorie.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !filterCategory || t.categorie === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [templates, search, filterCategory])

  // Stats
  const stats = useMemo(() => {
    if (!templates) return { total: 0, active: 0, inactive: 0 }
    return {
      total: templates.length,
      active: templates.filter(t => t.is_active).length,
      inactive: templates.filter(t => !t.is_active).length,
    }
  }, [templates])

  // Categories presentes
  const categoriesPresent = useMemo(() => {
    if (!templates) return []
    return [...new Set(templates.map(t => t.categorie))].sort()
  }, [templates])

  // Handlers
  function handleNew() {
    setSelectedTemplate(null)
    setEditorOpen(true)
  }

  function handleEdit(template: EmailTemplate) {
    setSelectedTemplate(template)
    setEditorOpen(true)
  }

  function handleEditorClose() {
    setEditorOpen(false)
    setSelectedTemplate(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates Email"
        description="Gerez vos modeles d'emails pour les communications automatisees"
      >
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
        <Button variant="primary" size="sm" onClick={handleNew}>
          <Plus className="w-4 h-4 mr-1" />
          Nouveau template
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Actifs', value: stats.active, color: 'text-green-600' },
          { label: 'Inactifs', value: stats.inactive, color: 'text-gray-400' },
        ].map(s => (
          <Card key={s.label} padding="sm">
            <div className="text-center">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + Filter + Seed */}
      <Card padding="sm">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchInput
              placeholder="Rechercher un template..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              icon={<Filter className="w-4 h-4" />}
            >
              {filterCategory ? getCategoryConfig(filterCategory).label : 'Categorie'}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => { setFilterCategory(null); setShowFilterMenu(false) }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition',
                    !filterCategory && 'font-medium text-primary'
                  )}
                >
                  Toutes les categories
                </button>
                {categoriesPresent.map(cat => {
                  const config = getCategoryConfig(cat)
                  return (
                    <button
                      key={cat}
                      onClick={() => { setFilterCategory(cat); setShowFilterMenu(false) }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition flex items-center gap-2',
                        filterCategory === cat && 'font-medium text-primary'
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seed button if empty */}
          {templates && templates.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedMutation.mutate()}
              loading={seedMutation.isPending}
            >
              Charger les 8 templates
            </Button>
          )}
        </div>
      </Card>

      {/* Template list */}
      {isLoading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Chargement des templates...</p>
          </div>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {search || filterCategory ? 'Aucun template trouve' : 'Aucun template email'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {search || filterCategory
                ? 'Modifiez vos filtres pour voir plus de resultats.'
                : 'Commencez par creer votre premier template ou chargez les modeles par defaut.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="primary" size="sm" onClick={handleNew}>
                <Plus className="w-4 h-4 mr-1" />
                Creer un template
              </Button>
              {!search && !filterCategory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seedMutation.mutate()}
                  loading={seedMutation.isPending}
                >
                  Charger les 8 templates par defaut
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map(template => {
            const catConfig = getCategoryConfig(template.categorie)
            return (
              <Card key={template.id} padding="none" hover>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-semibold text-gray-900 truncate">{template.nom}</h4>
                        <Badge
                          variant="custom"
                          size="sm"
                          dot
                          color={catConfig.color}
                          bgColor={catConfig.bgColor}
                        >
                          {catConfig.label}
                        </Badge>
                        {template.is_active ? (
                          <Badge variant="success" size="xs">Actif</Badge>
                        ) : (
                          <Badge variant="default" size="xs">Inactif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 truncate">{template.sujet}</p>
                      {template.variables && template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 6).map(v => (
                            <code
                              key={v}
                              className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded font-mono"
                            >
                              {`{${v}}`}
                            </code>
                          ))}
                          {template.variables.length > 6 && (
                            <span className="text-[10px] text-gray-400">
                              +{template.variables.length - 6}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Apercu"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editer"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Dupliquer"
                        onClick={() => duplicateMutation.mutate(template)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: template.id, is_active: !template.is_active })}
                        className={cn(
                          'p-2 rounded-lg transition',
                          template.is_active
                            ? 'text-green-500 hover:bg-green-50'
                            : 'text-gray-300 hover:bg-gray-50'
                        )}
                        title={template.is_active ? 'Desactiver' : 'Activer'}
                      >
                        {template.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Supprimer"
                        onClick={() => {
                          if (confirm('Supprimer ce template ?')) {
                            deleteMutation.mutate(template.id)
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Editor Dialog (full-width) */}
      <Dialog
        open={editorOpen}
        onClose={handleEditorClose}
        size="xl"
        className="!max-w-6xl !p-0 overflow-hidden"
      >
        <EmailTemplateEditor
          template={selectedTemplate}
          onClose={handleEditorClose}
          onSaved={handleEditorClose}
        />
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        size="xl"
      >
        {previewTemplate && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-accent">{previewTemplate.nom}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{previewTemplate.sujet}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setPreviewTemplate(null)
                handleEdit(previewTemplate)
              }}>
                <Edit2 className="w-4 h-4 mr-1" />
                Editer
              </Button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div
                className="p-6"
                dangerouslySetInnerHTML={{
                  __html: `
                    <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;line-height:1.6;font-size:14px;">
                      <div style="border-bottom:3px solid #FF5C00;padding-bottom:12px;margin-bottom:20px;">
                        <strong style="color:#1A1A1A;font-size:16px;">Dermotec Advanced</strong>
                      </div>
                      ${previewTemplate.contenu_html}
                      <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:24px;font-size:11px;color:#9ca3af;">
                        <p>Dermotec Advanced | 75 Bd Richard Lenoir, 75011 Paris</p>
                      </div>
                    </div>
                  `
                }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-1">
              {previewTemplate.variables?.map(v => (
                <code key={v} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded font-mono">
                  {`{${v}}`}
                </code>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
