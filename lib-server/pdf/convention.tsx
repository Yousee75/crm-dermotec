import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { Formation, Lead, Session, Inscription } from '@/types'
import { formatDate, formatEuro } from '@/lib/utils'
import { BRAND } from '@/lib/constants'

interface ConventionPDFProps {
  lead: Lead
  formation: Formation
  session: Session
  inscription: Inscription
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 30,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #082545',
    paddingBottom: 10,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#082545',
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#082545',
  },
  article: {
    marginBottom: 15,
  },
  articleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#082545',
  },
  text: {
    fontSize: 11,
    textAlign: 'justify',
    lineHeight: 1.4,
  },
  table: {
    display: 'flex',
    flexDirection: 'row',
    marginVertical: 10,
  },
  tableCell: {
    flex: 1,
    padding: 5,
    border: '1px solid #ccc',
  },
  signature: {
    flexDirection: 'row',
    marginTop: 30,
  },
  signatureBox: {
    flex: 1,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
    borderTop: '1px solid #ccc',
    paddingTop: 10,
  },
})

export function ConventionPDF({ lead, formation, session, inscription }: ConventionPDFProps) {
  const prixTTC = formation.prix_ht * (1 + formation.tva_rate / 100)
  const exonereTVA = formation.tva_rate === 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>{BRAND.name}</Text>
          <Text>{BRAND.address}, {BRAND.zipCode} {BRAND.city}</Text>
          <Text>Tél : {BRAND.phone} • Email : {BRAND.email}</Text>
        </View>

        <Text style={styles.title}>CONVENTION DE FORMATION PROFESSIONNELLE</Text>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>ARTICLE 1 - OBJET</Text>
          <Text style={styles.text}>
            La présente convention a pour objet la réalisation de la formation intitulée "{formation.nom}" ({formation.categorie}).
          </Text>
          <Text style={styles.text}>
            Objectifs : {formation.objectifs.join(', ')}.
          </Text>
          <Text style={styles.text}>
            Compétences acquises : {formation.competences_acquises.join(', ')}.
          </Text>
        </View>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>ARTICLE 2 - DURÉE ET DATES</Text>
          <Text style={styles.text}>
            Durée : {formation.duree_jours} jour(s) - {formation.duree_heures} heures
          </Text>
          <Text style={styles.text}>
            Dates : du {formatDate(session.date_debut)} au {formatDate(session.date_fin)}
          </Text>
          <Text style={styles.text}>
            Horaires : {session.horaire_debut} - {session.horaire_fin}
          </Text>
        </View>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>ARTICLE 3 - LIEU DE FORMATION</Text>
          <Text style={styles.text}>
            Formation dispensée dans nos locaux :
          </Text>
          <Text style={styles.text}>
            {session.adresse || `${BRAND.address}, ${BRAND.zipCode} ${BRAND.city}`}
          </Text>
          <Text style={styles.text}>
            Salle : {session.salle}
          </Text>
        </View>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>ARTICLE 4 - EFFECTIF</Text>
          <Text style={styles.text}>
            Effectif maximum : {formation.places_max} stagiaires
          </Text>
          <Text style={styles.text}>
            Places actuellement occupées : {session.places_occupees}
          </Text>
        </View>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>ARTICLE 5 - PRIX ET MODALITÉS DE PAIEMENT</Text>
          <Text style={styles.text}>
            Prix de la formation : {formatEuro(formation.prix_ht)} HT
          </Text>
          {exonereTVA ? (
            <Text style={styles.text}>
              TVA non applicable (exonération art. 261.4.4° du CGI)
            </Text>
          ) : (
            <Text style={styles.text}>
              TVA ({formation.tva_rate}%) : {formatEuro((prixTTC - formation.prix_ht))}
            </Text>
          )}
          <Text style={styles.text}>
            Prix total TTC : {formatEuro(exonereTVA ? formation.prix_ht : prixTTC)}
          </Text>
          <Text style={styles.text}>
            Mode de paiement : {inscription.mode_paiement || 'Selon modalités convenues'}
          </Text>
          {inscription.montant_finance > 0 && (
            <Text style={styles.text}>
              Montant financé : {formatEuro(inscription.montant_finance)}
            </Text>
          )}
          {inscription.reste_a_charge > 0 && (
            <Text style={styles.text}>
              Reste à charge : {formatEuro(inscription.reste_a_charge)}
            </Text>
          )}
        </View>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>ARTICLE 6 - PROGRAMME</Text>
          <Text style={styles.text}>
            {formation.description || 'Programme détaillé disponible sur demande.'}
          </Text>
          {formation.prerequis && (
            <Text style={styles.text}>
              Prérequis : {formation.prerequis}
            </Text>
          )}
        </View>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>ARTICLE 7 - MOYENS PÉDAGOGIQUES</Text>
          <Text style={styles.text}>
            Formation pratique avec support théorique, démonstrations en direct, exercices sur modèles.
          </Text>
          {formation.materiel_inclus && (
            <Text style={styles.text}>
              Matériel professionnel NPM International inclus : {formation.materiel_details || 'selon programme'}
            </Text>
          )}
          <Text style={styles.text}>
            Supports pédagogiques fournis. Encadrement par formateur qualifié.
          </Text>
        </View>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>ARTICLE 8 - SANCTIONS DE LA FORMATION</Text>
          <Text style={styles.text}>
            À l'issue de la formation, une attestation de fin de formation sera délivrée au stagiaire.
          </Text>
          <Text style={styles.text}>
            En cas de réussite, un certificat de compétences sera remis avec numéro d'identification unique.
          </Text>
        </View>

        <View style={styles.article}>
          <Text style={styles.articleTitle}>ARTICLE 9 - CONDITIONS D'ANNULATION</Text>
          <Text style={styles.text}>
            Annulation par le stagiaire : possible jusqu'à 10 jours ouvrés avant le début de formation.
          </Text>
          <Text style={styles.text}>
            Annulation par l'organisme : report ou remboursement intégral en cas de force majeure.
          </Text>
          <Text style={styles.text}>
            En cas d'absence injustifiée, aucun remboursement ne sera effectué.
          </Text>
        </View>

        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.text}>L'organisme de formation</Text>
            <Text style={styles.text}>{BRAND.name}</Text>
            <Text style={[styles.text, { marginTop: 40 }]}>Signature et cachet</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.text}>Le stagiaire</Text>
            <Text style={styles.text}>{lead.prenom} {lead.nom}</Text>
            <Text style={[styles.text, { marginTop: 40 }]}>Signature précédée de</Text>
            <Text style={styles.text}>"Lu et approuvé"</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            {BRAND.name} • N° déclaration d'activité : {BRAND.nda} • SIRET : {BRAND.siret}
          </Text>
          {BRAND.qualiopi && (
            <Text>Organisme certifié QUALIOPI pour ses actions de formation</Text>
          )}
        </View>
      </Page>
    </Document>
  )
}