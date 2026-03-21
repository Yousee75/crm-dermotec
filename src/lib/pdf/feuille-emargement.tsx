import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Formation, Session, Equipe } from '@/types'

// ============================================================
// FEUILLE D'ÉMARGEMENT - PDF Generator
// ============================================================

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  header: {
    marginBottom: 20,
  },
  logo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#082545',
    marginBottom: 6,
  },
  address: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 8,
  },
  separator: {
    height: 2,
    backgroundColor: '#2EC6F3',
    marginBottom: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#082545',
    textAlign: 'center',
    marginBottom: 20,
  },
  formationInfo: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    width: '25%',
    fontWeight: 'bold',
    color: '#374151',
  },
  infoValue: {
    width: '75%',
    color: '#1F2937',
  },
  table: {
    marginTop: 10,
    border: '1 solid #D1D5DB',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottom: '1 solid #D1D5DB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
    minHeight: 35,
  },
  stagiaireName: {
    width: '25%',
    padding: 8,
    borderRight: '1 solid #E5E7EB',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dateColumn: {
    flex: 1,
    borderRight: '1 solid #E5E7EB',
    flexDirection: 'column',
  },
  dateHeader: {
    padding: 4,
    textAlign: 'center',
    fontSize: 7,
    fontWeight: 'bold',
    color: '#374151',
    borderBottom: '1 solid #E5E7EB',
  },
  timeSlots: {
    flexDirection: 'row',
    flex: 1,
  },
  timeSlot: {
    flex: 1,
    padding: 2,
    textAlign: 'center',
    fontSize: 6,
    color: '#6B7280',
    borderRight: '1 solid #F3F4F6',
  },
  signatureCell: {
    flex: 1,
    minHeight: 25,
    borderRight: '1 solid #F3F4F6',
  },
  instructions: {
    marginTop: 20,
    fontSize: 8,
    color: '#6B7280',
  },
  instructionTitle: {
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#082545',
  },
  signatureLine: {
    borderBottom: '1 solid #9CA3AF',
    height: 15,
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7,
    color: '#6B7280',
    textAlign: 'center',
  },
})

interface FeuilleEmargementPDFProps {
  formation: {
    nom: string
  }
  session: {
    date_debut: string
    date_fin: string
    horaire_debut: string
    horaire_fin: string
    salle: string
  }
  formatrice?: {
    prenom: string
    nom: string
  }
  stagiaires: {
    prenom: string
    nom: string
  }[]
  dates: string[]
}

export function FeuilleEmargementPDF({
  formation,
  session,
  formatrice,
  stagiaires,
  dates
}: FeuilleEmargementPDFProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5) // Format HH:MM
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>DERMOTEC ADVANCED</Text>
          <Text style={styles.address}>
            Centre de Formation Certifié Qualiopi • 75 Boulevard Richard Lenoir, 75011 Paris • Tél. : 01 88 33 43 43
          </Text>
          <View style={styles.separator} />
        </View>

        {/* Title */}
        <Text style={styles.title}>FEUILLE D'ÉMARGEMENT</Text>

        {/* Formation Info */}
        <View style={styles.formationInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Formation :</Text>
            <Text style={styles.infoValue}>{formation.nom}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Période :</Text>
            <Text style={styles.infoValue}>
              Du {formatDate(session.date_debut)} au {formatDate(session.date_fin)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Horaires :</Text>
            <Text style={styles.infoValue}>
              {formatTime(session.horaire_debut)} - {formatTime(session.horaire_fin)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lieu :</Text>
            <Text style={styles.infoValue}>{session.salle}</Text>
          </View>
          {formatrice && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Formatrice :</Text>
              <Text style={styles.infoValue}>{formatrice.prenom} {formatrice.nom}</Text>
            </View>
          )}
        </View>

        {/* Emargement Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.stagiaireName}>STAGIAIRES</Text>
            {dates.map((date, index) => (
              <View key={index} style={styles.dateColumn}>
                <Text style={styles.dateHeader}>{formatDate(date)}</Text>
                <View style={styles.timeSlots}>
                  <Text style={styles.timeSlot}>MATIN</Text>
                  <Text style={styles.timeSlot}>A-MIDI</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Table Rows */}
          {stagiaires.map((stagiaire, stagiaireIndex) => (
            <View key={stagiaireIndex} style={styles.tableRow}>
              <Text style={styles.stagiaireName}>
                {stagiaire.prenom} {stagiaire.nom?.toUpperCase()}
              </Text>
              {dates.map((_, dateIndex) => (
                <View key={dateIndex} style={styles.dateColumn}>
                  <View style={styles.timeSlots}>
                    <View style={styles.signatureCell} />
                    <View style={styles.signatureCell} />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Instructions :</Text>
          <Text>
            • Chaque stagiaire doit signer dans les cases correspondantes à sa présence{'\n'}
            • Signature obligatoire matin ET après-midi{'\n'}
            • En cas d'absence, laisser la case vide{'\n'}
            • Document à conserver 3 ans minimum (obligation Qualiopi)
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>La formatrice</Text>
            <View style={styles.signatureLine} />
            <Text>Nom, prénom et signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Responsable pédagogique</Text>
            <View style={styles.signatureLine} />
            <Text>Nom, prénom et signature</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Dermotec Advanced — Centre de formation certifié Qualiopi • Page 1/1 •
          Document conforme aux exigences Qualiopi
        </Text>
      </Page>
    </Document>
  )
}

// Helper pour générer les props depuis les données CRM
export function generateFeuilleEmargementProps(
  formation: Formation,
  session: Session,
  stagiaires: { prenom: string; nom: string }[],
  formatrice?: Equipe,
): FeuilleEmargementPDFProps {
  // Générer les dates de formation
  const dates: string[] = []
  const startDate = new Date(session.date_debut)
  const endDate = new Date(session.date_fin)

  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    // Exclure les weekends (optionnel selon le planning)
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = dimanche, 6 = samedi
      dates.push(currentDate.toISOString().split('T')[0])
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return {
    formation: {
      nom: formation.nom,
    },
    session: {
      date_debut: session.date_debut,
      date_fin: session.date_fin,
      horaire_debut: session.horaire_debut,
      horaire_fin: session.horaire_fin,
      salle: session.salle,
    },
    formatrice: formatrice ? {
      prenom: formatrice.prenom,
      nom: formatrice.nom,
    } : undefined,
    stagiaires,
    dates,
  }
}