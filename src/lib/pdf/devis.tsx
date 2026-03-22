import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// ============================================================
// CRM DERMOTEC — Template PDF Devis
// Style professionnel Dermotec Advanced
// ============================================================

export interface DevisProps {
  devisId: string;
  date: string;
  validiteJours: number;
  emetteur: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
    siret: string;
    nda: string;
    rcs: string;
    tva_intracom: string;
  };
  prospect: {
    nom: string;
    prenom?: string;
    entreprise?: string;
    adresse?: string;
    siret?: string;
    email?: string;
    telephone?: string;
  };
  formation: {
    nom: string;
    dureeJours: number;
    dureeHeures: number;
    prixHt: number;
    description?: string;
  };
  session?: {
    dateDebut: string;
    dateFin: string;
    formatrice?: string;
    lieu?: string;
  };
  financement?: {
    type: string;
    montant: number;
  };
  echeances?: number;
}

// Emetteur par defaut — Dermotec Advanced
export const EMETTEUR_DERMOTEC = {
  nom: 'Dermotec Advanced',
  adresse: '75 Boulevard Richard Lenoir, 75011 Paris',
  telephone: '01 88 33 43 43',
  email: 'contact@dermotec-advanced.com',
  siret: '851 306 860 00012',
  nda: '11755959875',
  rcs: 'RCS Paris 851 306 860',
  tva_intracom: 'FR 85 851306860',
};

const PRIMARY = '#2EC6F3';
const ACCENT = '#082545';
const GRAY_500 = '#6B7280';
const GRAY_300 = '#D1D5DB';
const GRAY_100 = '#F3F4F6';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1F2937',
    backgroundColor: WHITE,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    width: '55%',
  },
  headerRight: {
    width: '40%',
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 9,
    color: PRIMARY,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  companyInfo: {
    fontSize: 8,
    color: GRAY_500,
    marginBottom: 2,
  },
  devisRef: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 4,
  },
  devisDate: {
    fontSize: 9,
    color: GRAY_500,
    marginBottom: 2,
  },

  // ── Separator ──
  separator: {
    height: 3,
    backgroundColor: PRIMARY,
    marginVertical: 15,
    borderRadius: 2,
  },
  thinSeparator: {
    height: 1,
    backgroundColor: GRAY_300,
    marginVertical: 12,
  },

  // ── Parties (emetteur + destinataire) ──
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  partieBox: {
    width: '47%',
    padding: 12,
    borderRadius: 4,
  },
  emetteurBox: {
    backgroundColor: GRAY_100,
  },
  destinataireBox: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
  },
  partieLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: GRAY_500,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as any,
  },
  partieName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 3,
  },
  partieInfo: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
  },

  // ── Formation ──
  formationSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#F0FDFA',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#14B8A6',
  },
  formationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  formationName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 6,
  },
  formationRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  formationLabel: {
    width: '25%',
    fontSize: 9,
    color: GRAY_500,
  },
  formationValue: {
    width: '75%',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
  },

  // ── Table prix ──
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    color: WHITE,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: WHITE,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  col1: { width: '45%', fontSize: 9 },
  col2: { width: '15%', textAlign: 'center', fontSize: 9 },
  col3: { width: '20%', textAlign: 'right', fontSize: 9 },
  col4: { width: '20%', textAlign: 'right', fontSize: 9 },

  // ── Totaux ──
  totauxContainer: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  totauxBox: {
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 10,
  },
  totalLabel: {
    fontSize: 10,
    color: GRAY_500,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalTTCRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: PRIMARY,
    borderRadius: 4,
    marginTop: 4,
  },
  totalTTCLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: WHITE,
  },
  totalTTCValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: WHITE,
  },

  // ── Financement ──
  financementBox: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#FEF9C3',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: 4,
  },
  financementTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 6,
  },
  financementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  financementLabel: {
    fontSize: 9,
    color: '#92400E',
  },
  financementValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400E',
  },
  resteAChargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  resteAChargeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ACCENT,
  },
  resteAChargeValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ACCENT,
  },

  // ── Conditions ──
  conditionsBox: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: GRAY_100,
    borderRadius: 4,
  },
  conditionsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 8,
  },
  conditionItem: {
    fontSize: 8,
    color: '#374151',
    marginBottom: 4,
    paddingLeft: 8,
  },

  // ── Signature ──
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  signatureBox: {
    width: '44%',
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 4,
  },
  signatureHint: {
    fontSize: 8,
    color: GRAY_500,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: GRAY_300,
    height: 40,
    marginBottom: 4,
  },
  signatureCaption: {
    fontSize: 7,
    color: GRAY_500,
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: GRAY_500,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
});

