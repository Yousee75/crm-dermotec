import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  const siret = request.nextUrl.searchParams.get('siret')

  if (!siret || siret.length !== 14) {
    return NextResponse.json({ error: 'SIRET invalide (14 chiffres requis)' }, { status: 400 })
  }

  try {
    // API Sirene ouverte (data.gouv.fr) — gratuit, pas de clé
    const res = await fetch(
      `https://api.insee.fr/api-sirene/3.11/siret/${siret}`,
      {
        headers: {
          Accept: 'application/json',
          ...(process.env.INSEE_API_KEY ? { Authorization: `Bearer ${process.env.INSEE_API_KEY}` } : {}),
        },
      }
    )

    if (!res.ok) {
      // Fallback: API entreprise data.gouv.fr
      const fallbackRes = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}&mtm_campaign=crm-dermotec`)
      if (!fallbackRes.ok) {
        return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })
      }

      const fallbackData = await fallbackRes.json()
      const etab = fallbackData.results?.[0]

      if (!etab) {
        return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })
      }

      return NextResponse.json({
        siret: etab.matching_etablissements?.[0]?.siret || siret,
        siren: etab.siren || siret.slice(0, 9),
        nom: etab.nom_complet || etab.nom_raison_sociale || 'Inconnu',
        adresse: etab.siege?.adresse || '',
        codePostal: etab.siege?.code_postal || '',
        ville: etab.siege?.libelle_commune || '',
        naf: etab.activite_principale || '',
        nafLabel: etab.section_activite_principale || '',
        dateCreation: etab.date_creation || '',
        actif: etab.etat_administratif === 'A',
      })
    }

    const data = await res.json()
    const etab = data.etablissement

    return NextResponse.json({
      siret: etab.siret,
      siren: etab.siren,
      nom: etab.uniteLegale?.denominationUniteLegale || etab.uniteLegale?.nomUniteLegale || 'Inconnu',
      adresse: [
        etab.adresseEtablissement?.numeroVoieEtablissement,
        etab.adresseEtablissement?.typeVoieEtablissement,
        etab.adresseEtablissement?.libelleVoieEtablissement,
      ].filter(Boolean).join(' '),
      codePostal: etab.adresseEtablissement?.codePostalEtablissement || '',
      ville: etab.adresseEtablissement?.libelleCommuneEtablissement || '',
      naf: etab.uniteLegale?.activitePrincipaleUniteLegale || '',
      nafLabel: etab.uniteLegale?.nomenclatureActivitePrincipaleUniteLegale || '',
      dateCreation: etab.dateCreationEtablissement || '',
      actif: etab.uniteLegale?.etatAdministratifUniteLegale === 'A',
    })
  } catch (err) {
    console.error('[SIRET] Error:', err)
    return NextResponse.json({ error: 'Erreur de connexion à l\'API' }, { status: 500 })
  }
}
