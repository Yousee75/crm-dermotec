import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Lead, Formation, Session, Equipe } from '@/types'

// ============================================================
// CONVOCATION À LA FORMATION - PDF Generator
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
    marginBottom: 30,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  address: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 10,
  },
  separator: {
    height: 2,
    backgroundColor: '#FF5C00',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
    textDecoration: 'underline',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    width: '70%',
    color: '#1F2937',
  },
  materielList: {
    marginLeft: 20,
    marginTop: 10,
  },
  materielItem: {
    marginBottom: 5,
    color: '#374151',
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1A1A1A',
  },
  signatureLine: {
    borderBottom: '1 solid #9CA3AF',
    height: 20,
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

interface ConvocationPDFProps {
  lead: {
    prenom: string
    nom: string
    email?: string
    telephone?: string
  }
  formation: {
    nom: string
    duree_jours: number
    duree_heures: number
  }
  session: {
    date_debut: string
    date_fin: string
    horaire_debut: string
    horaire_fin: string
    salle: string
    adresse: string
  }
  formatrice?: {
    prenom: string
    nom: string
  }
}

export function ConvocationPDF({ lead, formation, session, formatrice }: ConvocationPDFProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5) // Format HH:MM
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>DERMOTEC ADVANCED</Text>
          <Text style={styles.address}>
            Centre de Formation Certifié Qualiopi{'\n'}
            75 Boulevard Richard Lenoir, 75011 Paris{'\n'}
            Tél. : 01 88 33 43 43
          </Text>
          <View style={styles.separator} />
        </View>

        {/* Title */}
        <Text style={styles.title}>CONVOCATION À LA FORMATION</Text>

        {/* Destinataire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom :</Text>
            <Text style={styles.value}>{lead.prenom} {lead.nom}</Text>
          </View>
          {lead.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email :</Text>
              <Text style={styles.value}>{lead.email}</Text>
            </View>
          )}
          {lead.telephone && (
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone :</Text>
              <Text style={styles.value}>{lead.telephone}</Text>
            </View>
          )}
        </View>

        {/* Formation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la formation</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Formation :</Text>
            <Text style={styles.value}>{formation.nom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Durée :</Text>
            <Text style={styles.value}>
              {formation.duree_jours} jour{formation.duree_jours > 1 ? 's' : ''}
              ({formation.duree_heures} heures)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de début :</Text>
            <Text style={styles.value}>{formatDate(session.date_debut)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de fin :</Text>
            <Text style={styles.value}>{formatDate(session.date_fin)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Horaires :</Text>
            <Text style={styles.value}>
              {formatTime(session.horaire_debut)} - {formatTime(session.horaire_fin)}
            </Text>
          </View>
        </View>

        {/* Lieu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lieu de formation</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Salle :</Text>
            <Text style={styles.value}>{session.salle}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adresse :</Text>
            <Text style={styles.value}>{session.adresse}</Text>
          </View>
        </View>

        {/* Formatrice */}
        {formatrice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Formatrice</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nom :</Text>
              <Text style={styles.value}>{formatrice.prenom} {formatrice.nom}</Text>
            </View>
          </View>
        )}

        {/* Matériel à apporter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matériel à apporter</Text>
          <View style={styles.materielList}>
            <Text style={styles.materielItem}>• Pièce d'identité en cours de validité</Text>
            <Text style={styles.materielItem}>• Carnet de notes et stylo</Text>
            <Text style={styles.materielItem}>• Tenue professionnelle (blouse blanche)</Text>
            <Text style={styles.materielItem}>• Chaussures fermées</Text>
          </View>
        </View>

        {/* Informations importantes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations importantes</Text>
          <Text style={styles.value}>
            • Merci de vous présenter 15 minutes avant le début de la formation{'\n'}
            • En cas d'empêchement, merci de nous prévenir au 01 88 33 43 43{'\n'}
            • Le petit-déjeuner et les pauses sont offerts{'\n'}
            • Un certificat vous sera remis en fin de formation
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le stagiaire</Text>
            <View style={styles.signatureLine} />
            <Text>(Signature précédée de "Lu et approuvé")</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Dermotec Advanced</Text>
            <View style={styles.signatureLine} />
            <Text>Direction de la formation</Text>
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
export function generateConvocationProps(
  lead: Lead,
  session: Session,
  formation: Formation,
  formatrice?: Equipe,
): ConvocationPDFProps {
  return {
    lead: {
      prenom: lead.prenom,
      nom: lead.nom || '',
      email: lead.email,
      telephone: lead.telephone,
    },
    formation: {
      nom: formation.nom,
      duree_jours: formation.duree_jours,
      duree_heures: formation.duree_heures,
    },
    session: {
      date_debut: session.date_debut,
      date_fin: session.date_fin,
      horaire_debut: session.horaire_debut,
      horaire_fin: session.horaire_fin,
      salle: session.salle,
      adresse: session.adresse,
    },
    formatrice: formatrice ? {
      prenom: formatrice.prenom,
      nom: formatrice.nom,
    } : undefined,
  }
}