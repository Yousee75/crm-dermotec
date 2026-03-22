'use client'

import { useState, useCallback } from 'react'
import { Upload, Download, Image as ImageIcon } from 'lucide-react'

export function ImageCompressor() {
  const [original, setOriginal] = useState<File | null>(null)
  const [compressed, setCompressed] = useState<Blob | null>(null)
  const [quality, setQuality] = useState(0.7)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<{ before: number; after: number } | null>(null)

  const compress = useCallback(async (file: File, q: number) => {
    setLoading(true)
    try {
      const { default: imageCompression } = await import('browser-image-compression')
      const result = await imageCompression(file, {
        maxSizeMB: file.size / 1024 / 1024 * q,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        initialQuality: q,
      })
      setCompressed(result)
      setStats({ before: file.size, after: result.size })
    } catch (err) {
      console.error('Compression error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOriginal(file)
    compress(file, quality)
  }

  const handleQualityChange = (q: number) => {
    setQuality(q)
    if (original) compress(original, q)
  }

  const download = () => {
    if (!compressed || !original) return
    const url = URL.createObjectURL(compressed)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed_${original.name}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Upload */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#2EC6F3] rounded-xl p-8 cursor-pointer transition-colors">
        <Upload size={32} className="text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 font-medium">Choisir une image</p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (max 20 MB)</p>
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>

      {/* Quality slider */}
      {original && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qualité : {Math.round(quality * 100)}%
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={quality}
            onChange={e => handleQualityChange(Number(e.target.value))}
            className="w-full accent-[#2EC6F3]"
          />
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <ImageIcon size={16} className="mx-auto text-red-400 mb-1" />
            <p className="text-sm font-mono font-bold text-red-600">{formatSize(stats.before)}</p>
            <p className="text-xs text-red-400">Avant</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <ImageIcon size={16} className="mx-auto text-green-400 mb-1" />
            <p className="text-sm font-mono font-bold text-green-600">{formatSize(stats.after)}</p>
            <p className="text-xs text-green-400">Après</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-sm font-mono font-bold text-blue-600 mt-3">
              -{Math.round((1 - stats.after / stats.before) * 100)}%
            </p>
            <p className="text-xs text-blue-400">Réduction</p>
          </div>
        </div>
      )}

      {/* Download */}
      {compressed && (
        <button
          onClick={download}
          disabled={loading}
          className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={16} />
          Télécharger l&apos;image compressée
        </button>
      )}

      {loading && (
        <p className="text-center text-sm text-gray-400 animate-pulse">Compression en cours...</p>
      )}
    </div>
  )
}
