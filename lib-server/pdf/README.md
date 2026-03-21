# Générateurs PDF - CRM Dermotec

Ce module fournit 5 générateurs PDF professionnels pour le CRM Dermotec, utilisant `@react-pdf/renderer`.

## 📋 Générateurs disponibles

### 1. **Convocation** (`convocation.tsx`)
- **Usage** : Convoquer un stagiaire à une formation
- **Props** : `lead`, `formation`, `session`, `formatrice?`
- **Format** : A4 Portrait
- **Contenu** : Info stagiaire, détails formation, lieu, matériel à apporter

### 2. **Attestation de fin de formation** (`attestation-fin.tsx`)
- **Usage** : Certificat officiel Qualiopi de fin de formation
- **Props** : `lead`, `formation`, `session`, `taux_presence`, `date_emission?`
- **Format** : A4 Portrait
- **Contenu** : Certification conforme Code du travail, objectifs atteints

### 3. **Feuille d'émargement** (`feuille-emargement.tsx`)
- **Usage** : Suivi présence quotidienne des stagiaires
- **Props** : `formation`, `session`, `formatrice?`, `stagiaires[]`, `dates[]`
- **Format** : A4 Paysage (plus de colonnes)
- **Contenu** : Tableau matin/après-midi par jour, signatures

### 4. **Attestation d'assiduité** (`attestation-assiduite.tsx`)
- **Usage** : Document individuel de présence
- **Props** : `lead`, `formation`, `session`, `heures_effectuees`, `taux_presence`
- **Format** : A4 Portrait
- **Contenu** : Bilan détaillé présence/absence, pourcentage

### 5. **Bilan Pédagogique et Financier** (`bpf.tsx`)
- **Usage** : Rapport annuel obligatoire
- **Props** : `annee`, `stats` (stagiaires, CA, satisfaction, etc.)
- **Format** : A4 Portrait
- **Contenu** : Activité, financier, qualité, répartition financements

## 🚀 Usage côté serveur

### Import des générateurs
```typescript
import {
  ConvocationPDF,
  AttestationFinPDF,
  FeuilleEmargementPDF,
  AttestationAssiduiteePDF,
  BpfPDF,
  generateConvocationProps,
  // ... autres helpers
} from '@/lib/pdf'
```

### Génération d'un PDF
```typescript
import { renderToBuffer } from '@react-pdf/renderer'

// 1. Récupérer les données CRM
const lead = await supabase.from('leads').select('*').eq('id', leadId).single()
const session = await supabase.from('sessions').select('*, formation:formations(*)').eq('id', sessionId).single()

// 2. Générer les props avec le helper
const props = generateConvocationProps(lead.data, session.data, session.data.formation)

// 3. Render PDF
const pdfBuffer = await renderToBuffer(<ConvocationPDF {...props} />)

// 4. Retourner en Response
return new NextResponse(pdfBuffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="convocation.pdf"'
  }
})
```

## 🎯 Usage côté client

### Avec les hooks spécialisés
```typescript
import { useConvocationGenerator } from '@/hooks/use-pdf-generator'

function FormationCard({ leadId, sessionId }) {
  const { generateConvocation, previewConvocation, isGenerating } = useConvocationGenerator()

  return (
    <div>
      <Button
        onClick={() => generateConvocation(leadId, sessionId)}
        disabled={isGenerating}
      >
        {isGenerating ? 'Génération...' : 'Télécharger Convocation'}
      </Button>

      <Button
        variant="outline"
        onClick={previewConvocation}
      >
        Preview
      </Button>
    </div>
  )
}
```

### Avec les composants boutons
```typescript
import { ConvocationButton, FeuilleEmargementButton } from '@/components/ui/pdf-button'

function SessionActions({ session }) {
  return (
    <div className="flex gap-2">
      <ConvocationButton
        leadId={session.leadId}
        sessionId={session.id}
        variant="generate"
      />
      <FeuilleEmargementButton
        sessionId={session.id}
        variant="preview"
      />
    </div>
  )
}
```

