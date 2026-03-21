/**
 * Export CSV utilitaire — fonctionne côté client
 * Usage: exportToCSV(data, 'leads', ['id', 'prenom', 'nom', 'email'])
 */

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: (keyof T)[]
) {
  if (!data.length) return

  const keys = columns || (Object.keys(data[0]) as (keyof T)[])

  const headers = keys.map(k => String(k)).join(',')
  const rows = data.map(row =>
    keys.map(key => {
      const val = row[key]
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }).join(',')
  )

  const csv = [headers, ...rows].join('\n')
  const bom = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export JSON utilitaire
 */
export function exportToJSON<T>(data: T[], filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
