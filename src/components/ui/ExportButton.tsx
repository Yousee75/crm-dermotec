'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { exportToCSV, exportToPDF, type ColumnDef } from '@/lib/export-data'
import { useCurrentUser } from '@/hooks/use-current-user'
import { cn } from '@/lib/utils'

interface ExportButtonProps {
  data: any[]
  columns: ColumnDef[]
  filename: string // sans extension
  title?: string // pour le PDF
  disabled?: boolean
}

export function ExportButton({ data, columns, filename, title, disabled }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<'csv' | 'pdf' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: currentUser } = useCurrentUser()

  // Fermer le dropdown au clic exterieur
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleExportCSV = async () => {
    if (!data.length) {
      toast.error('Aucune donnée à exporter')
      return
    }
    setLoading('csv')
    try {
      exportToCSV(data, columns, filename, currentUser?.equipe_id || undefined)
      toast.success(`${data.length} lignes exportées en CSV`)
    } catch {
      toast.error("Erreur lors de l'export CSV")
    } finally {
      setLoading(null)
      setOpen(false)
    }
  }

  const handleExportPDF = async () => {
    if (!data.length) {
      toast.error('Aucune donnée à exporter')
      return
    }
    setLoading('pdf')
    try {
      const pdfTitle = title || filename
      const userName = currentUser
        ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || currentUser.email
        : undefined
      await exportToPDF(data, columns, pdfTitle, filename, userName)
      toast.success(`${data.length} lignes exportées en PDF`)
    } catch {
      toast.error("Erreur lors de l'export PDF")
    } finally {
      setLoading(null)
      setOpen(false)
    }
  }

  const isLoading = loading !== null

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        icon={
          isLoading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Download className="w-3.5 h-3.5" />
        }
        disabled={disabled || isLoading || !data.length}
        onClick={() => setOpen(prev => !prev)}
      >
        Export
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white rounded-lg border border-gray-200 shadow-lg py-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={handleExportCSV}
            disabled={loading === 'csv'}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700',
              'hover:bg-gray-50 transition-colors disabled:opacity-50'
            )}
          >
            {loading === 'csv' ? (
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
            )}
            CSV (.csv)
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading === 'pdf'}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700',
              'hover:bg-gray-50 transition-colors disabled:opacity-50'
            )}
          >
            {loading === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
            ) : (
              <FileText className="w-4 h-4 text-red-500" />
            )}
            PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  )
}
