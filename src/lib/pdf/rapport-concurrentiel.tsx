import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface RapportConcurrentielProps {
  prospect: {
    nom: string
    adresse?: string
    siret?: string
    codeApe?: string
  }
  competitors: Array<{
    nom: string
    rank?: number
    distanceM: number
    adresse?: string
    googleRating?: number
    googleReviewsCount?: number
    pjRating?: number
    pjReviewsCount?: number
    planityFound?: boolean
    treatwellFound?: boolean
    chiffreAffaires?: number
    effectif?: number
    formeJuridique?: string
    instagram?: { username: string; followers?: number; posts?: number }
    facebook?: { followers?: number }
    reputationScore: number
    scores?: { reputation: number; presence: number; activity: number; financial: number; neighborhood: number; global: number }
    aiAnalysis?: {
      description?: string
      pointsForts?: string[]
      pointsFaibles?: string[]
      niveauMenace?: string
      conseilsProspection?: string[]
    }
  }>
  kpis: {
    totalCompetitors: number
    avgGoogleRating: number
    avgReviewsCount: number
    avgCA: number
    avgReputationScore: number
  }
  neighborhood?: {
    metros: number
    restaurants: number
    beautyCompetitors: number
    pharmacies: number
    footTrafficScore: number
  }
  generatedAt: string
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 40,
    fontSize: 10,
    lineHeight: 1.4,
    color: '#1F2937'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottom: '2px solid #FF5C00'
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5C00'
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#6B7280'
  },
  // Page de couverture
  cover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF5C00',
    marginBottom: 10
  },
  coverSubtitle: {
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 30
  },
  coverProspect: {
    fontSize: 14,
    marginBottom: 5,
    color: '#1F2937'
  },
  coverDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 30
  },
  coverLine: {
    width: 100,
    height: 3,
    backgroundColor: '#FF5C00',
    marginVertical: 20
  },
  coverConfidential: {
    position: 'absolute',
    bottom: 20,
    fontSize: 8,
    color: '#6B7280'
  },
  // Sections
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20
  },
  // KPIs
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 10,
    margin: 5,
    borderRadius: 4,
    alignItems: 'center'
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  kpiLabel: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 5
  },
  // Texte
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 15,
    textAlign: 'justify'
  },
  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  verdictLabel: {
    fontSize: 10,
    marginRight: 10
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold'
  },
  badgeGreen: {
    backgroundColor: '#22C55E',
    color: 'white'
  },
  badgeOrange: {
    backgroundColor: '#F59E0B',
    color: 'white'
  },
  badgeRed: {
    backgroundColor: '#EF4444',
    color: 'white'
  },
  // Tableau
  table: {
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
    paddingHorizontal: 5
  },
  tableHeaderCell: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottom: '1px solid #E5E7EB'
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB'
  },
  tableCell: {
    fontSize: 8,
    color: '#374151'
  },
  // Colonnes tableau
  colRank: { width: '8%' },
  colNom: { width: '25%' },
  colDistance: { width: '10%' },
  colGoogle: { width: '10%' },
  colPJ: { width: '10%' },
  colPlanity: { width: '8%' },
  colTreatwell: { width: '8%' },
  colCA: { width: '12%' },
  colScore: { width: '9%' },
  // Fiches détaillées
  competitorCard: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#FAFAFA',
    borderRadius: 6
  },
  competitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  competitorName: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1
  },
  rankBadge: {
    backgroundColor: '#1A1A1A',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    marginRight: 8
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold'
  },
  competitorContent: {
    flexDirection: 'row'
  },
  competitorLeft: {
    flex: 1,
    marginRight: 15
  },
  competitorRight: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3
  },
  infoLabel: {
    fontSize: 8,
    color: '#6B7280',
    width: 60
  },
  infoValue: {
    fontSize: 8,
    flex: 1
  },
  // IA Analysis
  aiSection: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 4
  },
  aiTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5
  },
  aiDescription: {
    fontSize: 8,
    marginBottom: 8,
    lineHeight: 1.3
  },
  pointsList: {
    marginBottom: 5
  },
  point: {
    fontSize: 8,
    marginBottom: 2,
    paddingLeft: 8
  },
  pointForte: {
    color: '#22C55E'
  },
  pointFaible: {
    color: '#EF4444'
  },
  menaceLevel: {
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 5
  },
  // Quartier
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20
  },
  statBox: {
    width: '45%',
    margin: '2.5%',
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A'
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 5
  },
  trafficScore: {
    marginBottom: 15
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden'
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#FF5C00'
  },
  // Glossaire
  glossary: {
    marginBottom: 30
  },
  glossaryTerm: {
    marginBottom: 10
  },
  glossaryTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1A1A1A'
  },
  glossaryDefinition: {
    fontSize: 9,
    color: '#374151',
    marginTop: 2,
    lineHeight: 1.3
  },
  // Contact
  contact: {
    backgroundColor: '#FF5C00',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center'
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8
  },
  contactSubtitle: {
    fontSize: 10,
    color: 'white',
    marginBottom: 10
  },
  contactInfo: {
    fontSize: 9,
    color: 'white'
  }
})

