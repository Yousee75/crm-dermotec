'use client'

import { useState } from 'react'
import { Upload, Download, FileText, X, ArrowUpDown } from 'lucide-react'

export function PdfMerger() {
  const [files, setFiles] = useState<File[]>([])
  const [merging, setMerging] = useState(false)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf')
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const moveFile = (from: number, to: number) => {
    setFiles(prev => {
      const copy = [...prev]
      const [item] = copy.splice(from, 1)
      copy.splice(to, 0, item)
      return copy
    })
  }

  const merge = async () => {
    if (files.length < 2) return
    setMerging(true)

    try {
      const { PDFDocument } = await import('pdf-lib')
      const mergedPdf = await PDFDocument.create()

      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const pdf = await PDFDocument.load(bytes)
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
      }

      const mergedBytes = await mergedPdf.save()
      const blob = new Blob([mergedBytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'merged.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF merge error:', err)
    } finally {
      setMerging(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#F0F0F0] hover:border-primary rounded-xl p-6 cursor-pointer transition-colors">
        <Upload size={28} className="text-[#999999] mb-2" />
        <p className="text-sm text-[#777777] font-medium">Ajouter des fichiers PDF</p>
        <p className="text-xs text-[#999999] mt-1">Glissez ou cliquez pour sélectionner</p>
        <input type="file" accept=".pdf" multiple onChange={handleFiles} className="hidden" />
      </label>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#3A3A3A]">{files.length} fichier(s)</p>
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center gap-2 bg-[#FAFAFA] rounded-lg px-3 py-2">
              <FileText size={16} className="text-[#FF2D78] shrink-0" />
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <span className="text-xs text-[#999999] shrink-0">{formatSize(file.size)}</span>
              {i > 0 && (
                <button onClick={() => moveFile(i, i - 1)} className="p-1 hover:bg-[#EEEEEE] rounded">
                  <ArrowUpDown size={12} className="text-[#999999]" />
                </button>
              )}
              <button onClick={() => removeFile(i)} className="p-1 hover:bg-[#FFE0EF] rounded">
                <X size={14} className="text-[#FF2D78]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Merge button */}
      {files.length >= 2 && (
        <button
          onClick={merge}
          disabled={merging}
          className="w-full bg-error hover:bg-error disabled:opacity-50 text-white rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={16} />
          {merging ? 'Fusion en cours...' : `Fusionner ${files.length} PDF`}
        </button>
      )}
    </div>
  )
}
