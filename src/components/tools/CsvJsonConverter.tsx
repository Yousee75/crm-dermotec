'use client'

import { useState, useCallback } from 'react'
import { ArrowLeftRight, Copy, Download, FileText, Braces } from 'lucide-react'

type ConvertDirection = 'csv-to-json' | 'json-to-csv'

export function CsvJsonConverter() {
  const [direction, setDirection] = useState<ConvertDirection>('csv-to-json')
  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string>('')

  const toggleDirection = useCallback(() => {
    setDirection(prev => prev === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json')
    setInput('')
    setOutput('')
    setError('')
  }, [])

  const convert = useCallback(async () => {
    if (!input.trim()) return

    setError('')

    try {
      const Papa = await import('papaparse')

      if (direction === 'csv-to-json') {
        const result = Papa.default.parse(input, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim()
        })

        if (result.errors.length > 0) {
          setError(`Erreur CSV: ${result.errors[0].message}`)
          return
        }

        setOutput(JSON.stringify(result.data, null, 2))
      } else {
        const jsonData = JSON.parse(input)

        if (!Array.isArray(jsonData)) {
          setError('Le JSON doit être un tableau d\'objets')
          return
        }

        const csv = Papa.default.unparse(jsonData)
        setOutput(csv)
      }
    } catch (err) {
      if (direction === 'json-to-csv') {
        setError('JSON invalide. Vérifiez la syntaxe.')
      } else {
        setError('Erreur lors de la conversion.')
      }
      console.error('Conversion error:', err)
    }
  }, [input, direction])

  const copyResult = useCallback(async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }, [output])

  const downloadResult = useCallback(() => {
    if (!output) return

    const extension = direction === 'csv-to-json' ? 'json' : 'csv'
    const mimeType = direction === 'csv-to-json' ? 'application/json' : 'text/csv'

    const blob = new Blob([output], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [output, direction])

  const isJsonTocsv = direction === 'json-to-csv'

  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-[#082545] font-medium">
          {isJsonTocsv ? <Braces className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          {isJsonTocsv ? 'JSON' : 'CSV'}
        </div>

        <button
          onClick={toggleDirection}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Inverser la direction"
        >
          <ArrowLeftRight className="w-5 h-5 text-[#2EC6F3]" />
        </button>

        <div className="flex items-center gap-2 text-[#082545] font-medium">
          {isJsonTocsv ? <FileText className="w-5 h-5" /> : <Braces className="w-5 h-5" />}
          {isJsonTocsv ? 'CSV' : 'JSON'}
        </div>
      </div>

      {/* Conversion areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            {isJsonTocsv ? <Braces className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            Données {isJsonTocsv ? 'JSON' : 'CSV'}
          </h3>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isJsonTocsv
              ? 'Collez votre JSON ici...\n[\n  {"nom": "John", "age": 30},\n  {"nom": "Jane", "age": 25}\n]'
              : 'Collez votre CSV ici...\nnom,age\nJohn,30\nJane,25'
            }
            className="w-full h-64 p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#2EC6F3] focus:border-transparent font-mono text-sm"
          />
        </div>

        {/* Output */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              {isJsonTocsv ? <FileText className="w-4 h-4" /> : <Braces className="w-4 h-4" />}
              Résultat {isJsonTocsv ? 'CSV' : 'JSON'}
            </h3>
            {output && (
              <div className="flex gap-2">
                <button
                  onClick={copyResult}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copié !' : 'Copier'}
                </button>
                <button
                  onClick={downloadResult}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-[#2EC6F3] text-white hover:bg-[#2EC6F3]/90 rounded transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              </div>
            )}
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Le résultat apparaîtra ici après conversion..."
            className="w-full h-64 p-4 border border-gray-300 rounded-md resize-none bg-gray-50 font-mono text-sm"
          />
        </div>
      </div>

      {/* Convert button and error */}
      <div className="text-center space-y-3">
        <button
          onClick={convert}
          disabled={!input.trim()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#082545] text-white rounded-md hover:bg-[#082545]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Convertir
        </button>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Conseils</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {isJsonTocsv ? (
            <>
              <li>• Le JSON doit être un tableau d'objets</li>
              <li>• Tous les objets doivent avoir les mêmes clés</li>
              <li>• Exemple: [{'{'}nom: John, age: 30{'}'}]</li>
            </>
          ) : (
            <>
              <li>• Première ligne = en-têtes de colonnes</li>
              <li>• Séparez les valeurs par des virgules</li>
              <li>• Utilisez des guillemets si valeurs contiennent des virgules</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}