const formatCurrency = (value?: number): string => {
  if (!value) return 'N/A'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M€`
  if (value >= 1000) return `${Math.round(value / 1000)} K€`
  return `${value}€`
}

const formatDistance = (distanceM: number): string => {
  if (distanceM >= 1000) return `${(distanceM / 1000).toFixed(1)} km`
  return `${distanceM} m`
}

const renderStars = (rating?: number): string => {
  if (!rating) return 'N/A'
  const full = Math.floor(rating)
  const empty = 5 - Math.ceil(rating)
  return '★'.repeat(full) + '☆'.repeat(empty)
}

const getScoreBadgeStyle = (score: number) => {
  if (score >= 70) return { ...styles.scoreBadge, backgroundColor: '#22C55E', color: 'white' }
  if (score >= 40) return { ...styles.scoreBadge, backgroundColor: '#F59E0B', color: 'white' }
  return { ...styles.scoreBadge, backgroundColor: '#EF4444', color: 'white' }
}

const getConcurrenceLevel = (totalCompetitors: number): { level: string, style: any } => {
  if (totalCompetitors <= 3) return { level: 'Faible', style: styles.badgeGreen }
  if (totalCompetitors <= 8) return { level: 'Moyen', style: styles.badgeOrange }
  return { level: 'Fort', style: styles.badgeRed }
}

const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerLogo}>SATOREA</Text>
  </View>
)

const Footer = ({ pageNumber, total, date }: { pageNumber: number, total: number, date: string }) => (
  <View style={styles.footer}>
    <Text>Rapport généré par Satorea CRM — {date}</Text>
    <Text>{pageNumber} / {total}</Text>
  </View>
)

export function RapportConcurrentiel(props: RapportConcurrentielProps) {
  const { prospect, competitors, kpis, neighborhood, generatedAt } = props
  const concurrence = getConcurrenceLevel(kpis.totalCompetitors)

  // Calculer le nombre total de pages
  const competitorsPerPage = 2
  const competitorPages = Math.ceil(competitors.length / competitorsPerPage)
  const totalPages = 4 + competitorPages + 2 // couverture + résumé + tableau + fiches + quartier + glossaire

  return (
    <Document>
      {/* PAGE 1 - COUVERTURE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.coverTitle}>SATOREA</Text>
          <Text style={styles.coverSubtitle}>Rapport d'Analyse Concurrentielle</Text>
          <View style={styles.coverLine} />
          <Text style={styles.coverProspect}>{prospect.nom}</Text>
          {prospect.adresse && <Text style={styles.coverProspect}>{prospect.adresse}</Text>}
          {prospect.siret && <Text style={styles.coverProspect}>SIRET : {prospect.siret}</Text>}
          <Text style={styles.coverDate}>{generatedAt}</Text>
        </View>
        <Text style={styles.coverConfidential}>Confidentiel — Usage interne</Text>
      </Page>

      {/* PAGE 2 - RÉSUMÉ EXÉCUTIF */}
      <Page size="A4" style={styles.page}>
        <Header />
        <Text style={styles.title}>Résumé Exécutif</Text>

        <View style={styles.kpiContainer}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{kpis.totalCompetitors}</Text>
            <Text style={styles.kpiLabel}>Nb Concurrents</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{kpis.avgGoogleRating.toFixed(1)}</Text>
            <Text style={styles.kpiLabel}>Note Moyenne</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{Math.round(kpis.avgReviewsCount)}</Text>
            <Text style={styles.kpiLabel}>Avis Moyen</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{formatCurrency(kpis.avgCA)}</Text>
            <Text style={styles.kpiLabel}>CA Moyen</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{Math.round(kpis.avgReputationScore)}</Text>
            <Text style={styles.kpiLabel}>Score Moyen</Text>
          </View>
        </View>

        <Text style={styles.summary}>
          Votre établissement {prospect.nom} est situé dans une zone avec {kpis.totalCompetitors} concurrents directs
          dans un rayon de 5 km. La note moyenne Google de ces concurrents est de {kpis.avgGoogleRating.toFixed(1)}/5
          avec une moyenne de {Math.round(kpis.avgReviewsCount)} avis clients. Le chiffre d'affaires moyen s'élève à {formatCurrency(kpis.avgCA)}.
        </Text>

        <Text style={styles.summary}>
          Cette analyse vous permet d'identifier les forces et faiblesses de vos concurrents directs,
          leurs stratégies de présence digitale, et les opportunités de différenciation pour votre centre de formation.
        </Text>

        <View style={styles.verdict}>
          <Text style={styles.verdictLabel}>Niveau de concurrence :</Text>
          <View style={[styles.badge, concurrence.style]}>
            <Text>{concurrence.level}</Text>
          </View>
        </View>

        <Footer pageNumber={2} total={totalPages} date={generatedAt} />
      </Page>

      {/* PAGE 3 - TABLEAU COMPARATIF */}
      <Page size="A4" style={styles.page}>
        <Header />
        <Text style={styles.title}>Comparatif des Concurrents</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colRank]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colNom]}>Nom</Text>
            <Text style={[styles.tableHeaderCell, styles.colDistance]}>Distance</Text>
            <Text style={[styles.tableHeaderCell, styles.colGoogle]}>Google ★</Text>
            <Text style={[styles.tableHeaderCell, styles.colPJ]}>PJ ★</Text>
            <Text style={[styles.tableHeaderCell, styles.colPlanity]}>Planity</Text>
            <Text style={[styles.tableHeaderCell, styles.colTreatwell]}>Treatwell</Text>
            <Text style={[styles.tableHeaderCell, styles.colCA]}>CA</Text>
            <Text style={[styles.tableHeaderCell, styles.colScore]}>Score</Text>
          </View>

          {competitors.map((comp, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.colRank]}>{comp.rank || idx + 1}</Text>
              <Text style={[styles.tableCell, styles.colNom]}>{comp.nom}</Text>
              <Text style={[styles.tableCell, styles.colDistance]}>{formatDistance(comp.distanceM)}</Text>
              <Text style={[styles.tableCell, styles.colGoogle]}>
                {comp.googleRating ? `${comp.googleRating}/5` : 'N/A'}
              </Text>
              <Text style={[styles.tableCell, styles.colPJ]}>
                {comp.pjRating ? `${comp.pjRating}/5` : 'N/A'}
              </Text>
              <Text style={[styles.tableCell, styles.colPlanity]}>
                {comp.planityFound ? 'Oui' : 'Non'}
              </Text>
              <Text style={[styles.tableCell, styles.colTreatwell]}>
                {comp.treatwellFound ? 'Oui' : 'Non'}
              </Text>
              <Text style={[styles.tableCell, styles.colCA]}>{formatCurrency(comp.chiffreAffaires)}</Text>
              <Text style={[
                styles.tableCell,
                styles.colScore,
                comp.reputationScore >= 70 ? { color: '#22C55E' } :
                comp.reputationScore >= 40 ? { color: '#F59E0B' } : { color: '#EF4444' }
              ]}>
                {Math.round(comp.reputationScore)}
              </Text>
            </View>
          ))}
        </View>

        <Footer pageNumber={3} total={totalPages} date={generatedAt} />
      </Page>

      {/* PAGES 4+ - FICHES DÉTAILLÉES */}
      {Array.from({ length: competitorPages }, (_, pageIdx) => {
        const startIdx = pageIdx * competitorsPerPage
        const pageCompetitors = competitors.slice(startIdx, startIdx + competitorsPerPage)

        return (
          <Page key={`competitors-${pageIdx}`} size="A4" style={styles.page}>
            <Header />
            <Text style={styles.title}>Fiches Détaillées {pageIdx === 0 ? '' : `(Suite ${pageIdx + 1})`}</Text>

            {pageCompetitors.map((comp, idx) => (
              <View key={startIdx + idx} style={styles.competitorCard}>
                <View style={styles.competitorHeader}>
                  <Text style={styles.competitorName}>{comp.nom}</Text>
                  <View style={styles.rankBadge}>
                    <Text>#{comp.rank || startIdx + idx + 1}</Text>
                  </View>
                  <View style={getScoreBadgeStyle(comp.reputationScore)}>
                    <Text>{Math.round(comp.reputationScore)}/100</Text>
                  </View>
                </View>

                <View style={styles.competitorContent}>
                  <View style={styles.competitorLeft}>
                    <Text style={styles.sectionTitle}>Contact</Text>
                    {comp.adresse && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Adresse :</Text>
                        <Text style={styles.infoValue}>{comp.adresse}</Text>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Distance :</Text>
                      <Text style={styles.infoValue}>{formatDistance(comp.distanceM)}</Text>
                    </View>
                  </View>

                  <View style={styles.competitorRight}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Google :</Text>
                      <Text style={styles.infoValue}>
                        {comp.googleRating ? `${renderStars(comp.googleRating)} ${comp.googleRating}/5` : 'N/A'}
                        {comp.googleReviewsCount ? ` (${comp.googleReviewsCount} avis)` : ''}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Pages Jaunes :</Text>
                      <Text style={styles.infoValue}>
                        {comp.pjRating ? `${renderStars(comp.pjRating)} ${comp.pjRating}/5` : 'N/A'}
                        {comp.pjReviewsCount ? ` (${comp.pjReviewsCount} avis)` : ''}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Plateformes :</Text>
                      <Text style={styles.infoValue}>
                        {comp.planityFound ? 'Planity ' : ''}
                        {comp.treatwellFound ? 'Treatwell' : ''}
                        {!comp.planityFound && !comp.treatwellFound ? 'Aucune' : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Social */}
                {(comp.instagram || comp.facebook) && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.sectionTitle}>Réseaux Sociaux</Text>
                    {comp.instagram && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Instagram :</Text>
                        <Text style={styles.infoValue}>
                          @{comp.instagram.username}
                          {comp.instagram.followers ? ` (${comp.instagram.followers} abonnés)` : ''}
                          {comp.instagram.posts ? ` - ${comp.instagram.posts} posts` : ''}
                        </Text>
                      </View>
                    )}
                    {comp.facebook && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Facebook :</Text>
                        <Text style={styles.infoValue}>
                          {comp.facebook.followers ? `${comp.facebook.followers} abonnés` : 'Présent'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Informations légales */}
                {(comp.chiffreAffaires || comp.effectif || comp.formeJuridique) && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.sectionTitle}>Informations Légales</Text>
                    {comp.chiffreAffaires && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>CA :</Text>
                        <Text style={styles.infoValue}>{formatCurrency(comp.chiffreAffaires)}</Text>
                      </View>
                    )}
                    {comp.effectif && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Effectif :</Text>
                        <Text style={styles.infoValue}>{comp.effectif} salariés</Text>
                      </View>
                    )}
                    {comp.formeJuridique && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Forme :</Text>
                        <Text style={styles.infoValue}>{comp.formeJuridique}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Analyse IA */}
                {comp.aiAnalysis && (
                  <View style={styles.aiSection}>
                    <Text style={styles.aiTitle}>Analyse IA</Text>
                    {comp.aiAnalysis.description && (
                      <Text style={styles.aiDescription}>{comp.aiAnalysis.description}</Text>
                    )}

                    {comp.aiAnalysis.pointsForts && comp.aiAnalysis.pointsForts.length > 0 && (
                      <View style={styles.pointsList}>
                        <Text style={[styles.sectionTitle, { fontSize: 8 }]}>Points Forts :</Text>
                        {comp.aiAnalysis.pointsForts.map((point, i) => (
                          <Text key={i} style={[styles.point, styles.pointForte]}>• {point}</Text>
                        ))}
                      </View>
                    )}

                    {comp.aiAnalysis.pointsFaibles && comp.aiAnalysis.pointsFaibles.length > 0 && (
                      <View style={styles.pointsList}>
                        <Text style={[styles.sectionTitle, { fontSize: 8 }]}>Points Faibles :</Text>
                        {comp.aiAnalysis.pointsFaibles.map((point, i) => (
                          <Text key={i} style={[styles.point, styles.pointFaible]}>• {point}</Text>
                        ))}
                      </View>
                    )}

                    {comp.aiAnalysis.niveauMenace && (
                      <Text style={styles.menaceLevel}>
                        Niveau de menace : {comp.aiAnalysis.niveauMenace}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}

            <Footer pageNumber={4 + pageIdx} total={totalPages} date={generatedAt} />
          </Page>
        )
      })}

      {/* PAGE AVANT-DERNIÈRE - ANALYSE DU QUARTIER */}
      {neighborhood && (
        <Page size="A4" style={styles.page}>
          <Header />
          <Text style={styles.title}>Analyse du Quartier</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{neighborhood.metros}</Text>
              <Text style={styles.statLabel}>Stations de métro</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{neighborhood.restaurants}</Text>
              <Text style={styles.statLabel}>Restaurants</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{neighborhood.beautyCompetitors}</Text>
              <Text style={styles.statLabel}>Salons beauté</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{neighborhood.pharmacies}</Text>
              <Text style={styles.statLabel}>Pharmacies</Text>
            </View>
          </View>

          <View style={styles.trafficScore}>
            <Text style={styles.sectionTitle}>Score Trafic Piéton : {neighborhood.footTrafficScore}/100</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${neighborhood.footTrafficScore}%` }]} />
            </View>
          </View>

          <Text style={styles.summary}>
            Le quartier présente un niveau d'activité {neighborhood.footTrafficScore >= 70 ? 'élevé' :
            neighborhood.footTrafficScore >= 40 ? 'modéré' : 'faible'} avec {neighborhood.metros} stations de métro
            à proximité. La présence de {neighborhood.restaurants} restaurants et {neighborhood.pharmacies} pharmacies
            indique un quartier dynamique propice au passage et à la clientèle potentielle.
          </Text>

          <Footer pageNumber={totalPages - 1} total={totalPages} date={generatedAt} />
        </Page>
      )}

      {/* DERNIÈRE PAGE - GLOSSAIRE + CONTACT */}
      <Page size="A4" style={styles.page}>
        <Header />
        <Text style={styles.title}>Glossaire</Text>

        <View style={styles.glossary}>
          <View style={styles.glossaryTerm}>
            <Text style={styles.glossaryTitle}>SIRET</Text>
            <Text style={styles.glossaryDefinition}>
              Système d'Identification du Répertoire des Établissements. Numéro unique de 14 chiffres identifiant un établissement.
            </Text>
          </View>

          <View style={styles.glossaryTerm}>
            <Text style={styles.glossaryTitle}>Score de réputation</Text>
            <Text style={styles.glossaryDefinition}>
              Indicateur calculé sur 100 points intégrant les avis clients, la présence digitale, l'activité commerciale et la santé financière.
            </Text>
          </View>

          <View style={styles.glossaryTerm}>
            <Text style={styles.glossaryTitle}>Qualiopi</Text>
            <Text style={styles.glossaryDefinition}>
              Certification qualité des organismes de formation. Obligatoire pour bénéficier des financements publics et mutualisés.
            </Text>
          </View>

          <View style={styles.glossaryTerm}>
            <Text style={styles.glossaryTitle}>CPF</Text>
            <Text style={styles.glossaryDefinition}>
              Compte Personnel de Formation. Dispositif permettant aux salariés de financer leurs formations professionnelles.
            </Text>
          </View>

          <View style={styles.glossaryTerm}>
            <Text style={styles.glossaryTitle}>OPCO</Text>
            <Text style={styles.glossaryDefinition}>
              Opérateur de Compétences. Organisme collectant les contributions formation des entreprises et finançant les formations.
            </Text>
          </View>
        </View>

        <View style={styles.contact}>
          <Text style={styles.contactTitle}>Contact Satorea</Text>
          <Text style={styles.contactSubtitle}>Le CRM intelligent pour les centres de formation esthétique</Text>
          <Text style={styles.contactInfo}>www.satorea.fr — contact@satorea.fr</Text>
        </View>

        <Footer pageNumber={totalPages} total={totalPages} date={generatedAt} />
      </Page>
    </Document>
  )
}