import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';

// Enregistrement des polices (optionnel, Helvetica est native)
// Font.register({
//   family: 'Helvetica',
//   src: 'path/to/helvetica.ttf'
// });

interface DevisProps {
  devisId: string;
  date: string;
  validiteJours: number;
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
    duree: string;
    prixHt: number;
    description?: string;
  };
  financement?: {
    type: string;
    montant: number;
  };
  echeances?: number;
}

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#000000',
  },
  header: {
    marginBottom: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#082545',
    textAlign: 'center',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  separator: {
    borderBottomWidth: 2,
    borderBottomColor: '#2EC6F3',
    marginBottom: 20,
  },
  devisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#082545',
    marginBottom: 15,
  },
  dateValidite: {
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 20,
    color: '#6B7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#082545',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: '25%',
    fontSize: 9,
    color: '#6B7280',
  },
  value: {
    width: '75%',
    fontSize: 9,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#082545',
    padding: 8,
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
    fontSize: 9,
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: '50%',
    justifyContent: 'space-between',
    padding: 3,
    fontSize: 10,
  },
  totalFinal: {
    flexDirection: 'row',
    width: '50%',
    justifyContent: 'space-between',
    padding: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2EC6F3',
    backgroundColor: '#f0f9ff',
  },
  financementSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2EC6F3',
  },
  financementTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#082545',
    marginBottom: 5,
  },
  financementText: {
    fontSize: 10,
    marginBottom: 3,
  },
  conditions: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  conditionsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#082545',
    marginBottom: 10,
  },
  conditionItem: {
    fontSize: 9,
    marginBottom: 5,
    paddingLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#6B7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

// Fonction utilitaire pour formater les prix
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Fonction utilitaire pour formater les nombres avec espaces
function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR');
}

export function DevisPDF(props: DevisProps) {
  const {
    devisId,
    date,
    validiteJours,
    prospect,
    formation,
    financement,
    echeances,
  } = props;

  // Calculs
  const montantHt = formation.prixHt;
  const tva = Math.round(montantHt * 0.2);
  const montantTtc = montantHt + tva;
  const financementMontant = financement?.montant || 0;
  const resteACharge = montantTtc - financementMontant;
  const mensualite = echeances ? Math.round(resteACharge / echeances) : resteACharge;

  // Date d'expiration
  const dateExpiration = new Date(date);
  dateExpiration.setDate(dateExpiration.getDate() + validiteJours);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>DERMOTEC ADVANCED</Text>
          <Text style={styles.companyAddress}>
            75 Boulevard Richard Lenoir, 75011 Paris
          </Text>
          <Text style={styles.companyAddress}>
            Tél: 01 XX XX XX XX • Email: contact@dermotec-advanced.com
          </Text>
          <View style={styles.separator} />
        </View>

        {/* Titre devis */}
        <Text style={styles.devisTitle}>DEVIS N° {devisId}</Text>

        {/* Date et validité */}
        <View style={styles.dateValidite}>
          <Text>Date: {new Date(date).toLocaleDateString('fr-FR')}</Text>
          <Text>Valable jusqu'au: {dateExpiration.toLocaleDateString('fr-FR')}</Text>
        </View>

        {/* Destinataire */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESTINATAIRE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom:</Text>
            <Text style={styles.value}>
              {prospect.prenom ? `${prospect.prenom} ${prospect.nom}` : prospect.nom}
            </Text>
          </View>
          {prospect.entreprise && (
            <View style={styles.row}>
              <Text style={styles.label}>Entreprise:</Text>
              <Text style={styles.value}>{prospect.entreprise}</Text>
            </View>
          )}
          {prospect.adresse && (
            <View style={styles.row}>
              <Text style={styles.label}>Adresse:</Text>
              <Text style={styles.value}>{prospect.adresse}</Text>
            </View>
          )}
          {prospect.siret && (
            <View style={styles.row}>
              <Text style={styles.label}>SIRET:</Text>
              <Text style={styles.value}>{prospect.siret}</Text>
            </View>
          )}
          {prospect.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{prospect.email}</Text>
            </View>
          )}
          {prospect.telephone && (
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone:</Text>
              <Text style={styles.value}>{prospect.telephone}</Text>
            </View>
          )}
        </View>

        {/* Formation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FORMATION PROPOSÉE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Formation:</Text>
            <Text style={styles.value}>{formation.nom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Durée:</Text>
            <Text style={styles.value}>{formation.duree}</Text>
          </View>
          {formation.description && (
            <View style={styles.row}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.value}>{formation.description}</Text>
            </View>
          )}
        </View>

        {/* Table des prix */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Désignation</Text>
            <Text style={styles.col2}>Quantité</Text>
            <Text style={styles.col3}>Prix unitaire HT</Text>
            <Text style={styles.col4}>Total HT</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>{formation.nom}</Text>
            <Text style={styles.col2}>1</Text>
            <Text style={styles.col3}>{formatPrice(montantHt)}</Text>
            <Text style={styles.col4}>{formatPrice(montantHt)}</Text>
          </View>
        </View>

        {/* Totaux */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text>Sous-total HT:</Text>
            <Text>{formatPrice(montantHt)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TVA (20%):</Text>
            <Text>{formatPrice(tva)}</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text>TOTAL TTC:</Text>
            <Text>{formatPrice(montantTtc)}</Text>
          </View>
        </View>

        {/* Financement */}
        {financement && (
          <View style={styles.financementSection}>
            <Text style={styles.financementTitle}>FINANCEMENT</Text>
            <Text style={styles.financementText}>
              Prise en charge {financement.type.toUpperCase()}: -{formatPrice(financement.montant)}
            </Text>
            <Text style={styles.financementText}>
              Reste à charge: {formatPrice(resteACharge)}
            </Text>
            {echeances && echeances > 1 && (
              <Text style={styles.financementText}>
                Paiement en {echeances}x: {formatPrice(mensualite)}/mois
              </Text>
            )}
          </View>
        )}

        {/* Conditions */}
        <View style={styles.conditions}>
          <Text style={styles.conditionsTitle}>CONDITIONS GÉNÉRALES</Text>
          <Text style={styles.conditionItem}>
            • Ce devis est valable {validiteJours} jours à compter de la date d'émission
          </Text>
          <Text style={styles.conditionItem}>
            • Organisme de formation certifié Qualiopi - Critère qualité engagée
          </Text>
          <Text style={styles.conditionItem}>
            • N° de déclaration d'activité: 11 75 54321 75 (cet enregistrement ne vaut pas agrément de l'État)
          </Text>
          <Text style={styles.conditionItem}>
            • Formation éligible au financement CPF, OPCO, Pôle Emploi selon conditions
          </Text>
          <Text style={styles.conditionItem}>
            • Modalités de paiement: comptant ou échelonnement selon accord préalable
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Dermotec Advanced — Centre de Formation Esthétique — Certifié Qualiopi
          {'\n'}SARL au capital de 10 000 € • RCS Paris 123 456 789 • TVA FR12345678901
        </Text>
      </Page>
    </Document>
  );
}