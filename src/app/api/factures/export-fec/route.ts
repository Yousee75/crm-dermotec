// ============================================================
// CRM DERMOTEC — Export FEC (Fichier des Écritures Comptables)
// Format obligatoire pour contrôle fiscal (art. L47 A-1 du LPF)
// 18 colonnes standardisées, séparateur TAB, encodage UTF-8
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { logActivity } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

// Colonnes FEC obligatoires (norme DGFiP)
const FEC_HEADERS = [
  'JournalCode',      // Code journal
  'JournalLib',       // Libellé journal
  'EcritureNum',      // Numéro écriture
  'EcritureDate',     // Date écriture (YYYYMMDD)
  'CompteNum',        // Numéro de compte
  'CompteLib',        // Libellé de compte
  'CompAuxNum',       // Numéro compte auxiliaire
  'CompAuxLib',       // Libellé compte auxiliaire
  'PieceRef',         // Référence pièce
  'PieceDate',        // Date pièce (YYYYMMDD)
  'EcritureLib',      // Libellé écriture
  'Debit',            // Montant débit
  'Credit',           // Montant crédit
  'EcrtureLettrage',  // Lettrage
  'DateLettrage',     // Date lettrage (YYYYMMDD)
  'ValidDate',        // Date validation (YYYYMMDD)
  'Montantdevise',    // Montant en devise
  'Idevise',          // Identifiant devise
]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function formatMontant(n: number | null): string {
  if (!n || n === 0) return '0,00'
  return n.toFixed(2).replace('.', ',')
}

export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabase()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Paramètres
    const url = request.nextUrl
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())
    const dateFrom = `${year}-01-01`
    const dateTo = `${year}-12-31`

    // ── Charger les factures de l'exercice ──
    const { data: factures, error } = await supabase
      .from('factures_formation')
      .select('*')
      .gte('date_emission', dateFrom)
      .lte('date_emission', dateTo)
      .is('deleted_at', null)
      .order('date_emission', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ── Générer les écritures FEC ──
    const lignes: string[][] = []
    let ecritureNum = 1

    for (const f of (factures || [])) {
      const dateEcriture = formatDate(f.date_emission)
      const datePiece = formatDate(f.date_emission)
      const dateValid = formatDate(f.date_emission)
      const ref = f.numero_facture || `FAC-${f.id.slice(0, 8)}`
      const isAvoir = f.type === 'avoir'

      // Ligne 1 : Débit client (411)
      lignes.push([
        'VE',                                      // JournalCode (Ventes)
        'Journal des Ventes',                      // JournalLib
        String(ecritureNum),                       // EcritureNum
        dateEcriture,                              // EcritureDate
        '411000',                                  // CompteNum (Clients)
        'Clients',                                 // CompteLib
        f.destinataire_siret || '',                // CompAuxNum
        f.destinataire_nom || '',                  // CompAuxLib
        ref,                                       // PieceRef
        datePiece,                                 // PieceDate
        `${isAvoir ? 'Avoir' : 'Facture'} ${ref} - ${f.destinataire_nom}`, // EcritureLib
        isAvoir ? '0,00' : formatMontant(f.montant_ttc),   // Debit
        isAvoir ? formatMontant(f.montant_ttc) : '0,00',   // Credit
        '',                                        // EcrtureLettrage
        '',                                        // DateLettrage
        dateValid,                                 // ValidDate
        '',                                        // Montantdevise
        'EUR',                                     // Idevise
      ])

      // Ligne 2 : Crédit ventes (706)
      lignes.push([
        'VE',
        'Journal des Ventes',
        String(ecritureNum),
        dateEcriture,
        f.taux_tva === 0 ? '706100' : '706000',   // 706100 = exonéré, 706000 = standard
        f.taux_tva === 0 ? 'Prestations de formation (exonérées)' : 'Prestations de services',
        '',
        '',
        ref,
        datePiece,
        `${isAvoir ? 'Avoir' : 'Facture'} ${ref} - ${f.destinataire_nom}`,
        isAvoir ? formatMontant(f.montant_ht) : '0,00',
        isAvoir ? '0,00' : formatMontant(f.montant_ht),
        '',
        '',
        dateValid,
        '',
        'EUR',
      ])

      // Ligne 3 : TVA collectée (4457) — seulement si TVA > 0
      if (f.montant_tva && f.montant_tva > 0) {
        lignes.push([
          'VE',
          'Journal des Ventes',
          String(ecritureNum),
          dateEcriture,
          '445710',                                // TVA collectée
          'TVA collectée 20%',
          '',
          '',
          ref,
          datePiece,
          `TVA ${ref}`,
          isAvoir ? formatMontant(f.montant_tva) : '0,00',
          isAvoir ? '0,00' : formatMontant(f.montant_tva),
          '',
          '',
          dateValid,
          '',
          'EUR',
        ])
      }

      ecritureNum++
    }

    // ── Construire le fichier FEC ──
    const TAB = '\t'
    const rows = [
      FEC_HEADERS.join(TAB),
      ...lignes.map(l => l.join(TAB)),
    ]
    const content = '\uFEFF' + rows.join('\r\n') // BOM UTF-8 + CRLF

    // SIREN Dermotec (à remplacer par la vraie valeur)
    const siren = '123456789'
    const filename = `${siren}FEC${year}1231.txt`

    // Log activité
    logActivity({
      type: 'SYSTEME',
      description: `Export FEC ${year} — ${factures?.length || 0} factures, ${lignes.length} écritures`,
      user_id: user.id,
      metadata: { action: 'export_fec', year, nb_factures: factures?.length || 0, nb_ecritures: lignes.length },
    })

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
