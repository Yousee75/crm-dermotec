import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    }

    const body = await req.json()
    const { signature_data } = body

    // Valider le format de signature
    if (!signature_data || typeof signature_data !== 'string' || !signature_data.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Format de signature invalide' }, { status: 400 })
    }

    // Limite de taille : 500KB max pour une signature
    const MAX_SIGNATURE_SIZE = 500 * 1024
    const base64Part = signature_data.replace('data:image/png;base64,', '')
    let signatureBuffer: Buffer
    try {
      signatureBuffer = Buffer.from(base64Part, 'base64')
    } catch {
      return NextResponse.json({ error: 'Signature corrompue (base64 invalide)' }, { status: 400 })
    }

    if (signatureBuffer.length > MAX_SIGNATURE_SIZE) {
      return NextResponse.json({ error: 'Signature trop volumineuse (max 500KB)' }, { status: 400 })
    }

    // Verification du magic number PNG (89 50 4E 47 0D 0A 1A 0A)
    const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    if (signatureBuffer.length < 8 || !signatureBuffer.subarray(0, 8).equals(PNG_MAGIC)) {
      return NextResponse.json({ error: 'Le fichier signature n\'est pas un PNG valide' }, { status: 400 })
    }

    const supabase = await createServiceSupabase()

    // Récupérer l'inscription via le token portail
    const { data: inscription, error: inscError } = await (supabase as any)
      .from('inscriptions')
      .select(`
        *,
        lead:leads(id, prenom, nom, email),
        session:sessions(
          *,
          formation:formations(nom)
        )
      `)
      .eq('portail_token', token)
      .single()

    if (inscError || !inscription) {
      return NextResponse.json({ error: 'Portail non trouvé' }, { status: 404 })
    }

    // Vérifier si déjà signée
    if (inscription.convention_signee) {
      return NextResponse.json({ error: 'Convention déjà signée' }, { status: 400 })
    }

    // Mettre à jour l'inscription
    const { error: updateError } = await (supabase as any)
      .from('inscriptions')
      .update({
        convention_signee: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', inscription.id)

    if (updateError) {
      console.error('Erreur mise à jour inscription:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la signature' }, { status: 500 })
    }

    // Créer un document pour la convention signée
    const documentData = {
      inscription_id: inscription.id,
      lead_id: inscription.lead_id,
      type: 'convention' as const,
      filename: `convention-${inscription.id}-signee.png`,
      storage_path: `conventions/${inscription.id}/signature.png`,
      file_size: Math.round(signature_data.length * 0.75), // Approximation base64
      mime_type: 'image/png',
      description: `Convention de formation signée électroniquement`,
      is_signed: true
    }

    const { error: docError } = await (supabase as any)
      .from('documents')
      .insert([documentData])

    if (docError) {
      console.error('Erreur création document:', docError)
      // On continue même si le document n'est pas créé
    }

    // Logger l'activité
    const activiteData = {
      type: 'DOCUMENT' as const,
      lead_id: inscription.lead_id,
      inscription_id: inscription.id,
      description: `Convention signée par le stagiaire ${inscription.lead?.prenom} ${inscription.lead?.nom}`,
      metadata: {
        convention_id: inscription.id,
        formation: inscription.session?.formation?.nom,
        signature_type: 'electronic',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      }
    }

    const { error: actError } = await (supabase as any)
      .from('activites')
      .insert([activiteData])

    if (actError) {
      console.error('Erreur création activité:', actError)
      // On continue même si l'activité n'est pas loggée
    }

    return NextResponse.json({
      success: true,
      message: 'Convention signée avec succès'
    })

  } catch (err) {
    console.error('Erreur API signature convention:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}