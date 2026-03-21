import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Lead, Formation, Session } from '@/types'

// ============================================================
// ATTESTATION DE FIN DE FORMATION - PDF Generator
// ============================================================

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 40,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#082545',
    marginBottom: 8,
  },
  address: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 10,
  },
  separator: {
    height: 2,
    backgroundColor: '#2EC6F3',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#082545',
    textAlign: 'center',
    marginBottom: 40,
    textDecoration: 'underline',
  },
  certificationText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'justify',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#082545',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#082545',
    marginBottom: 10,
    textDecoration: 'underline',
  },
  objectivesList: {
    marginLeft: 15,
  },
  objectiveItem: {
    marginBottom: 5,
    color: '#374151',
  },
  presenceInfo: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
  },
  presenceText: {
    fontSize: 11,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  legalMention: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 30,
    fontStyle: 'italic',
    textAlign: 'center',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 15,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#082545',
  },
  signatureDate: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 20,
  },
  signatureLine: {
    borderBottom: '1 solid #9CA3AF',
    height: 20,
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 9,
    color: '#374151',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
})

interface AttestationFinPDFProps {
  lead: {
    prenom: string
    nom: string
    date_naissance?: string
  }
  formation: {
    nom: string
    duree_jours: number
    duree_heures: number
    objectifs: string[]
  }
  session: {
    date_debut: string
    date_fin: string
  }
  taux_presence: number
  date_emission?: string
}

export function AttestationFinPDF({
  lead,
  formation,
  session,
  taux_presence,
  date_emission
}: AttestationFinPDFProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const emissionDate = date_emission ? new Date(date_emission) : new Date()
  const formatEmissionDate = emissionDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formatEmissionLocation = `Paris, le ${formatEmissionDate}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>DERMOTEC ADVANCED</Text>
          <Text style={styles.address}>
            Centre de Formation Certifié Qualiopi{'\n'}
            75 Boulevard Richard Lenoir, 75011 Paris{'\n'}
            Tél. : 01 88 33 43 43 • SIRET : 123 456 789 00012{'\n'}
            Déclaration d'activité enregistrée sous le n° 11755XXX075
          </Text>
          <View style={styles.separator} />
        </View>

        {/* Title */}
        <Text style={styles.title}>ATTESTATION DE FIN DE FORMATION</Text>

        {/* Main certification text */}
        <View style={styles.section}>
          <Text style={styles.certificationText}>
            Nous, <Text style={styles.highlight}>Dermotec Advanced</Text>, centre de formation certifié Qualiopi,
            certifions que :
          </Text>

          <Text style={styles.certificationText}>
            <Text style={styles.highlight}>
              {lead.civilite ? `${lead.civilite} ` : ''}{lead.prenom} {lead.nom}
            </Text>
            {lead.date_naissance && `, né(e) le ${formatDate(lead.date_naissance)},`}
          </Text>

          <Text style={styles.certificationText}>
            a suivi avec <Text style={styles.highlight}>assiduité</Text> la formation intitulée :
          </Text>

          <Text style={[styles.certificationText, styles.highlight]}>
            « {formation.nom} »
          </Text>

          <Text style={styles.certificationText}>
            du <Text style={styles.highlight}>{formatDate(session.date_debut)}</Text> au{' '}
            <Text style={styles.highlight}>{formatDate(session.date_fin)}</Text>,
            soit une durée de <Text style={styles.highlight}>{formation.duree_heures} heures</Text>
            {formation.duree_jours > 1 ? ` réparties sur ${formation.duree_jours} jours` : ''}.
          </Text>
        </View>

        {/* Objectifs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objectifs de formation atteints</Text>
          <View style={styles.objectivesList}>
            {formation.objectifs.map((objectif, index) => (
              <Text key={index} style={styles.objectiveItem}>
                • {objectif}
              </Text>
            ))}
          </View>
        </View>

        {/* Présence */}
        <View style={styles.presenceInfo}>
          <Text style={styles.presenceText}>
            Taux de présence : {taux_presence.toFixed(1)}%
            {taux_presence >= 80 ? ' ✓' : ' (Attention : taux inférieur à 80%)'}
          </Text>
        </View>

        {/* Compétences */}
        <View style={styles.section}>
          <Text style={styles.certificationText}>
            Cette formation lui permet d'acquérir les <Text style={styles.highlight}>compétences théoriques et pratiques</Text>
            nécessaires à l'exercice professionnel dans le domaine de l'esthétique.
          </Text>
        </View>

        {/* Legal mention */}
        <Text style={styles.legalMention}>
          Attestation délivrée conformément aux articles L.6353-1 et R.6353-1 du Code du travail
        </Text>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le stagiaire</Text>
            <Text style={styles.signatureDate}>Signature :</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>
              {lead.prenom} {lead.nom}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le centre de formation</Text>
            <Text style={styles.signatureDate}>{formatEmissionLocation}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>
              Direction Dermotec Advanced{'\n'}
              Cachet et signature
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Dermotec Advanced — Centre de formation certifié Qualiopi • Page 1/1
        </Text>
      </Page>
    </Document>
  )
}

// Helper pour générer les props depuis les données CRM
export function generateAttestationFinProps(
  lead: Lead,
  formation: Formation,
  session: Session,
  taux_presence: number,
  date_emission?: string,
): AttestationFinPDFProps {
  return {
    lead: {
      prenom: lead.prenom,
      nom: lead.nom || '',
      date_naissance: lead.date_naissance,
    },
    formation: {
      nom: formation.nom,
      duree_jours: formation.duree_jours,
      duree_heures: formation.duree_heures,
      objectifs: formation.objectifs,
    },
    session: {
      date_debut: session.date_debut,
      date_fin: session.date_fin,
    },
    taux_presence,
    date_emission,
  }
}