import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Lead, Formation, Session } from '@/types'

// ============================================================
// ATTESTATION D'ASSIDUITÉ - PDF Generator
// ============================================================

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
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
    fontSize: 16,
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
  presenceBox: {
    backgroundColor: '#F0F9FF',
    border: '2 solid #2EC6F3',
    padding: 20,
    marginVertical: 25,
    borderRadius: 8,
  },
  presenceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#082545',
    textAlign: 'center',
    marginBottom: 15,
  },
  presenceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  presenceStat: {
    textAlign: 'center',
  },
  presenceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#082545',
  },
  presenceLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  presenceTaux: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  tauxExcellent: {
    color: '#10B981',
  },
  tauxCorrect: {
    color: '#F59E0B',
  },
  tauxInsuffisant: {
    color: '#EF4444',
  },
  dateInfo: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    marginVertical: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateLabel: {
    fontWeight: 'bold',
    color: '#374151',
  },
  dateValue: {
    color: '#1F2937',
  },
  legalSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#FEF3C7',
    borderLeft: '4 solid #F59E0B',
  },
  legalTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  legalText: {
    fontSize: 9,
    color: '#92400E',
    lineHeight: 1.4,
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
    marginBottom: 25,
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
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10,
  },
})

interface AttestationAssiduiteProps {
  lead: {
    prenom: string
    nom: string
  }
  formation: {
    nom: string
    duree_heures: number
  }
  session: {
    date_debut: string
    date_fin: string
  }
  heures_effectuees: number
  taux_presence: number
}

export function AttestationAssiduiteePDF({
  lead,
  formation,
  session,
  heures_effectuees,
  taux_presence
}: AttestationAssiduiteProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const getPresenceStyle = (taux: number) => {
    if (taux >= 90) return styles.tauxExcellent
    if (taux >= 80) return styles.tauxCorrect
    return styles.tauxInsuffisant
  }

  const getPresenceAppreciation = (taux: number) => {
    if (taux >= 95) return 'Assiduité excellente'
    if (taux >= 90) return 'Très bonne assiduité'
    if (taux >= 80) return 'Assiduité satisfaisante'
    if (taux >= 70) return 'Assiduité correcte'
    return 'Assiduité insuffisante'
  }

  const heures_absentes = formation.duree_heures - heures_effectuees

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>DERMOTEC ADVANCED</Text>
          <Text style={styles.address}>
            Centre de Formation Certifié Qualiopi{'\n'}
            75 Boulevard Richard Lenoir, 75011 Paris{'\n'}
            Tél. : 01 88 33 43 43 • SIRET : 851 306 860 00012{'\n'}
            Déclaration d'activité enregistrée sous le n° 11755959875
          </Text>
          <View style={styles.separator} />
        </View>

        {/* Title */}
        <Text style={styles.title}>ATTESTATION D'ASSIDUITÉ</Text>

        {/* Main certification text */}
        <Text style={styles.certificationText}>
          Nous, <Text style={styles.highlight}>Dermotec Advanced</Text>, centre de formation certifié Qualiopi,
          attestons que :
        </Text>

        <Text style={styles.certificationText}>
          <Text style={styles.highlight}>{lead.prenom} {lead.nom}</Text>
        </Text>

        <Text style={styles.certificationText}>
          a été présent(e) à la formation <Text style={styles.highlight}>« {formation.nom} »</Text> selon
          les modalités détaillées ci-dessous :
        </Text>

        {/* Date Information */}
        <View style={styles.dateInfo}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Période de formation :</Text>
            <Text style={styles.dateValue}>
              Du {formatDate(session.date_debut)} au {formatDate(session.date_fin)}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Durée prévue :</Text>
            <Text style={styles.dateValue}>{formation.duree_heures} heures</Text>
          </View>
        </View>

        {/* Presence Box */}
        <View style={styles.presenceBox}>
          <Text style={styles.presenceTitle}>BILAN DE PRÉSENCE</Text>

          <View style={styles.presenceStats}>
            <View style={styles.presenceStat}>
              <Text style={styles.presenceValue}>{heures_effectuees}h</Text>
              <Text style={styles.presenceLabel}>Heures effectuées</Text>
            </View>
            <View style={styles.presenceStat}>
              <Text style={styles.presenceValue}>{heures_absentes}h</Text>
              <Text style={styles.presenceLabel}>Heures d'absence</Text>
            </View>
            <View style={styles.presenceStat}>
              <Text style={styles.presenceValue}>{formation.duree_heures}h</Text>
              <Text style={styles.presenceLabel}>Heures prévues</Text>
            </View>
          </View>

          <Text style={[styles.presenceTaux, getPresenceStyle(taux_presence)]}>
            Taux de présence : {taux_presence.toFixed(1)}%
          </Text>
          <Text style={[styles.presenceTaux, { fontSize: 12, marginTop: 5 }]}>
            {getPresenceAppreciation(taux_presence)}
          </Text>
        </View>

        {/* Additional info */}
        <Text style={styles.certificationText}>
          Cette attestation est délivrée pour valoir ce que de droit et peut être utilisée dans le cadre
          de démarches administratives ou professionnelles.
        </Text>

        {/* Legal Notice */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Référentiel qualité</Text>
          <Text style={styles.legalText}>
            • Document établi conformément au référentiel national qualité Qualiopi{'\n'}
            • Attestation nominative et non cessible{'\n'}
            • Validité : document authentique émis par un organisme de formation certifié{'\n'}
            • Conservation : 3 ans minimum selon obligations légales
          </Text>
        </View>

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
            <Text style={styles.signatureDate}>Paris, le {today}</Text>
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
export function generateAttestationAssiduiteProps(
  lead: Lead,
  formation: Formation,
  session: Session,
  heures_effectuees: number,
  taux_presence: number,
): AttestationAssiduiteProps {
  return {
    lead: {
      prenom: lead.prenom,
      nom: lead.nom || '',
    },
    formation: {
      nom: formation.nom,
      duree_heures: formation.duree_heures,
    },
    session: {
      date_debut: session.date_debut,
      date_fin: session.date_fin,
    },
    heures_effectuees,
    taux_presence,
  }
}