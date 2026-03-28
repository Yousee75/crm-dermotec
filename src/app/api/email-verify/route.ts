import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail, verifyEmailQuick } from '@/lib/communication/email-verify'
import { requireAuth } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/email-verify
 * Vérifie un email en profondeur (format + typo + disposable + DNS + SMTP)
 * Body: { email: string, quick?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (auth.error) return auth.error
    const { email, quick } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    if (quick) {
      const result = await verifyEmailQuick(email)
      return NextResponse.json(result)
    }

    const result = await verifyEmail(email)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[EmailVerify API] Error:', error)
    return NextResponse.json({ error: 'Erreur vérification' }, { status: 500 })
  }
}