// Formateur prix FR
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' \u20AC';
}

function formatDateFR(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatFinancementType(type: string): string {
  const map: Record<string, string> = {
    opco: 'OPCO',
    cpf: 'CPF (Compte Personnel de Formation)',
    france_travail: 'France Travail (ex-Pole Emploi)',
    autofinancement: 'Autofinancement',
    faf: 'FAF (Fonds d\'Assurance Formation)',
    fifpl: 'FIF-PL',
    agefice: 'AGEFICE',
    afdas: 'AFDAS',
  };
  return map[type] || type.toUpperCase();
}

export function DevisPDF(props: DevisProps) {
  const {
    devisId,
    date,
    validiteJours,
    emetteur,
    prospect,
    formation,
    session,
    financement,
    echeances,
  } = props;

  // Calculs financiers
  const montantHt = formation.prixHt;
  const tva = Math.round(montantHt * 20) / 100;
  const montantTtc = montantHt + tva;
  const financementMontant = financement?.montant || 0;
  const resteACharge = Math.max(0, montantTtc - financementMontant);
  const mensualite = echeances && echeances > 1 ? Math.round(resteACharge / echeances * 100) / 100 : null;

  // Date d'expiration
  const dateExpiration = new Date(date);
  dateExpiration.setDate(dateExpiration.getDate() + validiteJours);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{emetteur.nom.toUpperCase()}</Text>
            <Text style={styles.companySubtitle}>CENTRE DE FORMATION CERTIFIE QUALIOPI</Text>
            <Text style={styles.companyInfo}>{emetteur.adresse}</Text>
            <Text style={styles.companyInfo}>Tel : {emetteur.telephone} | {emetteur.email}</Text>
            <Text style={styles.companyInfo}>SIRET : {emetteur.siret} | NDA : {emetteur.nda}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.devisRef}>DEVIS N{'\u00B0'} {devisId}</Text>
            <Text style={styles.devisDate}>Date : {formatDateFR(date)}</Text>
            <Text style={styles.devisDate}>Valable jusqu'au : {formatDateFR(dateExpiration.toISOString())}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* ── PARTIES ── */}
        <View style={styles.partiesRow}>
          <View style={[styles.partieBox, styles.emetteurBox]}>
            <Text style={styles.partieLabel}>EMETTEUR</Text>
            <Text style={styles.partieName}>{emetteur.nom}</Text>
            <Text style={styles.partieInfo}>{emetteur.adresse}</Text>
            <Text style={styles.partieInfo}>SIRET : {emetteur.siret}</Text>
            <Text style={styles.partieInfo}>NDA : {emetteur.nda}</Text>
            <Text style={styles.partieInfo}>{emetteur.rcs}</Text>
          </View>
          <View style={[styles.partieBox, styles.destinataireBox]}>
            <Text style={styles.partieLabel}>DESTINATAIRE</Text>
            <Text style={styles.partieName}>
              {prospect.prenom ? `${prospect.prenom} ${prospect.nom}` : prospect.nom}
            </Text>
            {prospect.entreprise && <Text style={styles.partieInfo}>{prospect.entreprise}</Text>}
            {prospect.adresse && <Text style={styles.partieInfo}>{prospect.adresse}</Text>}
            {prospect.siret && <Text style={styles.partieInfo}>SIRET : {prospect.siret}</Text>}
            {prospect.email && <Text style={styles.partieInfo}>{prospect.email}</Text>}
            {prospect.telephone && <Text style={styles.partieInfo}>Tel : {prospect.telephone}</Text>}
          </View>
        </View>

        {/* ── FORMATION ── */}
        <View style={styles.formationSection}>
          <Text style={styles.formationTitle}>FORMATION PROPOSEE</Text>
          <Text style={styles.formationName}>{formation.nom}</Text>
          <View style={styles.formationRow}>
            <Text style={styles.formationLabel}>Duree :</Text>
            <Text style={styles.formationValue}>{formation.dureeJours} jour{formation.dureeJours > 1 ? 's' : ''} ({formation.dureeHeures} heures)</Text>
          </View>
          {session && (
            <>
              <View style={styles.formationRow}>
                <Text style={styles.formationLabel}>Dates :</Text>
                <Text style={styles.formationValue}>
                  Du {formatDateFR(session.dateDebut)} au {formatDateFR(session.dateFin)}
                </Text>
              </View>
              {session.formatrice && (
                <View style={styles.formationRow}>
                  <Text style={styles.formationLabel}>Formatrice :</Text>
                  <Text style={styles.formationValue}>{session.formatrice}</Text>
                </View>
              )}
              {session.lieu && (
                <View style={styles.formationRow}>
                  <Text style={styles.formationLabel}>Lieu :</Text>
                  <Text style={styles.formationValue}>{session.lieu}</Text>
                </View>
              )}
            </>
          )}
          {formation.description && (
            <View style={styles.formationRow}>
              <Text style={styles.formationLabel}>Description :</Text>
              <Text style={styles.formationValue}>{formation.description}</Text>
            </View>
          )}
        </View>

        {/* ── TABLE PRIX ── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Designation</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Qte</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Prix unitaire HT</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Total HT</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>{formation.nom}</Text>
            <Text style={styles.col2}>1</Text>
            <Text style={styles.col3}>{formatPrice(montantHt)}</Text>
            <Text style={styles.col4}>{formatPrice(montantHt)}</Text>
          </View>
        </View>

        {/* ── TOTAUX ── */}
        <View style={styles.totauxContainer}>
          <View style={styles.totauxBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{formatPrice(montantHt)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA (20%)</Text>
              <Text style={styles.totalValue}>{formatPrice(tva)}</Text>
            </View>
            <View style={styles.totalTTCRow}>
              <Text style={styles.totalTTCLabel}>TOTAL TTC</Text>
              <Text style={styles.totalTTCValue}>{formatPrice(montantTtc)}</Text>
            </View>
          </View>
        </View>

        {/* ── FINANCEMENT ── */}
        {financement && financement.montant > 0 && (
          <View style={styles.financementBox}>
            <Text style={styles.financementTitle}>FINANCEMENT</Text>
            <View style={styles.financementRow}>
              <Text style={styles.financementLabel}>
                Prise en charge {formatFinancementType(financement.type)} :
              </Text>
              <Text style={styles.financementValue}>-{formatPrice(financement.montant)}</Text>
            </View>
            <View style={styles.resteAChargeRow}>
              <Text style={styles.resteAChargeLabel}>Reste a charge :</Text>
              <Text style={styles.resteAChargeValue}>{formatPrice(resteACharge)}</Text>
            </View>
            {mensualite && (
              <View style={[styles.financementRow, { marginTop: 4 }]}>
                <Text style={styles.financementLabel}>
                  Paiement en {echeances}x sans frais :
                </Text>
                <Text style={styles.financementValue}>{formatPrice(mensualite)}/mois</Text>
              </View>
            )}
          </View>
        )}

        {/* ── CONDITIONS ── */}
        <View style={styles.conditionsBox}>
          <Text style={styles.conditionsTitle}>CONDITIONS GENERALES</Text>
          <Text style={styles.conditionItem}>
            {'\u2022'} Ce devis est valable {validiteJours} jours a compter de la date d'emission.
          </Text>
          <Text style={styles.conditionItem}>
            {'\u2022'} Organisme de formation certifie Qualiopi — Actions de formation.
          </Text>
          <Text style={styles.conditionItem}>
            {'\u2022'} NDA : {emetteur.nda} (cet enregistrement ne vaut pas agrement de l'Etat).
          </Text>
          <Text style={styles.conditionItem}>
            {'\u2022'} Formation eligible au financement CPF, OPCO, France Travail selon conditions d'eligibilite.
          </Text>
          <Text style={styles.conditionItem}>
            {'\u2022'} Modalites de paiement : comptant a reception ou echelonnement selon accord prealable.
          </Text>
          <Text style={styles.conditionItem}>
            {'\u2022'} En cas d'annulation par le stagiaire a moins de 10 jours ouvrables avant le debut de la formation,
            30% du montant total restera du.
          </Text>
          <Text style={styles.conditionItem}>
            {'\u2022'} Les CGV completes sont disponibles sur demande et sur notre site internet.
          </Text>
        </View>

        {/* ── SIGNATURE ── */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Le centre de formation</Text>
            <Text style={styles.signatureHint}>{emetteur.nom}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureCaption}>Cachet et signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Bon pour accord</Text>
            <Text style={styles.signatureHint}>Date et signature du client</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureCaption}>
              Signature precedee de la mention "Bon pour accord"
            </Text>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <Text style={styles.footer}>
          {emetteur.nom} — Centre de Formation Esthetique — Certifie Qualiopi
          {'\n'}{emetteur.rcs} | TVA : {emetteur.tva_intracom} | SIRET : {emetteur.siret}
          {'\n'}N{'\u00B0'} de declaration d'activite : {emetteur.nda}
        </Text>

      </Page>
    </Document>
  );
}
