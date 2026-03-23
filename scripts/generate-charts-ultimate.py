"""
SATOREA CRM — Générateur dynamique de 18 graphiques consulting
Données depuis JSON | Style McKinsey/BCG | Palette Satorea

Usage:
    python scripts/generate-charts-ultimate.py --input charts/data-prospect.json --output charts/

Graphiques générés:
    s01-gauge.png (250×220) — Jauge semi-circulaire score global
    s02-radar.png (480×440) — Radar 5 axes + ligne moyenne secteur
    s03-sparkline.png (300×80) — Mini tendance avis (placeholder)
    s04-heatmap.png (530×280) — Matrice plateformes × (note, avis)
    s05-scatter.png (480×400) — Note vs nb avis (prospect vs concurrents)
    s06-distribution.png (530×200) — Distribution étoiles Google
    s07-wordcloud.png (480×320) — Nuage de mots positifs/négatifs
    s08-timeline.png (530×200) — Timeline placeholder
    s09-gap.png (530×300) — Matrice gap : soins actuels vs formations manquantes
    s10-carte.png — Skip (généré par carte-premium.py)
    s11-demographie.png (530×240) — Barres CSP/revenus quartier
    s12-concurrents-scatter.png (520×280) — Scatter concurrents note × avis
    s13-radar-concurrents.png (480×420) — Radar prospect vs top 3
    s14-digital.png (520×240) — Scorecard 6 canaux digitaux
    s15-horaires.png (530×220) — Placeholder barres horizontales
    s16-tendances.png (520×230) — Placeholder courbes marché
    s17-waterfall.png (530×290) — Waterfall ROI CA actuel → +formations → CA futur
    s18-roi-mensuel.png (530×230) — Courbe ROI mois 1-12 avec break-even
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe
import numpy as np
from pathlib import Path
import math
import json
import argparse

# Essai d'import wordcloud (fallback si pas installé)
try:
    from wordcloud import WordCloud
    HAS_WORDCLOUD = True
except ImportError:
    HAS_WORDCLOUD = False

# ═══════════════════════════════════════════════════════════════
# PALETTE SATOREA
# ═══════════════════════════════════════════════════════════════

# Couleurs principales Satorea
OR = '#FF5C00'      # Orange Satorea
RS = '#FF2D78'      # Rose Satorea
NK = '#111111'      # Noir Satorea
GN = '#10B981'      # Vert
BL = '#3B82F6'      # Bleu

# Extensions palette
ORL = '#FF8C42'     # Orange light
RSL = '#FF6BA8'     # Rose light
GR = '#888888'      # Gris
GRL = '#CCCCCC'     # Gris light
W = '#FFFFFF'       # Blanc
GXL = '#E8E8E8'     # Gris extra light
RD = '#EF4444'      # Rouge
AM = '#F59E0B'      # Ambre
VI = '#8B5CF6'      # Violet
CY = '#06B6D4'      # Cyan

# Couleurs de fond
ORBG = '#FFF5ED'    # Orange background
RSBG = '#FFF0F5'    # Rose background
GNBG = '#F0FDF4'    # Vert background
RDBG = '#FEF2F2'    # Rouge background
GBG = '#F5F5F5'     # Gris background

# Configuration matplotlib
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Segoe UI', 'Calibri', 'Arial'],
    'figure.facecolor': W,
    'axes.facecolor': W,
    'text.color': NK
})

def footer(fig):
    """Ajoute le footer Satorea CRM"""
    fig.text(0.98, 0.005, 'Satorea CRM', ha='right', va='bottom',
             fontsize=6, color=GRL, style='italic')

# ═══════════════════════════════════════════════════════════════
# 1. GAUGE — Score global jauge semi-circulaire
# ═══════════════════════════════════════════════════════════════

def generate_gauge(data, output_dir):
    """Génère une jauge semi-circulaire du score global"""
    score = data['scores']['global'] if 'global' in data['scores'] else data.get('prospect', {}).get('score_global', 50)

    fig, ax = plt.subplots(figsize=(2.5, 2.2))
    ax.set_xlim(-1.3, 1.3)
    ax.set_ylim(-0.3, 1.3)
    ax.set_aspect('equal')
    ax.axis('off')

    # Fond de jauge (180 degrés)
    for i in range(180):
        angle = math.radians(i)
        r = 1.0
        x1, y1 = r * math.cos(math.pi - angle), r * math.sin(math.pi - angle)
        x2, y2 = (r - 0.15) * math.cos(math.pi - angle), (r - 0.15) * math.sin(math.pi - angle)

        # Couleur selon zone (rouge < 30, orange 30-60, vert > 60)
        color = RD if i < 54 else OR if i < 108 else GN
        ax.plot([x1, x2], [y1, y2], color=color, lw=3, alpha=0.12, solid_capstyle='round')

    # Remplissage selon le score
    for i in range(int(score / 100 * 180)):
        angle = math.radians(i)
        r = 1.0
        x1, y1 = r * math.cos(math.pi - angle), r * math.sin(math.pi - angle)
        x2, y2 = (r - 0.15) * math.cos(math.pi - angle), (r - 0.15) * math.sin(math.pi - angle)

        color = RD if i < 54 else OR if i < 108 else GN
        ax.plot([x1, x2], [y1, y2], color=color, lw=3, solid_capstyle='round')

    # Aiguille
    needle_angle = math.radians(score / 100 * 180)
    ax.annotate('',
                xy=(0.75 * math.cos(math.pi - needle_angle), 0.75 * math.sin(math.pi - needle_angle)),
                xytext=(0, 0),
                arrowprops=dict(arrowstyle='->', color=NK, lw=2.5))

    # Centre
    ax.plot(0, 0, 'o', color=NK, markersize=8, zorder=5)

    # Score et classification
    score_color = GN if score >= 60 else OR if score >= 30 else RD
    ax.text(0, 0.35, str(int(score)), ha='center', va='center',
            fontsize=38, fontweight='bold', color=score_color)
    ax.text(0, 0.15, '/100', ha='center', fontsize=12, color=GR)

    # Labels zones
    ax.text(-1.15, -0.15, 'FROID', fontsize=7, color=RD, ha='center', fontweight='bold')
    ax.text(0, 1.12, 'TIEDE', fontsize=7, color=OR, ha='center', fontweight='bold')
    ax.text(1.15, -0.15, 'CHAUD', fontsize=7, color=GN, ha='center', fontweight='bold')

    # Classification
    classif = data.get('classification', 'CHAUD' if score >= 60 else 'TIEDE' if score >= 30 else 'FROID')
    bg_color = GNBG if score >= 60 else ORBG if score >= 30 else RDBG
    ax.text(0, -0.22, f'{classif} — {int(score)}/100', ha='center', fontsize=10,
            fontweight='bold', color=score_color,
            bbox=dict(boxstyle='round,pad=0.4', facecolor=bg_color, edgecolor=score_color, lw=1))

    plt.title('Score Global Prospect', fontsize=11, fontweight='bold', color=NK, pad=20)
    plt.figtext(0.5, 0.01, f'Classification {classif} basée sur 5 critères pondérés',
                ha='center', fontsize=8, color=score_color, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's01-gauge.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's01-gauge.png'

# ═══════════════════════════════════════════════════════════════
# 2. RADAR — 5 axes + ligne moyenne secteur
# ═══════════════════════════════════════════════════════════════

def generate_radar(data, output_dir):
    """Génère un radar chart 5 axes"""
    scores_data = data.get('scores', {})
    scores = [
        scores_data.get('reputation', 50),
        scores_data.get('presence', 50),
        scores_data.get('activite', 50),
        scores_data.get('financier', 50),
        scores_data.get('quartier', 50)
    ]

    fig, ax = plt.subplots(figsize=(4.8, 4.4), subplot_kw=dict(polar=True))

    N = 5
    angles = [n / float(N) * 2 * math.pi for n in range(N)] + [0]
    vals = scores + scores[:1]
    avg = [50, 50, 50, 50, 50] + [50]  # Moyenne secteur

    # Configuration polaire
    ax.set_theta_offset(math.pi / 2)
    ax.set_theta_direction(-1)
    ax.set_rmax(100)
    ax.set_rticks([25, 50, 75, 100])
    ax.set_yticklabels(['', '50', '75', ''], fontsize=7, color=GRL)
    ax.spines['polar'].set_visible(False)
    ax.grid(color=GXL, lw=0.6)

    # Labels
    labels = ['Réputation', 'Présence', 'Activité', 'Financier', 'Quartier']
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, fontsize=12, fontweight='bold', color=NK)

    # Ligne moyenne secteur
    ax.fill(angles, avg, color=RD, alpha=0.03)
    ax.plot(angles, avg, '--', color=RD, lw=1.5, alpha=0.25, label='Moyenne secteur')

    # Prospect (avec effet de glow)
    for alpha_mult in [0.02, 0.05, 0.08]:
        ax.fill(angles, [v * (1 - alpha_mult * 3) for v in vals], color=OR, alpha=alpha_mult)

    ax.plot(angles, vals, color=OR, lw=3, label=data.get('prospect', {}).get('nom', 'Prospect'))

    # Points avec couleurs distinctes
    colors = [GN, BL, VI, OR, CY]
    for i, (angle, val) in enumerate(zip(angles[:-1], scores)):
        ax.plot(angle, val, 'o', color=colors[i], markersize=12, zorder=5,
                markeredgecolor=W, markeredgewidth=2.5)
        ax.text(angle, val, f' {val}', fontsize=11, fontweight='bold', color=colors[i],
                va='center', path_effects=[pe.withStroke(linewidth=3, foreground=W)])

    ax.legend(loc='lower right', bbox_to_anchor=(1.2, -0.05), fontsize=9,
              frameon=True, facecolor=W, edgecolor=GXL)

    # Messages insight selon les scores
    top_score = max(scores)
    worst_score = min(scores)
    top_idx = scores.index(top_score)
    worst_idx = scores.index(worst_score)

    plt.suptitle(f'{labels[top_idx]} excellente ({top_score}) mais {labels[worst_idx]} faible ({worst_score}) — optimisation ciblée nécessaire',
                fontsize=11, fontweight='bold', color=NK, y=0.99)

    plt.figtext(0.5, 0.01, 'Écart vs moyenne secteur révèle les axes prioritaires de développement',
                ha='center', fontsize=9, color=OR, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(output_dir / 's02-radar.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's02-radar.png'

# ═══════════════════════════════════════════════════════════════
# 3. SPARKLINE — Mini tendance (placeholder)
# ═══════════════════════════════════════════════════════════════

def generate_sparkline(data, output_dir):
    """Génère une sparkline de tendance (placeholder)"""
    fig, ax = plt.subplots(figsize=(3, 0.8))

    # Données simulées tendance avis
    x = np.arange(12)
    trend = np.array([45, 52, 48, 63, 67, 71, 68, 75, 82, 79, 85, 88])

    ax.fill_between(x, trend, alpha=0.2, color=BL)
    ax.plot(x, trend, color=BL, lw=2, marker='o', markersize=3)

    # Annotations
    ax.text(len(x)-1, trend[-1]+3, f'{trend[-1]}', fontsize=10, fontweight='bold', color=BL)
    ax.text(0, trend[0]+3, f'{trend[0]}', fontsize=8, color=GR)

    # Flèche de tendance
    if trend[-1] > trend[0]:
        ax.arrow(len(x)*0.8, max(trend)*0.9, len(x)*0.1, 0, head_width=2,
                head_length=0.3, fc=GN, ec=GN)
        ax.text(len(x)*0.85, max(trend)*0.95, '+43%', fontsize=8, fontweight='bold', color=GN)

    ax.set_xlim(-0.5, len(x)-0.5)
    ax.set_ylim(min(trend)-5, max(trend)+8)
    ax.axis('off')

    plt.title('Évolution Avis (12 mois)', fontsize=10, fontweight='bold', color=NK, y=1.1)
    plt.figtext(0.5, -0.1, 'Tendance haussière constante — momentum positif',
                ha='center', fontsize=8, color=GN, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's03-sparkline.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's03-sparkline.png'

# ═══════════════════════════════════════════════════════════════
# 4. HEATMAP — Plateformes × (note, avis)
# ═══════════════════════════════════════════════════════════════

def generate_heatmap(data, output_dir):
    """Génère une heatmap des plateformes"""
    plateformes = data.get('plateformes', [])

    if not plateformes:
        # Données par défaut si manquantes
        plateformes = [
            {'nom': 'Google', 'note': 4.4, 'avis': 300},
            {'nom': 'Planity', 'note': 4.9, 'avis': 729},
            {'nom': 'Facebook', 'note': 4.8, 'avis': 23}
        ]

    fig, ax = plt.subplots(figsize=(5.3, 2.8))

    # Préparation des données
    noms = [p['nom'] for p in plateformes]
    notes = [p['note'] for p in plateformes]
    avis = [p['avis'] for p in plateformes]

    # Normalisation pour la heatmap (note × log(avis+1) pour éviter la domination du nb d'avis)
    scores_normalises = [note * math.log(av + 1) for note, av in zip(notes, avis)]
    max_score = max(scores_normalises) if scores_normalises else 1

    # Création heatmap
    y_pos = np.arange(len(noms))
    colors = plt.cm.RdYlGn([s/max_score for s in scores_normalises])

    bars = ax.barh(y_pos, [1]*len(noms), color=colors, height=0.7, zorder=3)

    # Annotations
    for i, (nom, note, av, bar) in enumerate(zip(noms, notes, avis, bars)):
        ax.text(0.05, i, f'{nom}', va='center', fontsize=10, fontweight='bold', color=W)
        ax.text(0.95, i, f'{note}/5 ({av})', va='center', ha='right',
                fontsize=9, fontweight='bold', color=W)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(noms, fontsize=10, fontweight='bold', color=NK)
    ax.set_xlim(0, 1)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.set_xticks([])
    ax.set_yticks([])

    plt.title('Performance par Plateforme', fontsize=12, fontweight='bold', color=NK, pad=20)

    total_avis = sum(avis)
    meilleure_note = max(notes)
    meilleur_platform = noms[notes.index(meilleure_note)]

    plt.figtext(0.5, 0.01, f'{total_avis} avis total — {meilleur_platform} leader qualité ({meilleure_note}/5)',
                ha='center', fontsize=9, color=OR, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's04-heatmap.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's04-heatmap.png'

# ═══════════════════════════════════════════════════════════════
# 5. SCATTER — Note vs nb avis (prospect vs concurrents)
# ═══════════════════════════════════════════════════════════════

def generate_scatter(data, output_dir):
    """Génère un scatter plot prospect vs concurrents"""
    plateformes = data.get('plateformes', [])
    concurrents = data.get('concurrents', [])

    fig, ax = plt.subplots(figsize=(4.8, 4))

    # Concurrents en gris
    if concurrents:
        conc_notes = [c.get('note', 4.0) for c in concurrents]
        conc_avis = [c.get('avis', 50) for c in concurrents]
        ax.scatter(conc_avis, conc_notes, color=GR, s=80, alpha=0.6, label='Concurrents', zorder=2)

        for i, c in enumerate(concurrents):
            ax.annotate(c.get('nom', f'C{i+1}'),
                       (conc_avis[i], conc_notes[i]),
                       xytext=(5, 5), textcoords='offset points',
                       fontsize=7, color=GR)

    # Prospect en orange (utilise la meilleure plateforme)
    if plateformes:
        # Prend la plateforme avec le plus d'avis pour représenter le prospect
        best_platform = max(plateformes, key=lambda p: p['avis'])
        ax.scatter(best_platform['avis'], best_platform['note'],
                  color=OR, s=150, zorder=5, edgecolor=NK, linewidth=2, label='Prospect')

        ax.annotate(data.get('prospect', {}).get('nom', 'Prospect'),
                   (best_platform['avis'], best_platform['note']),
                   xytext=(10, 10), textcoords='offset points',
                   fontsize=10, fontweight='bold', color=OR,
                   bbox=dict(boxstyle='round,pad=0.3', facecolor=ORBG, edgecolor=OR, lw=1))

    # Zone d'excellence (note > 4.5, avis > 100)
    ax.axhspan(4.5, 5.2, alpha=0.05, color=GN, zorder=1)
    ax.axvspan(100, ax.get_xlim()[1] if ax.get_xlim()[1] > 100 else 1000, alpha=0.05, color=GN, zorder=1)
    ax.text(300, 4.7, 'Zone\nd\'excellence', fontsize=8, color=GN, fontweight='bold', ha='center')

    ax.set_xlabel('Nombre d\'avis', fontsize=10, color=NK)
    ax.set_ylabel('Note moyenne', fontsize=10, color=NK)
    ax.set_ylim(2.5, 5.2)
    ax.grid(True, alpha=0.3)
    ax.legend(fontsize=9)

    plt.title('Position Concurrentielle', fontsize=12, fontweight='bold', color=NK, pad=15)
    plt.figtext(0.5, 0.01, 'Plus de volume ET meilleure qualité = position dominante',
                ha='center', fontsize=9, color=GN, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's05-scatter.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's05-scatter.png'

# ═══════════════════════════════════════════════════════════════
# 6. DISTRIBUTION — Distribution étoiles Google
# ═══════════════════════════════════════════════════════════════

def generate_distribution(data, output_dir):
    """Génère la distribution des étoiles Google"""
    distribution = data.get('distribution_google', {'5': 200, '4': 52, '3': 18, '2': 8, '1': 6})

    fig, ax = plt.subplots(figsize=(5.3, 2))

    # Conversion en pourcentages
    total = sum(distribution.values())
    stars = [5, 4, 3, 2, 1]
    counts = [distribution.get(str(s), 0) for s in stars]
    pcts = [c/total*100 if total > 0 else 0 for c in counts]

    # Couleurs selon étoiles
    colors = [GN, '#22C55E', AM, OR, RD]

    # Barres horizontales
    bars = ax.barh(range(len(stars)), pcts, height=0.6, color=colors, zorder=3)

    # Labels et annotations
    ax.set_yticks(range(len(stars)))
    ax.set_yticklabels([f'{s} {"★"*s}' for s in stars], fontsize=10, fontweight='bold', color=NK)
    ax.set_xlim(0, 100)

    for bar, pct, count, star in zip(bars, pcts, counts, stars):
        if pct > 0:
            ax.text(pct + 2, bar.get_y() + bar.get_height()/2,
                   f'{pct:.0f}% ({count} avis)', va='center', fontsize=9, color=GR)

    # Note moyenne calculée
    note_moyenne = sum(s*c for s, c in zip(stars, counts)) / total if total > 0 else 0
    ax.text(70, 4.3, f'{note_moyenne:.1f}', fontsize=36, fontweight='bold', color=BL, ha='center')
    ax.text(85, 4.3, '/5', fontsize=14, color=GR, ha='left', va='center')

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.tick_params(left=False)
    ax.grid(axis='x', color=GXL, lw=0.3, zorder=1)

    plt.title(f'Distribution Google — {total} avis', fontsize=12, fontweight='bold', color=NK, pad=15)

    pct_5_stars = pcts[0]
    pct_1_stars = pcts[-1]
    plt.figtext(0.5, 0.01, f'{pct_5_stars:.0f}% de 5 étoiles — satisfaction client excellente',
                ha='center', fontsize=9, color=GN, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's06-distribution.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's06-distribution.png'

# ═══════════════════════════════════════════════════════════════
# 7. WORDCLOUD — Nuage de mots positifs/négatifs
# ═══════════════════════════════════════════════════════════════

def generate_wordcloud(data, output_dir):
    """Génère un nuage de mots positifs/négatifs"""
    keywords_pos = data.get('keywords_positifs', ['professionnel', 'qualité', 'accueil', 'soins'])
    keywords_neg = data.get('keywords_negatifs', ['attente', 'cher'])

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(4.8, 3.2))

    if HAS_WORDCLOUD:
        # WordCloud positif
        if keywords_pos:
            wordcloud_pos = WordCloud(width=240, height=160,
                                     background_color='white',
                                     colormap='Greens',
                                     max_words=20,
                                     relative_scaling=0.5).generate(' '.join(keywords_pos * 3))
            ax1.imshow(wordcloud_pos, interpolation='bilinear')
        ax1.set_title('Mots Positifs', fontsize=10, fontweight='bold', color=GN)
        ax1.axis('off')

        # WordCloud négatif
        if keywords_neg:
            wordcloud_neg = WordCloud(width=240, height=160,
                                     background_color='white',
                                     colormap='Reds',
                                     max_words=15,
                                     relative_scaling=0.5).generate(' '.join(keywords_neg * 2))
            ax2.imshow(wordcloud_neg, interpolation='bilinear')
        ax2.set_title('Mots Négatifs', fontsize=10, fontweight='bold', color=RD)
        ax2.axis('off')

    else:
        # Fallback sans wordcloud library
        ax1.text(0.5, 0.5, '\n'.join(keywords_pos[:8]), ha='center', va='center',
                fontsize=10, color=GN, fontweight='bold', transform=ax1.transAxes)
        ax1.set_title('Mots Positifs', fontsize=10, fontweight='bold', color=GN)
        ax1.axis('off')

        ax2.text(0.5, 0.5, '\n'.join(keywords_neg[:8]), ha='center', va='center',
                fontsize=10, color=RD, fontweight='bold', transform=ax2.transAxes)
        ax2.set_title('Mots Négatifs', fontsize=10, fontweight='bold', color=RD)
        ax2.axis('off')

    plt.suptitle('Analyse Sentiments Avis Clients', fontsize=12, fontweight='bold', color=NK, y=0.98)
    plt.figtext(0.5, 0.01, f'{len(keywords_pos)} mots positifs dominants vs {len(keywords_neg)} points d\'amélioration',
                ha='center', fontsize=8, color=OR, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.95])
    plt.savefig(output_dir / 's07-wordcloud.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's07-wordcloud.png'

# ═══════════════════════════════════════════════════════════════
# 8. TIMELINE — Timeline placeholder
# ═══════════════════════════════════════════════════════════════

def generate_timeline(data, output_dir):
    """Génère une timeline placeholder"""
    fig, ax = plt.subplots(figsize=(5.3, 2))

    # Timeline générique parcours client
    steps = [
        (0, 'Découverte', OR),
        (1, 'Recherche', ORL),
        (2, 'Comparaison', BL),
        (3, 'Contact', VI),
        (4, 'Visite', GN),
        (5, 'Décision', NK)
    ]

    # Ligne de base
    ax.plot([0, 5], [0, 0], color=GXL, lw=3, zorder=1)

    for i, (x, label, color) in enumerate(steps):
        ax.plot(x, 0, 'o', color=color, markersize=12, zorder=3,
                markeredgecolor=W, markeredgewidth=2)

        # Labels en alternance haut/bas
        y_label = 0.3 if i % 2 == 0 else -0.3
        ax.text(x, y_label, label, ha='center', va='center', fontsize=9,
                fontweight='bold', color=NK,
                bbox=dict(boxstyle='round,pad=0.3', facecolor=color+'15',
                         edgecolor=color, lw=1))

        # Timing
        timing = f'J+{i*7}' if i > 0 else 'J0'
        ax.text(x, -0.1 if i % 2 == 0 else 0.1, timing, ha='center',
                fontsize=7, color=GR, fontweight='bold')

    ax.set_xlim(-0.5, 5.5)
    ax.set_ylim(-0.6, 0.6)
    ax.axis('off')

    plt.title('Parcours Type Prospect → Client', fontsize=12, fontweight='bold', color=NK, pad=20)
    plt.figtext(0.5, 0.01, 'De la découverte à la décision : 6 semaines de parcours optimisé',
                ha='center', fontsize=9, color=BL, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's08-timeline.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's08-timeline.png'

# ═══════════════════════════════════════════════════════════════
# 9. GAP — Matrice soins actuels vs formations manquantes
# ═══════════════════════════════════════════════════════════════

def generate_gap(data, output_dir):
    """Génère matrice gap soins actuels vs formations possibles"""
    soins_actuels = data.get('carte_soins', ['soins visage', 'massages', 'epilation'])
    formations_dermotec = data.get('formations_dermotec', ['Microblading', 'Full Lips', 'Dermopigmentation'])

    fig, ax = plt.subplots(figsize=(5.3, 3))

    # Zone soins actuels (vert)
    for i, soin in enumerate(soins_actuels[:6]):  # Max 6 pour lisibilité
        ax.add_patch(mpatches.FancyBboxPatch((0.05, 0.8 - i*0.12), 0.4, 0.08,
                    boxstyle="round,pad=0.01", facecolor=GNBG, edgecolor=GN,
                    linewidth=1.5, transform=ax.transAxes))
        ax.text(0.25, 0.84 - i*0.12, soin.title(), ha='center', va='center',
                fontsize=9, fontweight='bold', color=GN, transform=ax.transAxes)

    # Zone formations possibles (rouge/orange)
    for i, formation in enumerate(formations_dermotec[:6]):
        ax.add_patch(mpatches.FancyBboxPatch((0.55, 0.8 - i*0.12), 0.4, 0.08,
                    boxstyle="round,pad=0.01", facecolor=ORBG, edgecolor=OR,
                    linewidth=1.5, transform=ax.transAxes))
        ax.text(0.75, 0.84 - i*0.12, formation, ha='center', va='center',
                fontsize=9, fontweight='bold', color=OR, transform=ax.transAxes)

    # Titres des colonnes
    ax.text(0.25, 0.95, 'Soins Actuels', ha='center', va='center',
            fontsize=11, fontweight='bold', color=GN, transform=ax.transAxes)
    ax.text(0.75, 0.95, 'Formations Disponibles', ha='center', va='center',
            fontsize=11, fontweight='bold', color=OR, transform=ax.transAxes)

    # Flèche
    ax.annotate('', xy=(0.53, 0.7), xytext=(0.47, 0.7),
                arrowprops=dict(arrowstyle='->', color=NK, lw=2),
                transform=ax.transAxes)
    ax.text(0.5, 0.72, 'EXPANSION', ha='center', fontsize=8, fontweight='bold',
            color=NK, transform=ax.transAxes)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')

    plt.title('Gap Analysis : Soins vs Formations', fontsize=12, fontweight='bold', color=NK, y=0.98)

    nb_formations = len(formations_dermotec)
    plt.figtext(0.5, 0.01, f'{nb_formations} formations Dermotec pour diversifier l\'offre et augmenter le panier moyen',
                ha='center', fontsize=9, color=OR, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's09-gap.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's09-gap.png'

# ═══════════════════════════════════════════════════════════════
# 11. DÉMOGRAPHIE — Barres CSP/revenus quartier
# ═══════════════════════════════════════════════════════════════

def generate_demographie(data, output_dir):
    """Génère graphique démographie quartier"""
    zone_data = data.get('zone', {})

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(5.3, 2.4), gridspec_kw={'width_ratios': [1.2, 1]})

    # LEFT: CSP en barres horizontales (données par défaut Paris)
    csp = [
        ('Cadres / Prof. intel.', 38, VI),
        ('Prof. intermediaires', 22, BL),
        ('Employes', 18, CY),
        ('Artisans / Comm.', 12, AM),
        ('Ouvriers', 6, GR),
        ('Autres', 4, GRL),
    ]

    labels = [c[0] for c in csp]
    vals = [c[1] for c in csp]
    colors = [c[2] for c in csp]

    y = np.arange(len(labels))
    bars = ax1.barh(y, vals, height=0.55, color=colors, zorder=3)

    ax1.set_yticks(y)
    ax1.set_yticklabels(labels, fontsize=8, fontweight='bold', color=NK)
    ax1.set_xlim(0, 50)

    for bar, val in zip(bars, vals):
        ax1.text(val + 1, bar.get_y() + bar.get_height()/2,
                f'{val}%', va='center', fontsize=8, fontweight='bold', color=GR)

    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.spines['left'].set_visible(False)
    ax1.tick_params(left=False)
    ax1.grid(axis='x', color=GXL, linewidth=0.3, zorder=1)
    ax1.set_title('CSP Quartier', fontsize=9, fontweight='bold', color=NK, loc='left')

    # RIGHT: KPIs démographiques
    ax2.axis('off')
    revenu_median = zone_data.get('revenu_median', 28500)
    metros = zone_data.get('metros', 3)
    concurrents = zone_data.get('concurrents_count', 15)

    kpis = [
        ('Revenu médian', f'{revenu_median:,} EUR'.replace(',', ' '), VI),
        ('Prix m²', '10 800 EUR', AM),
        ('Métros', f'{metros} lignes', CY),
        ('25-39 ans', '34%', BL),
        ('Diplômés sup.', '58%', GN),
        ('Concurrents', f'{concurrents}', RD),
    ]

    for i, (label, value, color) in enumerate(kpis):
        row = i // 2
        col = i % 2
        x = 0.1 + col * 0.5
        y_pos = 0.85 - row * 0.32

        ax2.text(x, y_pos, value, ha='center', va='center',
                fontsize=14, fontweight='bold', color=color, transform=ax2.transAxes)
        ax2.text(x, y_pos - 0.12, label, ha='center', va='center',
                fontsize=7, color=GR, transform=ax2.transAxes)

    plt.suptitle('Quartier CSP+ avec fort pouvoir d\'achat', fontsize=11, fontweight='bold', color=NK, y=0.99)
    plt.figtext(0.5, 0.01, f'38% cadres + {revenu_median:,} EUR médian = clientèle premium prête à investir'.replace(',', ' '),
                ha='center', fontsize=8, color=BL, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(output_dir / 's11-demographie.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's11-demographie.png'

# ═══════════════════════════════════════════════════════════════
# 12. CONCURRENTS SCATTER — Note × avis concurrents
# ═══════════════════════════════════════════════════════════════

def generate_concurrents_scatter(data, output_dir):
    """Génère scatter des concurrents note vs avis"""
    concurrents = data.get('concurrents', [])
    prospect_data = data.get('prospect', {})

    # Données par défaut si manquantes
    if not concurrents:
        concurrents = [
            {'nom': 'Bodyminute', 'note': 3.7, 'avis': 76},
            {'nom': 'Zen et Beauté', 'note': 4.7, 'avis': 141},
            {'nom': 'Skin Easy', 'note': 4.9, 'avis': 139}
        ]

    fig, ax = plt.subplots(figsize=(5.2, 2.8))

    # Concurrents
    notes = [c.get('note', 4.0) for c in concurrents]
    avis = [c.get('avis', 50) for c in concurrents]

    ax.scatter(avis, notes, color=GR, s=100, alpha=0.7, zorder=2,
              edgecolor=W, linewidth=1.5)

    # Annotations concurrents
    for i, c in enumerate(concurrents):
        ax.annotate(c.get('nom', f'Concurrent {i+1}'),
                   (avis[i], notes[i]),
                   xytext=(8, 8), textcoords='offset points',
                   fontsize=7, color=GR, fontweight='bold')

    # Prospect (utilise meilleure plateforme)
    plateformes = data.get('plateformes', [])
    if plateformes:
        best = max(plateformes, key=lambda p: p.get('avis', 0))
        ax.scatter(best['avis'], best['note'], color=OR, s=200, zorder=5,
                  edgecolor=NK, linewidth=2)
        ax.annotate(prospect_data.get('nom', 'Prospect'),
                   (best['avis'], best['note']),
                   xytext=(10, -15), textcoords='offset points',
                   fontsize=9, fontweight='bold', color=OR,
                   bbox=dict(boxstyle='round,pad=0.3', facecolor=ORBG,
                            edgecolor=OR, lw=1.5))

    # Zone excellence
    if notes and avis:
        max_avis = max(avis) if avis else 200
        ax.axhspan(4.5, 5.1, alpha=0.05, color=GN, zorder=1)
        ax.axvspan(max_avis * 0.7, ax.get_xlim()[1], alpha=0.05, color=GN, zorder=1)
        ax.text(max_avis * 0.85, 4.7, 'Zone\nExcellence', fontsize=7,
                color=GN, fontweight='bold', ha='center')

    ax.set_xlabel('Nombre d\'avis', fontsize=9, color=NK)
    ax.set_ylabel('Note moyenne', fontsize=9, color=NK)
    ax.set_ylim(3.0, 5.1)
    ax.grid(True, alpha=0.3, color=GXL)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.title('Positionnement vs Concurrence', fontsize=11, fontweight='bold', color=NK, pad=15)

    if notes:
        best_competitor_note = max(notes)
        worst_competitor_note = min(notes)
        plt.figtext(0.5, 0.01, f'Écart concurrentiel : {best_competitor_note:.1f} (meilleur) vs {worst_competitor_note:.1f} (moins bon)',
                    ha='center', fontsize=8, color=BL, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's12-concurrents-scatter.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's12-concurrents-scatter.png'

# ═══════════════════════════════════════════════════════════════
# 13. RADAR CONCURRENTS — Prospect vs top 3
# ═══════════════════════════════════════════════════════════════

def generate_radar_concurrents(data, output_dir):
    """Génère radar prospect vs top 3 concurrents"""
    concurrents = data.get('concurrents', [])[:3]  # Top 3 seulement
    prospect_scores = data.get('scores', {})

    fig, ax = plt.subplots(figsize=(4.8, 4.2), subplot_kw=dict(polar=True))

    N = 5
    angles = [n / float(N) * 2 * math.pi for n in range(N)] + [0]
    labels = ['Réputation', 'Présence', 'Activité', 'Financier', 'Quartier']

    # Configuration polaire
    ax.set_theta_offset(math.pi / 2)
    ax.set_theta_direction(-1)
    ax.set_rmax(100)
    ax.set_rticks([25, 50, 75, 100])
    ax.set_yticklabels(['', '50', '75', ''], fontsize=7, color=GRL)
    ax.spines['polar'].set_visible(False)
    ax.grid(color=GXL, lw=0.6)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, fontsize=10, fontweight='bold', color=NK)

    # Prospect (orange)
    prospect_vals = [
        prospect_scores.get('reputation', 70),
        prospect_scores.get('presence', 60),
        prospect_scores.get('activite', 50),
        prospect_scores.get('financier', 45),
        prospect_scores.get('quartier', 70)
    ] + [prospect_scores.get('reputation', 70)]

    ax.fill(angles, prospect_vals, color=OR, alpha=0.1)
    ax.plot(angles, prospect_vals, color=OR, lw=3, label=data.get('prospect', {}).get('nom', 'Prospect'))

    # Concurrents (couleurs distinctes)
    colors_conc = [GR, GRL, '#AAAAAA']
    for i, concurrent in enumerate(concurrents):
        # Scores simulés pour les concurrents basés sur leur note
        note = concurrent.get('note', 4.0)
        base_score = (note - 2) / 3 * 80  # Conversion note 2-5 vers score 0-80

        conc_vals = [
            base_score + np.random.randint(-10, 10),  # Réputation
            base_score + np.random.randint(-15, 15),  # Présence
            base_score + np.random.randint(-20, 10),  # Activité
            base_score + np.random.randint(-10, 20),  # Financier
            base_score + np.random.randint(-5, 15)    # Quartier
        ]
        conc_vals = [max(0, min(100, v)) for v in conc_vals]  # Borner 0-100
        conc_vals += [conc_vals[0]]  # Fermer le polygone

        ax.plot(angles, conc_vals, '--', color=colors_conc[i], lw=2, alpha=0.7,
                label=concurrent.get('nom', f'Concurrent {i+1}'))

    ax.legend(loc='lower right', bbox_to_anchor=(1.3, -0.1), fontsize=8,
              frameon=True, facecolor=W, edgecolor=GXL)

    plt.suptitle('Benchmark Concurrentiel — Forces et faiblesses', fontsize=11, fontweight='bold', color=NK, y=0.99)
    plt.figtext(0.5, 0.01, 'Identification des axes de différenciation et opportunités de marché',
                ha='center', fontsize=8, color=OR, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(output_dir / 's13-radar-concurrents.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's13-radar-concurrents.png'

# ═══════════════════════════════════════════════════════════════
# 14. DIGITAL — Scorecard 6 canaux digitaux
# ═══════════════════════════════════════════════════════════════

def generate_digital(data, output_dir):
    """Génère scorecard présence digitale"""
    plateformes = data.get('plateformes', [])

    # Scores calculés depuis les plateformes + estimations
    channels = [
        ('Google Business', 0, BL, 'Profil à créer'),
        ('Site Web', 0, CY, 'Site à développer'),
        ('Instagram', 0, RS, 'Compte inexistant'),
        ('Facebook', 0, '#1877F2', 'Page à créer'),
        ('Planity', 0, VI, 'Non référencé'),
        ('TikTok', 0, NK, 'Absent')
    ]

    # Mise à jour avec données réelles si disponibles
    for platform in plateformes:
        nom = platform['nom'].lower()
        note = platform.get('note', 0)
        avis = platform.get('avis', 0)

        # Calcul score (note × log(avis+1) normalisé sur 100)
        if note > 0 and avis > 0:
            score = min(100, int(note * 20 + math.log(avis + 1) * 5))
            detail = f"{note}/5 | {avis} avis"
        elif note > 0:
            score = int(note * 20)
            detail = f"{note}/5"
        else:
            score = 0
            detail = "Inactif"

        # Mapping vers channels
        for i, (chan_nom, _, color, _) in enumerate(channels):
            if nom in chan_nom.lower().replace(' ', ''):
                channels[i] = (chan_nom, score, color, detail)
                break

    fig, ax = plt.subplots(figsize=(5.2, 2.4))
    ax.axis('off')

    for i, (name, score, color, detail) in enumerate(channels):
        y = 0.88 - i * 0.15

        # Label canal
        ax.text(0.02, y, name, ha='left', va='center', fontsize=9, fontweight='bold',
                color=NK, transform=ax.transAxes)

        # Barre de progression
        bar_x, bar_w = 0.25, 0.4
        ax.add_patch(mpatches.FancyBboxPatch((bar_x, y - 0.02), bar_w, 0.04,
                     boxstyle="round,pad=0.01", facecolor=GXL, transform=ax.transAxes, zorder=2))

        fill_w = bar_w * score / 100
        if fill_w > 0:
            ax.add_patch(mpatches.FancyBboxPatch((bar_x, y - 0.02), fill_w, 0.04,
                         boxstyle="round,pad=0.01", facecolor=color, alpha=0.8,
                         transform=ax.transAxes, zorder=3))

        # Score numérique
        ax.text(bar_x + bar_w + 0.02, y, f'{score}/100', ha='left', va='center',
                fontsize=8, fontweight='bold', color=color, transform=ax.transAxes)

        # Détail
        ax.text(0.75, y, detail, ha='left', va='center', fontsize=7, color=GR,
                transform=ax.transAxes, style='italic')

    # Score global
    avg = sum(c[1] for c in channels) / len(channels)
    color_avg = GN if avg >= 70 else OR if avg >= 40 else RD

    ax.text(0.5, 0.02, f'Score digital global : {avg:.0f}/100',
            ha='center', va='center', fontsize=10, fontweight='bold', color=color_avg,
            transform=ax.transAxes,
            bbox=dict(boxstyle='round,pad=0.4', facecolor=color_avg+'15',
                     edgecolor=color_avg, lw=1.5))

    plt.title('Présence Digitale — Audit 6 Canaux', fontsize=11, fontweight='bold', color=NK, y=0.99)

    best_channel = max(channels, key=lambda x: x[1])
    plt.figtext(0.5, -0.02, f'{best_channel[0]} = canal principal ({best_channel[1]}/100) — développer les autres',
                ha='center', fontsize=8, color=BL, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's14-digital.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's14-digital.png'

# ═══════════════════════════════════════════════════════════════
# 15. HORAIRES — Placeholder barres horizontales
# ═══════════════════════════════════════════════════════════════

def generate_horaires(data, output_dir):
    """Génère comparaison horaires (placeholder)"""
    fig, ax = plt.subplots(figsize=(5.3, 2.2))

    # Données horaires simulées
    jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    prospect_nom = data.get('prospect', {}).get('nom', 'Prospect')

    salons = [
        (prospect_nom, [(10, 19), (10, 19), (10, 19), (10, 19), (10, 19), (10, 18), None], OR),
        ('Concurrent A', [(9, 20), (9, 20), (9, 20), (9, 20), (9, 20), (9, 19), None], GR),
        ('Concurrent B', [(10, 20), (10, 20), (10, 20), (10, 20), (10, 20), (10, 19), (11, 17)], GRL),
    ]

    y_pos = 0
    for salon_name, horaires, color in salons:
        for j, slot in enumerate(horaires):
            if slot:
                start, end = slot
                ax.barh(y_pos, end - start, left=start, height=0.4,
                        color=color + ('AA' if salon_name != prospect_nom else 'CC'),
                        edgecolor=color, linewidth=1.5 if salon_name == prospect_nom else 1,
                        zorder=3 if salon_name == prospect_nom else 2)

                if salon_name == prospect_nom:
                    ax.text(start + (end - start) / 2, y_pos, f'{start}h-{end}h',
                            ha='center', va='center', fontsize=6, color=W,
                            fontweight='bold', zorder=4)
            y_pos += 1
        y_pos += 0.3

    # Labels Y
    positions = [3.5, 10.3, 17.1]  # Milieux des groupes
    ax.set_yticks(positions)
    ax.set_yticklabels([s[0] for s in salons], fontsize=9, fontweight='bold', color=NK)

    ax.set_xlim(8, 22)
    ax.set_xticks(range(9, 22, 2))
    ax.set_xticklabels([f'{h}h' for h in range(9, 22, 2)], fontsize=8, color=GR)
    ax.set_xlabel('Heures d\'ouverture', fontsize=9, color=NK)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='x', color=GXL, linewidth=0.3, zorder=1)
    ax.invert_yaxis()

    plt.title('Comparaison Horaires d\'Ouverture', fontsize=11, fontweight='bold', color=NK, pad=15)
    plt.figtext(0.5, 0.01, 'Opportunité : étendre les horaires pour capturer plus de clientèle',
                ha='center', fontsize=8, color=OR, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's15-horaires.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's15-horaires.png'

# ═══════════════════════════════════════════════════════════════
# 16. TENDANCES — Placeholder courbes marché
# ═══════════════════════════════════════════════════════════════

def generate_tendances(data, output_dir):
    """Génère tendances marché (placeholder)"""
    formations = data.get('formations_dermotec', ['Microblading', 'Full Lips'])

    fig, ax = plt.subplots(figsize=(5.2, 2.3))

    # Données simulées tendances recherche
    mois = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
    microblading = [65, 72, 85, 90, 88, 78, 60, 55, 82, 95, 88, 70]
    soins_classiques = [50, 52, 55, 58, 60, 55, 48, 45, 58, 62, 60, 55]

    x = np.arange(len(mois))

    # Courbes avec zones de remplissage
    ax.fill_between(x, microblading, alpha=0.1, color=OR)
    ax.plot(x, microblading, '-o', color=OR, linewidth=2.5, markersize=4,
            label='Microblading', zorder=3)

    ax.fill_between(x, soins_classiques, alpha=0.05, color=BL)
    ax.plot(x, soins_classiques, '--', color=BL, linewidth=1.5,
            label='Soins classiques', zorder=2)

    # Annotation pic saisonnier
    peak_idx = microblading.index(max(microblading))
    ax.annotate(f'Pic saisonnier\n{mois[peak_idx]} ({max(microblading)})',
                xy=(peak_idx, max(microblading)),
                xytext=(peak_idx + 1, max(microblading) + 8),
                fontsize=7, fontweight='bold', color=OR,
                arrowprops=dict(arrowstyle='->', color=OR, lw=1.5),
                bbox=dict(boxstyle='round,pad=0.2', facecolor=ORBG, edgecolor=OR, lw=1))

    # Zones haute saison
    ax.axvspan(2.5, 4.5, color=GN, alpha=0.04, zorder=1)
    ax.axvspan(8.5, 10.5, color=GN, alpha=0.04, zorder=1)
    ax.text(3.5, 35, 'Haute\nsaison', fontsize=6, color=GN, ha='center', fontweight='bold')
    ax.text(9.5, 35, 'Haute\nsaison', fontsize=6, color=GN, ha='center', fontweight='bold')

    ax.set_xticks(x)
    ax.set_xticklabels(mois, fontsize=8, color=GR)
    ax.set_ylabel('Indice recherche', fontsize=9, color=NK)
    ax.set_ylim(30, 105)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', color=GXL, linewidth=0.3, zorder=1)
    ax.legend(fontsize=8, loc='lower left', frameon=True, facecolor=W, edgecolor=GXL)

    plt.title('Tendances Marché — Demande Saisonnière', fontsize=11, fontweight='bold', color=NK, pad=15)
    plt.figtext(0.5, 0.01, f'Microblading en forte croissance — lancer pendant les pics mars/octobre',
                ha='center', fontsize=8, color=GN, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's16-tendances.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's16-tendances.png'

# ═══════════════════════════════════════════════════════════════
# 17. WATERFALL — ROI CA actuel → +formations → CA futur
# ═══════════════════════════════════════════════════════════════

def generate_waterfall(data, output_dir):
    """Génère waterfall ROI"""
    roi_data = data.get('roi', {})
    ca_actuel = roi_data.get('ca_actuel', 13000)
    formations = roi_data.get('formations', [])

    if not formations:
        formations = [
            {'nom': 'Microblading', 'ca_additionnel': 3200},
            {'nom': 'Full Lips', 'ca_additionnel': 1800}
        ]

    fig, ax = plt.subplots(figsize=(5.3, 2.9))

    # Préparation données waterfall
    categories = ['CA actuel\nmensuel']
    valeurs = [ca_actuel]
    bottoms = [0]
    colors = [GRL]
    is_total = [False]

    # Ajout formations
    for formation in formations:
        categories.append(f"{formation['nom']}\n+{formation['ca_additionnel']:,}".replace(',', ' '))
        valeurs.append(formation['ca_additionnel'])
        bottoms.append(sum(valeurs[:-1]))
        colors.append(OR if 'Micro' in formation['nom'] else RS)
        is_total.append(False)

    # CA total mensuel
    ca_total_mensuel = ca_actuel + sum(f['ca_additionnel'] for f in formations)
    categories.extend(['CA total\nmensuel', 'CA total\nannuel'])
    valeurs.extend([ca_total_mensuel, ca_total_mensuel * 12])
    bottoms.extend([0, 0])
    colors.extend([GN, '#059669'])
    is_total.extend([True, True])

    # Génération barres
    for i, (cat, val, bottom, color, total) in enumerate(zip(categories, valeurs, bottoms, colors, is_total)):
        if total:
            ax.bar(i, val, width=0.6, color=color+'30', edgecolor=color, lw=2, zorder=3)
        else:
            ax.bar(i, val, bottom=bottom, width=0.6, color=color+'CC', edgecolor=color, lw=1.5, zorder=3)

        # Annotations valeurs
        y_text = (bottom + val) if not total else val
        ax.text(i, y_text + max(valeurs) * 0.02, f'{val:,} EUR'.replace(',', ' '),
                ha='center', va='bottom', fontsize=9, fontweight='bold', color=color)

    # Configuration axes
    ax.set_xticks(range(len(categories)))
    ax.set_xticklabels(categories, fontsize=8, fontweight='bold', color=NK)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', color=GXL, lw=0.3, zorder=1)

    # Annotation ROI
    ca_annuel = ca_total_mensuel * 12
    croissance = ((ca_total_mensuel - ca_actuel) / ca_actuel * 100) if ca_actuel > 0 else 0
    ax.annotate(f'+{croissance:.0f}% CA\nannuel',
                xy=(len(categories)-1, ca_annuel),
                xytext=(len(categories)-1, ca_annuel + max(valeurs) * 0.15),
                fontsize=10, fontweight='bold', color=GN, ha='center',
                bbox=dict(boxstyle='round,pad=0.3', facecolor=GNBG, edgecolor=GN, lw=1.5))

    plt.title(f'+{ca_total_mensuel-ca_actuel:,} EUR/mois avec formations Dermotec'.replace(',', ' '),
              fontsize=11, fontweight='bold', color=NK, y=0.99)
    plt.figtext(0.5, 0.01, 'Investissement : 0 EUR (OPCO) | ROI immédiat dès la 1ère cliente',
                ha='center', fontsize=8, color=GN, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(output_dir / 's17-waterfall.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's17-waterfall.png'

# ═══════════════════════════════════════════════════════════════
# 18. ROI MENSUEL — Courbe ROI mois 1-12 avec break-even
# ═══════════════════════════════════════════════════════════════

def generate_roi_mensuel(data, output_dir):
    """Génère courbe ROI mensuelle avec break-even"""
    roi_data = data.get('roi', {})
    ca_actuel = roi_data.get('ca_actuel', 13000)
    formations = roi_data.get('formations', [])

    if not formations:
        formations = [
            {'nom': 'Microblading', 'ca_additionnel': 3200},
            {'nom': 'Full Lips', 'ca_additionnel': 1800}
        ]

    ca_additionnel_total = sum(f['ca_additionnel'] for f in formations)

    fig, ax = plt.subplots(figsize=(5.3, 2.3))

    # Simulation ROI mensuel (montée progressive)
    mois = np.arange(1, 13)

    # Courbe réaliste : démarrage lent puis accélération
    facteurs_montee = np.array([0.2, 0.4, 0.6, 0.75, 0.85, 0.92, 0.96, 0.98, 1.0, 1.0, 1.0, 1.0])
    ca_mensuel = ca_actuel + ca_additionnel_total * facteurs_montee
    ca_cumule = np.cumsum(ca_mensuel)

    # CA cumulé sans formations (ligne de base)
    ca_base_cumule = np.cumsum([ca_actuel] * 12)

    # Graphique aires empilées
    ax.fill_between(mois, 0, ca_base_cumule/1000, color=GRL, alpha=0.3, label='CA base')
    ax.fill_between(mois, ca_base_cumule/1000, ca_cumule/1000, color=OR, alpha=0.4, label='CA formations')

    # Courbes
    ax.plot(mois, ca_base_cumule/1000, '--', color=GR, lw=2, label='Sans formations')
    ax.plot(mois, ca_cumule/1000, '-', color=OR, lw=3, label='Avec formations')

    # Points de données mensuels
    ax.scatter(mois, ca_cumule/1000, color=OR, s=30, zorder=5, edgecolor=W, linewidth=1)

    # Break-even (supposé à 0 EUR d'investissement = immédiat)
    ax.axhline(y=ca_actuel*12/1000, color=GN, linestyle=':', lw=2, alpha=0.7)
    ax.text(6, ca_actuel*12/1000 + 10, 'Break-even (M1)', fontsize=7, color=GN,
            fontweight='bold', ha='center',
            bbox=dict(boxstyle='round,pad=0.2', facecolor=GNBG, edgecolor=GN, lw=1))

    # Annotations clés
    gain_annuel = (ca_cumule[-1] - ca_base_cumule[-1]) / 1000
    ax.annotate(f'+{gain_annuel:.0f}K EUR\ngain annuel',
                xy=(12, ca_cumule[-1]/1000),
                xytext=(10, ca_cumule[-1]/1000 + 15),
                fontsize=8, fontweight='bold', color=OR, ha='center',
                arrowprops=dict(arrowstyle='->', color=OR, lw=1.5),
                bbox=dict(boxstyle='round,pad=0.3', facecolor=ORBG, edgecolor=OR, lw=1))

    ax.set_xlabel('Mois', fontsize=9, color=NK)
    ax.set_ylabel('CA cumulé (K EUR)', fontsize=9, color=NK)
    ax.set_xlim(0.5, 12.5)
    ax.grid(True, alpha=0.3, color=GXL)
    ax.legend(fontsize=8, loc='upper left', frameon=True, facecolor=W, edgecolor=GXL)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.title('ROI Mensuel — Montée en Puissance', fontsize=11, fontweight='bold', color=NK, pad=15)
    plt.figtext(0.5, 0.01, f'Formation gratuite OPCO → retour immédiat → +{gain_annuel:.0f}K EUR la 1ère année',
                ha='center', fontsize=8, color=GN, fontweight='bold', style='italic')

    footer(fig)
    plt.tight_layout()
    plt.savefig(output_dir / 's18-roi-mensuel.png', dpi=200, bbox_inches='tight', facecolor=W)
    plt.close()
    return 's18-roi-mensuel.png'

# ═══════════════════════════════════════════════════════════════
# MAIN — Génération de tous les graphiques
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='Générateur de graphiques Satorea CRM')
    parser.add_argument('--input', required=True, help='Fichier JSON de données')
    parser.add_argument('--output', required=True, help='Dossier de sortie')
    args = parser.parse_args()

    # Lecture données JSON
    input_path = Path(args.input)
    output_dir = Path(args.output)

    if not input_path.exists():
        print(f"❌ Fichier {input_path} introuvable")
        return

    output_dir.mkdir(exist_ok=True)

    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Erreur lecture JSON: {e}")
        return
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return

    print("🎨 SATOREA CRM — Génération 18 graphiques consulting\n")
    print(f"📂 Input:  {input_path}")
    print(f"📂 Output: {output_dir}")
    print(f"🏢 Prospect: {data.get('prospect', {}).get('nom', 'N/A')}")
    print(f"📊 Score: {data.get('prospect', {}).get('score_global', data.get('scores', {}).get('global', 'N/A'))}/100\n")

    # Génération de tous les graphiques
    generators = [
        ("01 — Gauge score global", generate_gauge),
        ("02 — Radar 5 axes", generate_radar),
        ("03 — Sparkline tendance", generate_sparkline),
        ("04 — Heatmap plateformes", generate_heatmap),
        ("05 — Scatter concurrentiel", generate_scatter),
        ("06 — Distribution Google", generate_distribution),
        ("07 — WordCloud sentiments", generate_wordcloud),
        ("08 — Timeline parcours", generate_timeline),
        ("09 — Gap analysis", generate_gap),
        ("11 — Démographie quartier", generate_demographie),
        ("12 — Concurrents scatter", generate_concurrents_scatter),
        ("13 — Radar concurrentiel", generate_radar_concurrents),
        ("14 — Scorecard digital", generate_digital),
        ("15 — Horaires comparés", generate_horaires),
        ("16 — Tendances marché", generate_tendances),
        ("17 — Waterfall ROI", generate_waterfall),
        ("18 — ROI mensuel", generate_roi_mensuel),
    ]

    generated_files = []

    for desc, generator in generators:
        try:
            filename = generator(data, output_dir)
            generated_files.append(filename)
            print(f"  ✅ {desc} → {filename}")
        except Exception as e:
            print(f"  ❌ {desc} → Erreur: {e}")

    print(f"\n🎯 Terminé ! {len(generated_files)}/17 graphiques générés")
    print(f"📁 Fichiers dans: {output_dir}/")

    # Note s10-carte.png est généré par carte-premium.py
    print("\n💡 Note: s10-carte.png doit être généré séparément avec carte-premium.py")

    if len(generated_files) < 17:
        print("⚠️  Certains graphiques ont échoué. Vérifiez les erreurs ci-dessus.")

if __name__ == '__main__':
    main()