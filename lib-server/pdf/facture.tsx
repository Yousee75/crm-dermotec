import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Facture, Lead } from '@/types'
import { formatDate, formatEuro } from '@/lib/utils'
import { BRAND, COLORS } from '@/lib/constants'

interface FacturePDFProps {
  facture: Facture
  lead: Lead
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 30,
    lineHeight: 1.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: `2px solid ${COLORS.primary}`,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#666',
    lineHeight: 1.2,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'right',
  },
  documentNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 5,
    color: COLORS.accent,
  },
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  clientInfo: {
    flex: 1,
  },
  clientTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 5,
  },
  clientDetails: {
    fontSize: 11,
  },
  documentInfo: {
    textAlign: 'right',
  },
  table: {
    marginVertical: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderBottom: `1px solid ${COLORS.primary}`,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #E5E7EB',
  },
  descriptionColumn: {
    flex: 3,
    paddingRight: 10,
  },
  quantiteColumn: {
    flex: 1,
    textAlign: 'center',
  },
  prixColumn: {
    flex: 1,
    textAlign: 'right',
  },
  totalColumn: {
    flex: 1,
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  tableText: {
    fontSize: 10,
  },
  totalsSection: {
    alignSelf: 'flex-end',
    width: '40%',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 11,
    color: '#374151',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  conditions: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
  },
  conditionsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.accent,
  },
  conditionsText: {
    fontSize: 9,
    lineHeight: 1.3,
  },
  echeancier: {
    marginTop: 20,
  },
  echeancierTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.accent,
  },
  echeancierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
    color: '#6B7280',
  },
})

export function FacturePDF({ facture, lead }: FacturePDFProps) {
  const documentTypeLabel = {
    devis: 'DEVIS',
    facture: 'FACTURE',
    avoir: 'AVOIR'
  }[facture.type]

  const exonereTVA = facture.exoneration_tva || facture.tva_taux === 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{BRAND.name}</Text>
            <Text style={styles.companyDetails}>
              {BRAND.address}{'\n'}
              {BRAND.zipCode} {BRAND.city}{'\n'}
              Tél : {BRAND.phone}{'\n'}
              Email : {BRAND.email}{'\n'}
              {BRAND.siret && `SIRET : ${BRAND.siret}`}{'\n'}
              {BRAND.nda && `N° déclaration d'activité : ${BRAND.nda}`}
            </Text>
          </View>
          <View>
            <Text style={styles.documentTitle}>{documentTypeLabel}</Text>
            <Text style={styles.documentNumber}>{facture.numero_facture}</Text>
          </View>
        </View>

        {/* Client et document info */}
        <View style={styles.clientSection}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientTitle}>Client :</Text>
            <Text style={styles.clientDetails}>
              {lead.civilite} {lead.prenom} {lead.nom}{'\n'}
              {lead.adresse?.rue}{'\n'}
              {lead.adresse?.code_postal} {lead.adresse?.ville}{'\n'}
              {lead.email}{'\n'}
              {lead.telephone}
            </Text>
            {lead.entreprise_nom && (
              <Text style={styles.clientDetails}>
                {'\n'}Entreprise : {lead.entreprise_nom}{'\n'}
                {lead.siret && `SIRET : ${lead.siret}`}
              </Text>
            )}
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.tableText}>Date : {formatDate(facture.created_at)}</Text>
            {facture.date_echeance && (
              <Text style={styles.tableText}>Échéance : {formatDate(facture.date_echeance)}</Text>
            )}
            {facture.type === 'devis' && (
              <Text style={styles.tableText}>Validité : 30 jours</Text>
            )}
          </View>
        </View>

        {/* Table des lignes */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.descriptionColumn]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.quantiteColumn]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.prixColumn]}>Prix unit. HT</Text>
            <Text style={[styles.tableHeaderText, styles.totalColumn]}>Total HT</Text>
          </View>
          {facture.lignes.map((ligne, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableText, styles.descriptionColumn]}>{ligne.description}</Text>
              <Text style={[styles.tableText, styles.quantiteColumn]}>{ligne.quantite}</Text>
              <Text style={[styles.tableText, styles.prixColumn]}>{formatEuro(ligne.prix_unitaire_ht)}</Text>
              <Text style={[styles.tableText, styles.totalColumn]}>{formatEuro(ligne.total_ht)}</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT :</Text>
            <Text style={styles.totalValue}>{formatEuro(facture.sous_total_ht)}</Text>
          </View>
          {exonereTVA ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA :</Text>
              <Text style={styles.totalValue}>
                {facture.mention_legale || 'Exonéré art. 261.4.4° CGI'}
              </Text>
            </View>
          ) : (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA ({facture.tva_taux}%) :</Text>
              <Text style={styles.totalValue}>{formatEuro(facture.montant_tva)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL TTC :</Text>
            <Text style={styles.grandTotalValue}>{formatEuro(facture.total_ttc)}</Text>
          </View>
        </View>

        {/* Échéancier si applicable */}
        {facture.echeancier && facture.echeancier.length > 0 && (
          <View style={styles.echeancier}>
            <Text style={styles.echeancierTitle}>Échéancier de paiement :</Text>
            {facture.echeancier.map((echeance, index) => (
              <View key={index} style={styles.echeancierRow}>
                <Text style={styles.tableText}>
                  Échéance {echeance.numero} - {formatDate(echeance.date)}
                </Text>
                <Text style={styles.tableText}>{formatEuro(echeance.montant)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Conditions */}
        <View style={styles.conditions}>
          <Text style={styles.conditionsTitle}>Conditions de paiement :</Text>
          <Text style={styles.conditionsText}>
            {facture.conditions_paiement ||
             'Paiement comptant à réception. Tout retard de paiement donnera lieu à des pénalités de retard au taux de 3 fois le taux légal, ainsi qu\'à une indemnité forfaitaire pour frais de recouvrement de 40€.'
            }
          </Text>
          {facture.type === 'devis' && (
            <Text style={styles.conditionsText}>
              {'\n'}Ce devis est valable 30 jours à compter de sa date d'émission.
              En cas d'acceptation, merci de retourner un exemplaire signé avec la mention "Bon pour accord".
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {BRAND.name} • {BRAND.address}, {BRAND.zipCode} {BRAND.city}
          </Text>
          {BRAND.siret && (
            <Text>SIRET : {BRAND.siret}</Text>
          )}
          {BRAND.qualiopi && (
            <Text>Organisme certifié QUALIOPI - Actions de formation</Text>
          )}
        </View>
      </Page>
    </Document>
  )
}