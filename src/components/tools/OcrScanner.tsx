'use client'

import { useState, useCallback } from 'react'
import { Upload, FileImage, Type, Copy, Loader2 } from 'lucide-react'

export function OcrScanner() {
  const [image, setImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [extractedText, setExtractedText] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [copied, setCopied] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(f => f.type.startsWith('image/'))
    if (imageFile) {
      setImage(imageFile)
      setImageUrl(URL.createObjectURL(imageFile))
      setExtractedText('')
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setImageUrl(URL.createObjectURL(file))
      setExtractedText('')
    }
  }, [])

  const extractText = useCallback(async () => {
    if (!image) return

    setLoading(true)
    setProgress(0)

    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('fra', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })

      const { data: { text } } = await worker.recognize(image)
      setExtractedText(text.trim())
      await worker.terminate()
    } catch (error) {
      console.error('OCR Error:', error)
      setExtractedText('Erreur lors de l\'extraction du texte. Veuillez réessayer.')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }, [image])

  const copyText = useCallback(async () => {
    if (!extractedText) return

    try {
      await navigator.clipboard.writeText(extractedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }, [extractedText])

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors"
      >
        {image ? (
          <div className="space-y-4">
            <img
              src={imageUrl}
              alt="Image à analyser"
              className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
            />
            <p className="text-sm text-gray-600">{image.name}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <FileImage className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">Glissez une image ici</p>
              <p className="text-gray-500">ou cliquez pour sélectionner</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              Choisir une image
            </label>
          </div>
        )}
      </div>

      {/* Extract Button */}
      {image && (
        <div className="text-center">
          <button
            onClick={extractText}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extraction... {progress}%
              </>
            ) : (
              <>
                <Type className="w-4 h-4" />
                Extraire le texte
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {loading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Result */}
      {extractedText && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Texte extrait</h3>
            <button
              onClick={copyText}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <textarea
            value={extractedText}
            onChange={e => setExtractedText(e.target.value)}
            className="w-full h-64 p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Le texte extrait apparaîtra ici..."
          />
        </div>
      )}
    </div>
  )
}