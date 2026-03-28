import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { Formation, Lead, Session, Inscription } from '@/types'
import { formatDate, generateCertificatNumero } from '@/lib/utils'
import { BRAND, COLORS } from '@/lib/constants'

interface CertificatPDFProps {
  lead: Lead
  formation: Formation
  session: Session
  inscription: Inscription
  certificatNumero?: string
  qrCodeDataUrl?: string  // Base64 data URL du QR code de vérification
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  header: {
    backgroundColor: COLORS.accent,
    color: 'white',
    padding: 30,
    textAlign: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.9,
  },
  main: {
    padding: 40,
    textAlign: 'center',
    minHeight: 600,
    justifyContent: 'center',
  },
  certificateTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 30,
    letterSpacing: 2,
  },
  certifyText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  nameBox: {
    backgroundColor: '#F8FAFC',
    border: `2px solid ${COLORS.primary}`,
    padding: 20,
    marginVertical: 20,
    borderRadius: 8,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  completedText: {
    fontSize: 16,
    marginBottom: 15,
    color: '#374151',
  },
  formationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  details: {
    backgroundColor: '#F1F5F9',
    padding: 20,
    marginVertical: 20,
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.accent,
  },
  detailsText: {
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'left',
  },
  competences: {
    marginVertical: 20,
  },
  competencesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.accent,
  },
  competencesList: {
    textAlign: 'left',
    fontSize: 12,
  },
  competenceItem: {
    marginBottom: 3,
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  signatureBox: {
    textAlign: 'center',
    width: '40%',
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 30,
    color: COLORS.accent,
  },
  signatureName: {
    fontSize: 11,
    borderTop: '1px solid #ccc',
    paddingTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `1px solid ${COLORS.primary}`,
    paddingTop: 15,
  },
  certificateNumber: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  npmLogo: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  validationText: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  decorativeElement: {
    position: 'absolute',
    top: 80,
    right: 40,
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
    borderRadius: '50%',
  },
})

export function CertificatPDF({
  lead,
  formation,
  session,
  inscription,
  certificatNumero,
  qrCodeDataUrl
}: CertificatPDFProps) {
  const numero = certificatNumero || inscription.certificat_numero || generateCertificatNumero()
  const dateFormation = formatDate(session.date_fin, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header avec branding Dermotec */}
        <View style={styles.header}>
          <Text style={styles.logo}>{BRAND.name}</Text>
          <Text style={styles.headerSubtitle}>{BRAND.tagline}</Text>
          <Text style={styles.headerSubtitle}>Organisme certifié QUALIOPI</Text>
        </View>

        {/* Élément décoratif */}
        <View style={styles.decorativeElement} />

        {/* Contenu principal */}
        <View style={styles.main}>
          <Text style={styles.certificateTitle}>CERTIFICAT DE COMPÉTENCES</Text>

          <Text style={styles.certifyText}>
            Il est certifié par les présentes que
          </Text>

          <View style={styles.nameBox}>
            <Text style={styles.studentName}>
              {lead.civilite} {lead.prenom} {lead.nom}
            </Text>
          </View>

          <Text style={styles.completedText}>
            a suivi avec succès la formation
          </Text>

          <Text style={styles.formationTitle}>
            {formation.nom}
          </Text>

          <View style={styles.details}>
            <Text style={styles.detailsTitle}>Détails de la formation :</Text>
            <Text style={styles.detailsText}>
              • Catégorie : {formation.categorie}
            </Text>
            <Text style={styles.detailsText}>
              • Durée : {formation.duree_jours} jours ({formation.duree_heures} heures)
            </Text>
            <Text style={styles.detailsText}>
              • Dates : du {formatDate(session.date_debut)} au {formatDate(session.date_fin)}
            </Text>
            <Text style={styles.detailsText}>
              • Lieu : {session.adresse || `${BRAND.address}, ${BRAND.city}`}
            </Text>
            {inscription.taux_presence && (
              <Text style={styles.detailsText}>
                • Taux de présence : {Math.round(inscription.taux_presence)}%
              </Text>
            )}
          </View>

          <View style={styles.competences}>
            <Text style={styles.competencesTitle}>Compétences acquises :</Text>
            <View style={styles.competencesList}>
              {formation.competences_acquises.map((competence, index) => (
                <Text key={index} style={styles.competenceItem}>
                  • {competence}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Le Directeur</Text>
            <Text style={styles.signatureName}>{BRAND.name}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>La Formatrice</Text>
            <Text style={styles.signatureName}>
              {session.formatrice?.prenom} {session.formatrice?.nom}
            </Text>
          </View>
        </View>

        {/* Footer avec QR Code */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.certificateNumber}>N° {numero}</Text>
            <Text style={styles.certificateNumber}>Délivré le {formatDate(new Date())}</Text>
          </View>
          {qrCodeDataUrl && (
            <View style={{ alignItems: 'center' }}>
              <Image src={qrCodeDataUrl} style={{ width: 60, height: 60 }} />
              <Text style={{ fontSize: 7, color: '#999', marginTop: 2 }}>Scanner pour vérifier</Text>
            </View>
          )}
          <View>
            <Text style={styles.npmLogo}>Matériel NPM International</Text>
            <Text style={styles.npmLogo}>Techniques professionnelles</Text>
          </View>
        </View>

        <Text style={styles.validationText}>
          Ce certificat atteste de la réussite aux évaluations pratiques et théoriques de la formation.
        </Text>
        <Text style={styles.validationText}>
          Certificat vérifiable sur {BRAND.website}/certificat/{numero}
        </Text>
      </Page>
    </Document>
  )
}