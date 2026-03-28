/**
 * Service d'export universel — CSV + PDF
 * Fonctionne cote client uniquement (Blob + URL.createObjectURL)
 */

import React from 'react'

// ─── Types ───────────────────────────────────────────────────────────

export type ColumnDef = {
  header: string
  accessor: string | ((row: any) => string)
  width?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────

function resolveAccessor(row: any, accessor: ColumnDef['accessor']): string {
  if (typeof accessor === 'function') return accessor(row)
  const val = row[accessor]
  if (val === null || val === undefined) return ''
  return String(val)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function dateSuffix(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── CSV Export ──────────────────────────────────────────────────────

export function exportToCSV(
  data: any[],
  columns: ColumnDef[],
  filename: string,
  userId?: string
): void {
  if (!data.length) return

  const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',')

  const rows = data.map(row =>
    columns.map(col => {
      const val = resolveAccessor(row, col.accessor)
      // Echapper guillemets, gerer virgules et retours a la ligne
      const escaped = val.replace(/"/g, '""')
      return `"${escaped}"`
    }).join(',')
  )

  // Watermarking canary trap : ligne invisible avec ID utilisateur
  // Utilise un caractere zero-width space dans une cellule vide
  if (userId) {
    const canary = columns.map((_, i) =>
      i === 0 ? `"\u200B${userId}\u200B"` : '""'
    ).join(',')
    rows.push(canary)
  }

  const csv = [headers, ...rows].join('\r\n')
  const bom = '\uFEFF' // UTF-8 BOM pour Excel
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })

  triggerDownload(blob, `${filename}-${dateSuffix()}.csv`)
}

// ─── PDF Export ──────────────────────────────────────────────────────

export async function exportToPDF(
  data: any[],
  columns: ColumnDef[],
  title: string,
  filename: string,
  userName?: string
): Promise<void> {
  if (!data.length) return

  // Dynamic import pour ne pas alourdir le bundle initial
  const { Document, Page, Text, View, StyleSheet, pdf } = await import('@react-pdf/renderer')

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 9,
      fontFamily: 'Helvetica',
      position: 'relative' as const,
    },
    watermark: {
      position: 'absolute' as const,
      top: '45%',
      left: '15%',
      fontSize: 48,
      color: '#E5E7EB',
      opacity: 0.3,
      transform: 'rotate(-35deg)',
    },
    headerSection: {
      marginBottom: 20,
      borderBottom: '2px solid #FF5C00',
      paddingBottom: 10,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: '#1A1A1A',
      marginBottom: 4,
    },
    headerMeta: {
      fontSize: 8,
      color: '#6B7280',
    },
    table: {
      width: '100%',
    },
    tableHeader: {
      flexDirection: 'row' as const,
      backgroundColor: '#FF5C00',
      borderRadius: 4,
      marginBottom: 2,
    },
    tableHeaderCell: {
      padding: 6,
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
    },
    tableRow: {
      flexDirection: 'row' as const,
      borderBottomWidth: 0.5,
      borderBottomColor: '#E5E7EB',
    },
    tableRowEven: {
      backgroundColor: '#F9FAFB',
    },
    tableCell: {
      padding: 5,
      fontSize: 8,
      color: '#374151',
    },
    footer: {
      position: 'absolute' as const,
      bottom: 25,
      left: 40,
      right: 40,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      borderTop: '1px solid #E5E7EB',
      paddingTop: 8,
    },
    footerText: {
      fontSize: 7,
      color: '#9CA3AF',
    },
  })

  // Calculer les largeurs des colonnes
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 1), 0)
  const colWidths = columns.map(col => `${((col.width || 1) / totalWidth) * 100}%`)

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Paginer les donnees (environ 30 lignes par page)
  const ROWS_PER_PAGE = 30
  const pages: any[][] = []
  for (let i = 0; i < data.length; i += ROWS_PER_PAGE) {
    pages.push(data.slice(i, i + ROWS_PER_PAGE))
  }

  const doc = (
    <Document>
      {pages.map((pageData, pageIndex) => (
        {/* @ts-expect-error react-pdf orientation type */}
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {/* Watermark */}
          {userName && (
            <Text style={styles.watermark}>{userName}</Text>
          )}

          {/* Header (premiere page seulement) */}
          {pageIndex === 0 && (
            <View style={styles.headerSection}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerMeta}>
                CRM Satorea — {dateStr} — {data.length} enregistrement{data.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Table */}
          <View style={styles.table}>
            {/* Header row */}
            <View style={styles.tableHeader}>
              {columns.map((col, i) => (
                <Text
                  key={i}
                  style={[styles.tableHeaderCell, { width: colWidths[i] }]}
                >
                  {col.header}
                </Text>
              ))}
            </View>

            {/* Data rows */}
            {pageData.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={[
                  styles.tableRow,
                  rowIndex % 2 === 0 ? styles.tableRowEven : {},
                ]}
              >
                {columns.map((col, colIndex) => (
                  <Text
                    key={colIndex}
                    style={[styles.tableCell, { width: colWidths[colIndex] }]}
                  >
                    {resolveAccessor(row, col.accessor)}
                  </Text>
                ))}
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Document confidentiel — Usage interne uniquement
            </Text>
            <Text style={styles.footerText}>
              Page {pageIndex + 1} / {pages.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  triggerDownload(blob, `${filename}-${dateSuffix()}.pdf`)
}
