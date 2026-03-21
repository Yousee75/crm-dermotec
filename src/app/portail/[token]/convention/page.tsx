'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SignatureCanvas } from '@/components/ui/SignatureCanvas'
import { Button } from '@/components/ui/Button'
import { CheckCircle, FileText, MapPin, Phone, Clock, Euro, Users, Target } from 'lucide-react'
import { Inscription, Formation, Session, Lead } from '@/types'

interface PortailData {
  inscription: Inscription
  lead: Lead
  formation: Formation
  session: Session
}

export default function ConventionPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<PortailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rgpdConsent, setRgpdConsent] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [isSigningConvention, setIsSigningConvention] = useState(false)
  const [conventionSigned, setConventionSigned] = useState(false)
  const [signatureError, setSignatureError] = useState<string | null>(null)

  // Charger les données du portail
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/portail/${token}`)
        if (!response.ok) {
          throw new Error('Impossible de charger les données')
        }
        const result = await response.json()
        setData(result)
        setConventionSigned(result.inscription.convention_signee)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadData()
    }
  }, [token])

  // Gérer la signature de convention
  const handleSignConvention = async () => {
    if (!signatureData || !rgpdConsent) {
      return
    }

    setIsSigningConvention(true)
    setSignatureError(null)

    try {
      const response = await fetch(`/api/portail/${token}/sign-convention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_data: signatureData })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la signature')
      }

      setConventionSigned(true)
    } catch (err) {
      setSignatureError(err instanceof Error ? err.message : 'Erreur de signature')
    } finally {
      setIsSigningConvention(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EC6F3] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-gray-800">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-800">Aucune donnée trouvée</p>
      </div>
    )
  }

  const { inscription, lead, formation, session } = data

  // Formatage des dates
  const dateDebut = new Date(session.date_debut).toLocaleDateString('fr-FR')
  const dateFin = new Date(session.date_fin).toLocaleDateString('fr-FR')
  const dateSignature = conventionSigned && inscription.updated_at
    ? new Date(inscription.updated_at).toLocaleDateString('fr-FR')
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#082545] mb-2">Convention de Formation</h1>
              <p className="text-gray-600">
                {formation.nom} • {lead.prenom} {lead.nom}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Dermotec Advanced</div>
              <div className="text-sm text-gray-500">75 Bd Richard Lenoir, 75011 Paris</div>
              <div className="text-sm text-gray-500">01 88 33 43 43</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {conventionSigned ? (
          /* État signé */
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Convention signée avec succès</h2>
            <p className="text-gray-600 mb-4">
              Votre convention de formation a été signée électroniquement
              {dateSignature && (
                <span> le {dateSignature}</span>
              )}
            </p>
            <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-green-700">
                Un exemplaire de votre convention signée vous sera envoyé par email.
              </p>
            </div>
          </div>
        ) : (
          /* Processus de signature */
          <>
            {/* Résumé de la formation */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-bold text-[#082545] mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-[#2EC6F3]" />
                Résumé de votre formation
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-[#2EC6F3] mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{formation.nom}</div>
                      <div className="text-sm text-gray-600">{formation.categorie}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-[#2EC6F3]" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {formation.duree_jours} jour{formation.duree_jours > 1 ? 's' : ''}
                        • {formation.duree_heures}h
                      </div>
                      <div className="text-sm text-gray-600">
                        Du {dateDebut} au {dateFin}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-[#2EC6F3]" />
                    <div>
                      <div className="font-medium text-gray-900">{session.salle}</div>
                      <div className="text-sm text-gray-600">{session.adresse}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Euro className="h-5 w-5 text-[#2EC6F3]" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {inscription.montant_total.toFixed(2)} € HT
                      </div>
                      <div className="text-sm text-gray-600">
                        Reste à charge: {inscription.reste_a_charge.toFixed(2)} €
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-[#2EC6F3]" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {session.places_occupees}/{session.places_max} places
                      </div>
                      <div className="text-sm text-gray-600">Formation en petit groupe</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles de la convention */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-bold text-[#082545] mb-6">Articles de la Convention</h2>

              <div className="space-y-6">
                <article>
                  <h3 className="font-semibold text-gray-900 mb-2">Article 1 - Objet</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    La présente convention a pour objet la formation intitulée "{formation.nom}"
                    d'une durée de {formation.duree_heures} heures réparties sur {formation.duree_jours} jour{formation.duree_jours > 1 ? 's' : ''}.
                  </p>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 mb-2">Article 2 - Dates et lieu</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    La formation se déroulera du {dateDebut} au {dateFin}
                    de {session.horaire_debut} à {session.horaire_fin}
                    à {session.salle}, {session.adresse}.
                  </p>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 mb-2">Article 3 - Programme et objectifs</h3>
                  <div className="text-gray-700 text-sm leading-relaxed">
                    <p className="mb-2">Objectifs pédagogiques :</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {formation.objectifs.map((objectif, index) => (
                        <li key={index}>{objectif}</li>
                      ))}
                    </ul>
                  </div>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 mb-2">Article 4 - Moyens pédagogiques</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Formation en présentiel avec alternance théorie/pratique. Supports de cours fournis.
                    {formation.materiel_inclus && ' Matériel professionnel inclus.'}
                  </p>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 mb-2">Article 5 - Tarif et conditions de règlement</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Coût total de la formation : {inscription.montant_total.toFixed(2)} € HT.
                    {inscription.montant_finance > 0 && (
                      <span> Montant financé : {inscription.montant_finance.toFixed(2)} €.</span>
                    )}
                    {' '}Reste à charge stagiaire : {inscription.reste_a_charge.toFixed(2)} €.
                  </p>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 mb-2">Article 6 - Modalités d'évaluation</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Évaluation pratique en cours et en fin de formation.
                    Remise d'un certificat de réalisation en cas de présence aux 2/3 de la formation.
                  </p>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 mb-2">Article 7 - Délai de rétractation</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Vous disposez d'un délai de rétractation de 14 jours à compter de la signature de la présente convention.
                  </p>
                </article>

                <article>
                  <h3 className="font-semibold text-gray-900 mb-2">Article 8 - Règlement intérieur</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Le stagiaire s'engage à respecter le règlement intérieur de l'organisme de formation
                    qui lui sera remis en début de session.
                  </p>
                </article>
              </div>
            </div>

            {/* Consentement et signature */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-[#082545] mb-6">Signature électronique</h2>

              {/* Checkbox RGPD */}
              <div className="mb-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rgpdConsent}
                    onChange={(e) => setRgpdConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 text-[#2EC6F3] focus:ring-[#2EC6F3] border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    J'ai lu et j'accepte les conditions de la convention de formation.
                    Je consens au traitement de mes données personnelles conformément au RGPD
                    pour les besoins de ma formation et du suivi administratif.
                  </span>
                </label>
              </div>

              {/* Canvas de signature */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Signez dans le cadre ci-dessous :
                </label>
                <SignatureCanvas
                  onSignature={setSignatureData}
                  width={400}
                  height={150}
                />
              </div>

              {/* Affichage erreur signature */}
              {signatureError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Erreur :</strong> {signatureError}
                  </p>
                </div>
              )}

              {/* Bouton de signature */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                  onClick={handleSignConvention}
                  disabled={!signatureData || !rgpdConsent || isSigningConvention}
                  className="min-h-[44px] px-8 bg-[#2EC6F3] hover:bg-[#2EC6F3]/90 text-white"
                >
                  {isSigningConvention ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signature en cours...
                    </>
                  ) : (
                    'Signer la convention'
                  )}
                </Button>

                {(!signatureData || !rgpdConsent) && (
                  <p className="text-sm text-gray-500">
                    Veuillez signer et accepter les conditions pour continuer
                  </p>
                )}
              </div>

              {/* Mentions légales */}
              <div className="mt-6 pt-6 border-t text-xs text-gray-500 space-y-2">
                <p>
                  La signature électronique de cette convention a la même valeur juridique qu'une signature manuscrite
                  conformément au règlement eIDAS et à l'article 1367 du Code civil.
                </p>
                <p>
                  Dermotec Advanced - Organisme de formation déclaré sous le n° 11755985075 - Certification Qualiopi
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}