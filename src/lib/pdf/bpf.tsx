import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ============================================================
// BILAN PÉDAGOGIQUE ET FINANCIER (BPF) - PDF Generator
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
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#082545',
    marginBottom: 15,
    backgroundColor: '#F8FAFC',
    padding: 8,
    textDecoration: 'underline',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  statBox: {
    width: '48%',
    marginBottom: 10,
    marginRight: '2%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 4,
    border: '1 solid #E5E7EB',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#082545',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#082545',
    padding: 8,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
    padding: 8,
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    fontSize: 9,
    color: '#1F2937',
  },
  tableCellNumber: {
    fontSize: 9,
    color: '#1F2937',
    textAlign: 'right',
  },
  col1: { width: '40%' },
  col2: { width: '20%' },
  col3: { width: '20%' },
  col4: { width: '20%' },
  qualityIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F0F9FF',
    border: '1 solid #2EC6F3',
    borderRadius: 4,
  },
  qualityLabel: {
    fontSize: 10,
    color: '#082545',
    fontWeight: 'bold',
  },
  qualityValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  excellentValue: {
    color: '#10B981',
  },
  goodValue: {
    color: '#F59E0B',
  },
  averageValue: {
    color: '#EF4444',
  },
  summary: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    marginTop: 20,
    borderLeft: '4 solid #F59E0B',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
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

interface BPFProps {
  annee: number
  stats: {
    nb_stagiaires: number
    nb_heures_total: number
    nb_sessions: number
    ca_total: number
    nb_formations: number
    taux_satisfaction: number
    taux_reussite: number
    repartition_financements: {
      organisme: string
      montant: number
      nb_dossiers: number
    }[]
  }
}

export function BpfPDF({ annee, stats }: BPFProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getQualityColor = (value: number, isPercentage = true) => {
    const threshold = isPercentage ? 85 : 4.5
    if (value >= threshold) return styles.excellentValue
    if (value >= (isPercentage ? 70 : 3.5)) return styles.goodValue
    return styles.averageValue
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const totalFinancement = stats.repartition_financements.reduce((sum, item) => sum + item.montant, 0)
  const totalDossiers = stats.repartition_financements.reduce((sum, item) => sum + item.nb_dossiers, 0)

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
        <Text style={styles.title}>
          BILAN PÉDAGOGIQUE ET FINANCIER — Année {annee}
        </Text>

        {/* Section Activité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ACTIVITÉ PÉDAGOGIQUE</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatNumber(stats.nb_stagiaires)}</Text>
              <Text style={styles.statLabel}>Stagiaires formés</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatNumber(stats.nb_sessions)}</Text>
              <Text style={styles.statLabel}>Sessions réalisées</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatNumber(stats.nb_heures_total)}</Text>
              <Text style={styles.statLabel}>Heures de formation</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatNumber(stats.nb_formations)}</Text>
              <Text style={styles.statLabel}>Formations proposées</Text>
            </View>
          </View>
        </View>

        {/* Section Financière */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. BILAN FINANCIER</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatCurrency(stats.ca_total)}</Text>
              <Text style={styles.statLabel}>Chiffre d'affaires total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatCurrency(totalFinancement)}</Text>
              <Text style={styles.statLabel}>Montant financements</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { fontSize: 12, marginTop: 15 }]}>
            Répartition par organisme financeur
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Organisme</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Nb dossiers</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>Montant</Text>
              <Text style={[styles.tableHeaderText, styles.col4]}>% du total</Text>
            </View>

            {stats.repartition_financements.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, styles.col1]}>{item.organisme}</Text>
                <Text style={[styles.tableCellNumber, styles.col2]}>{item.nb_dossiers}</Text>
                <Text style={[styles.tableCellNumber, styles.col3]}>{formatCurrency(item.montant)}</Text>
                <Text style={[styles.tableCellNumber, styles.col4]}>
                  {formatPercentage((item.montant / totalFinancement) * 100)}
                </Text>
              </View>
            ))}

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1, { fontWeight: 'bold' }]}>TOTAL</Text>
              <Text style={[styles.tableCellNumber, styles.col2, { fontWeight: 'bold' }]}>{totalDossiers}</Text>
              <Text style={[styles.tableCellNumber, styles.col3, { fontWeight: 'bold' }]}>{formatCurrency(totalFinancement)}</Text>
              <Text style={[styles.tableCellNumber, styles.col4, { fontWeight: 'bold' }]}>100%</Text>
            </View>
          </View>
        </View>

        {/* Section Qualité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. INDICATEURS QUALITÉ</Text>

          <View style={styles.qualityIndicator}>
            <Text style={styles.qualityLabel}>Taux de satisfaction</Text>
            <Text style={[styles.qualityValue, getQualityColor(stats.taux_satisfaction)]}>
              {formatPercentage(stats.taux_satisfaction)}
            </Text>
          </View>

          <View style={styles.qualityIndicator}>
            <Text style={styles.qualityLabel}>Taux de réussite</Text>
            <Text style={[styles.qualityValue, getQualityColor(stats.taux_reussite)]}>
              {formatPercentage(stats.taux_reussite)}
            </Text>
          </View>
        </View>

        {/* Synthèse */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>SYNTHÈSE</Text>
          <Text style={styles.summaryText}>
            L'année {annee} confirme le dynamisme de Dermotec Advanced avec {formatNumber(stats.nb_stagiaires)} stagiaires formés
            pour un chiffre d'affaires de {formatCurrency(stats.ca_total)}.
            Les indicateurs qualité restent excellents avec un taux de satisfaction de {formatPercentage(stats.taux_satisfaction)}
            et un taux de réussite de {formatPercentage(stats.taux_reussite)}, témoignant de la qualité de nos formations.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Responsable pédagogique</Text>
            <Text style={styles.signatureDate}>Paris, le {today}</Text>
            <View style={styles.signatureLine} />
            <Text>Nom, prénom et signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Direction</Text>
            <Text style={styles.signatureDate}>Paris, le {today}</Text>
            <View style={styles.signatureLine} />
            <Text>Cachet et signature</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Dermotec Advanced — Centre de formation certifié Qualiopi • Page 1/1 •
          BPF conforme aux obligations légales
        </Text>
      </Page>
    </Document>
  )
}

// Helper pour générer les props depuis les données CRM
export function generateBPFProps(
  annee: number,
  statsData: {
    nb_stagiaires: number
    nb_heures_total: number
    nb_sessions: number
    ca_total: number
    nb_formations: number
    taux_satisfaction: number
    taux_reussite: number
    repartition_financements: {
      organisme: string
      montant: number
      nb_dossiers: number
    }[]
  }
): BPFProps {
  return {
    annee,
    stats: statsData
  }
}

// Helper pour calculer les statistiques depuis les données CRM
export async function calculateBPFStats(annee: number): Promise<BPFProps['stats']> {
  // Cette fonction devrait interroger la base de données pour calculer les stats
  // Exemple d'implémentation avec Supabase

  return {
    nb_stagiaires: 0,
    nb_heures_total: 0,
    nb_sessions: 0,
    ca_total: 0,
    nb_formations: 0,
    taux_satisfaction: 0,
    taux_reussite: 0,
    repartition_financements: []
  }
}