## 🔧 API Routes

### Génération PDF
```http
POST /api/pdf/generate
Content-Type: application/json

{
  "type": "convocation",
  "data": {
    "leadId": "uuid",
    "sessionId": "uuid"
  }
}
```

### Preview PDF (données factices)
```http
GET /api/pdf/generate?type=convocation&preview=true
```

## ✨ Branding et styles

Tous les PDFs respectent la charte graphique Dermotec :
- **Couleur principale** : `#2EC6F3`
- **Couleur accent** : `#082545`
- **Polices** : Helvetica (intégrée PDF)
- **Header uniforme** : Logo + adresse + ligne séparatrice
- **Footer** : Mention centre certifié + pagination

## 📦 Données requises par PDF

### Convocation
```typescript
{
  leadId: string,     // ID du stagiaire
  sessionId: string   // ID de la session
}
```

### Attestation de fin
```typescript
{
  leadId: string,
  sessionId: string,
  taux_presence: number,        // 0-100
  date_emission?: string        // ISO date, défaut: aujourd'hui
}
```

### Feuille d'émargement
```typescript
{
  sessionId: string   // Le helper génère automatiquement les dates et stagiaires
}
```

### Attestation d'assiduité
```typescript
{
  leadId: string,
  sessionId: string,
  heures_effectuees: number,    // Heures réellement présent
  taux_presence: number         // % calculé
}
```

### BPF
```typescript
{
  annee: number,      // 2024
  stats: {
    nb_stagiaires: number,
    nb_heures_total: number,
    nb_sessions: number,
    ca_total: number,
    nb_formations: number,
    taux_satisfaction: number,
    taux_reussite: number,
    repartition_financements: {
      organisme: string,
      montant: number,
      nb_dossiers: number
    }[]
  }
}
```

## 🔒 Sécurité

- **Authentification requise** : Tous les endpoints vérifient `user.id`
- **Log des activités** : Chaque génération est trackée dans la table `activites`
- **Validation des données** : Props validées avant génération
- **Permissions** : Seules les personnes autorisées peuvent accéder aux données

## 📊 Monitoring

Les générations PDF sont automatiquement loggées :
```sql
INSERT INTO activites (type, user_id, description, metadata)
VALUES ('DOCUMENT', user_id, 'Génération PDF: convocation', {type, filename, user_email})
```

## 🎨 Customisation

### Ajouter un nouveau PDF
1. Créer `nouveau-document.tsx` dans `/lib/pdf/`
2. Suivre la structure existante (styles + composant + helper)
3. Ajouter dans `index.ts`
4. Créer hook dans `use-pdf-generator.ts`
5. Ajouter endpoint dans API route
6. Créer composant bouton si nécessaire

### Modifier un style
Les styles sont dans `StyleSheet.create()` de chaque fichier. Respecter :
- Couleurs de marque
- Hiérarchie typographique
- Espacements cohérents
- Lisibilité impression N&B

## ⚡ Performance

- **Lazy loading** : PDFs générés uniquement à la demande
- **Caching** : Possibilité de stocker en Supabase Storage pour éviter regénération
- **Compression** : @react-pdf optimise automatiquement
- **Streaming** : Retour direct du buffer sans stockage temporaire

## 🐛 Debug

```typescript
// Test génération locale
import { renderToBuffer } from '@react-pdf/renderer'
import { ConvocationPDF } from '@/lib/pdf'

const testProps = {
  lead: { prenom: 'Test', nom: 'User' },
  // ... autres props
}

const buffer = await renderToBuffer(<ConvocationPDF {...testProps} />)
console.log('PDF généré:', buffer.length, 'bytes')
```

## 📋 TODO

- [ ] Template engine pour personnalisation par client
- [ ] Signature électronique intégrée
- [ ] Export batch (multiple PDFs → ZIP)
- [ ] Watermark conditionnel
- [ ] PDF/A compliance pour archivage long terme