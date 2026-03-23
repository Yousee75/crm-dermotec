# Générateur de Graphiques Consulting — Satorea CRM

## 📊 Vue d'ensemble

Le script `generate-charts-ultimate.py` génère **17 graphiques premium** de style consulting (McKinsey/BCG) à partir d'un fichier JSON de données prospect.

## 🚀 Utilisation

```bash
python scripts/generate-charts-ultimate.py --input charts/data-prospect.json --output charts/
```

## 📋 Paramètres

- `--input` : Fichier JSON avec les données du prospect (requis)
- `--output` : Dossier de sortie pour les PNG (requis)

## 🎨 Graphiques générés

| Fichier | Description | Dimensions | Insight Business |
|---------|-------------|------------|------------------|
| `s01-gauge.png` | Jauge score global | 250×220 | Classification FROID/TIEDE/CHAUD |
| `s02-radar.png` | Radar 5 axes | 480×440 | Forces/faiblesses vs moyenne secteur |
| `s03-sparkline.png` | Mini tendance avis | 300×80 | Momentum croissance |
| `s04-heatmap.png` | Matrice plateformes | 530×280 | Performance × canal |
| `s05-scatter.png` | Scatter concurrentiel | 480×400 | Position note/volume vs concurrence |
| `s06-distribution.png` | Distribution étoiles Google | 530×200 | Qualité perception client |
| `s07-wordcloud.png` | Nuage mots positifs/négatifs | 480×320 | Analyse sentiments avis |
| `s08-timeline.png` | Timeline parcours client | 530×200 | Journey mapping |
| `s09-gap.png` | Gap soins vs formations | 530×300 | Opportunités d'expansion |
| `s11-demographie.png` | Démographie quartier | 530×240 | Profil socio-économique zone |
| `s12-concurrents-scatter.png` | Scatter concurrents | 520×280 | Benchmark concurrentiel |
| `s13-radar-concurrents.png` | Radar vs top 3 | 480×420 | Positionnement relatif |
| `s14-digital.png` | Scorecard 6 canaux | 520×240 | Maturité digitale |
| `s15-horaires.png` | Horaires vs concurrence | 530×220 | Gap horaires d'ouverture |
| `s16-tendances.png` | Courbes marché | 520×230 | Saisonnalité & trends |
| `s17-waterfall.png` | Waterfall ROI | 530×290 | Impact formations sur CA |
| `s18-roi-mensuel.png` | ROI mensuel M1-M12 | 530×230 | Montée en puissance |

**Note** : `s10-carte.png` est généré par le script séparé `carte-premium.py`

## 📁 Format JSON d'entrée

```json
{
  "prospect": {
    "nom": "Latitude Zen",
    "prenom_gerant": "Valérie",
    "score_global": 64
  },
  "scores": {
    "reputation": 82,
    "presence": 68,
    "activite": 45,
    "financier": 42,
    "quartier": 72
  },
  "classification": "CHAUD",
  "plateformes": [
    {"nom": "Google", "note": 4.4, "avis": 300},
    {"nom": "Planity", "note": 4.9, "avis": 729}
  ],
  "distribution_google": {"5": 200, "4": 52, "3": 18, "2": 8, "1": 6},
  "keywords_positifs": ["professionnel", "qualite", "accueil"],
  "keywords_negatifs": ["attente", "cher"],
  "carte_soins": ["soins visage", "massages", "epilation"],
  "formations_dermotec": ["Microblading", "Full Lips", "Dermopigmentation"],
  "concurrents": [
    {"nom": "Bodyminute", "note": 3.7, "avis": 76}
  ],
  "roi": {
    "ca_actuel": 13000,
    "formations": [
      {"nom": "Microblading", "ca_additionnel": 3200}
    ]
  },
  "zone": {
    "concurrents_count": 15,
    "metros": 3,
    "revenu_median": 28500
  }
}
```

## 🎨 Design System Satorea

### Palette couleurs
- **Orange** `#FF5C00` : Satorea primary, prospect, actions
- **Rose** `#FF2D78` : Accent, formations premium
- **Noir** `#111111` : Texte principal, structure
- **Vert** `#10B981` : Succès, croissance, zones d'excellence
- **Bleu** `#3B82F6` : Data, analytics, insights

### Style consulting
- **Fond blanc** pour impression Word/PowerPoint
- **DPI 200** pour qualité print
- **Typographie** Segoe UI/Calibri (corporate)
- **Messages insight** : 1 phrase d'analyse business en footer
- **Autonomie** : chaque graphique compréhensible seul

## 📦 Dépendances

```bash
pip install matplotlib numpy
pip install wordcloud  # Optionnel (fallback texte si absent)
```

## 🔧 Configuration

Le script s'adapte automatiquement aux données disponibles :
- Champs manquants → valeurs par défaut
- Données insuffisantes → fallback générique
- Erreurs de données → gestion gracieuse

## 📈 Exemples d'usage

### Prospect standard
```bash
python scripts/generate-charts-ultimate.py --input data/prospect-latitudezen.json --output reports/latitudezen/
```

### Batch processing
```bash
for file in data/prospects/*.json; do
    prospect=$(basename "$file" .json)
    python scripts/generate-charts-ultimate.py --input "$file" --output "reports/$prospect/"
done
```

### Intégration automatisée
```python
import subprocess
import json

# Données depuis CRM
data = get_prospect_data(prospect_id)

# Export JSON
with open('temp_prospect.json', 'w') as f:
    json.dump(data, f)

# Génération graphiques
subprocess.run([
    'python', 'scripts/generate-charts-ultimate.py',
    '--input', 'temp_prospect.json',
    '--output', f'reports/{prospect_id}/'
])
```

## 🚨 Limitations

1. **s10-carte.png** doit être généré séparément
2. **WordCloud** nécessite la lib (fallback texte sinon)
3. **Étoiles Unicode** peuvent ne pas s'afficher (warning)
4. **Données simulées** pour certains graphiques si champs manquants

## 🔍 Debugging

```bash
# Mode verbose
python scripts/generate-charts-ultimate.py --input data.json --output charts/ -v

# Test avec données minimales
echo '{"prospect":{"nom":"Test","score_global":50}}' > test.json
python scripts/generate-charts-ultimate.py --input test.json --output test_output/
```

---

**Créé pour Satorea CRM** — Génération de rapports prospect automatisée
Style consulting premium | Données dynamiques JSON | 17 graphiques autonomes