"""
SATOREA — Generateur de graphiques style consulting
Chaque graphique = 1 message cle (titre = insight, pas description)

Input: fichier JSON avec données + insights générés par Claude
Output: PNG haute qualité dans ./charts/

Usage:
  python scripts/generate-charts.py data.json
  python scripts/generate-charts.py  # utilise les données de test intégrées
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import json
import sys
from pathlib import Path
import math
from typing import Optional

# ══════════════════════════════════════════════════════════════
# CHARTE GRAPHIQUE SATOREA
# ══════════════════════════════════════════════════════════════
class Theme:
    BRAND = '#2EC6F3'
    ACCENT = '#082545'
    GREEN = '#10B981'
    GREEN_DARK = '#059669'
    GREEN_BG = '#ECFDF5'
    AMBER = '#F59E0B'
    AMBER_DARK = '#D97706'
    AMBER_BG = '#FFFBEB'
    RED = '#EF4444'
    RED_BG = '#FEF2F2'
    INDIGO = '#6366F1'
    VIOLET = '#8B5CF6'
    TEAL = '#14B8A6'
    TEXT = '#1E293B'
    TEXT_MED = '#475569'
    TEXT_LIGHT = '#94A3B8'
    TEXT_XLIGHT = '#CBD5E1'
    BG = '#FFFFFF'
    CARD = '#F8FAFC'
    BORDER = '#E2E8F0'
    BORDER_SOFT = '#F1F5F9'

    # Dimensions du scoring
    DIM_COLORS = [GREEN, '#3B82F6', VIOLET, AMBER, TEAL]
    DIM_LABELS = ['Reputation', 'Presence', 'Activite', 'Financier', 'Quartier']

    @staticmethod
    def setup():
        plt.rcParams.update({
            'font.family': 'sans-serif',
            'font.sans-serif': ['Segoe UI', 'Calibri', 'Arial'],
            'axes.facecolor': Theme.BG,
            'figure.facecolor': Theme.BG,
            'text.color': Theme.TEXT,
            'axes.edgecolor': Theme.BORDER,
            'axes.labelcolor': Theme.TEXT_LIGHT,
            'xtick.color': Theme.TEXT_LIGHT,
            'ytick.color': Theme.TEXT_LIGHT,
        })

# ══════════════════════════════════════════════════════════════
# HELPERS CONSULTING STYLE
# ══════════════════════════════════════════════════════════════
def add_footer(fig, text='Satorea CRM — Briefing Commercial Intelligence'):
    """Footer discret en bas à droite"""
    fig.text(0.98, 0.01, text, ha='right', va='bottom',
             fontsize=6, color=Theme.TEXT_XLIGHT, style='italic')

def add_insight_title(ax, title, subtitle=None, y=1.08):
    """Titre = insight (pas description) + sous-titre données"""
    ax.set_title(title, fontsize=12, fontweight='bold', color=Theme.ACCENT,
                 pad=15, loc='left', wrap=True)
    if subtitle:
        ax.text(0, y - 0.06, subtitle, transform=ax.transAxes,
                fontsize=8, color=Theme.TEXT_LIGHT, va='top')

def add_annotation_box(ax, text, xy, color=Theme.BRAND):
    """Annotation style McKinsey — boîte avec flèche"""
    ax.annotate(text, xy=xy, fontsize=8, fontweight='bold', color=color,
                bbox=dict(boxstyle='round,pad=0.4', facecolor=color + '10',
                          edgecolor=color, linewidth=1),
                ha='center')

def score_color(v):
    if v >= 60: return Theme.GREEN
    if v >= 30: return Theme.AMBER
    return Theme.RED

# ══════════════════════════════════════════════════════════════
# CHART 1 — RADAR 5 AXES (style consulting)
# ══════════════════════════════════════════════════════════════
def chart_radar(data, insights, outdir):
    scores = data['scores']
    vals = [scores['reputation'], scores['presence'], scores['activity'],
            scores['financial'], scores['neighborhood']]
    avg = data.get('avg_scores', [50, 50, 50, 50, 50])

    fig, ax = plt.subplots(figsize=(8, 7), subplot_kw=dict(polar=True))

    N = 5
    angles = [n / float(N) * 2 * math.pi for n in range(N)]
    angles += angles[:1]
    vals_plot = vals + vals[:1]
    avg_plot = avg + avg[:1]

    ax.set_theta_offset(math.pi / 2)
    ax.set_theta_direction(-1)
    ax.set_rmax(100)
    ax.set_rticks([20, 40, 60, 80, 100])
    ax.set_yticklabels(['', '40', '60', '80', ''], fontsize=7, color=Theme.TEXT_XLIGHT)
    ax.set_rlabel_position(30)
    ax.spines['polar'].set_visible(False)
    ax.grid(color=Theme.BORDER_SOFT, linewidth=0.8)

    # Labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(Theme.DIM_LABELS, fontsize=11, fontweight='bold', color=Theme.ACCENT)

    # Moyenne secteur
    ax.plot(angles, avg_plot, '--', color=Theme.RED, linewidth=1.2, alpha=0.35)
    ax.fill(angles, avg_plot, color=Theme.RED, alpha=0.02)

    # Prospect
    ax.plot(angles, vals_plot, color=Theme.BRAND, linewidth=2.5)
    ax.fill(angles, vals_plot, color=Theme.BRAND, alpha=0.1)

    # Points + valeurs
    for i, (angle, val) in enumerate(zip(angles[:-1], vals)):
        ax.plot(angle, val, 'o', color=Theme.DIM_COLORS[i], markersize=9, zorder=5,
                markeredgecolor=Theme.BG, markeredgewidth=2)
        offset = 12 if val > avg[i] else -15
        ax.annotate(f'{val}', (angle, val), textcoords="offset points",
                    xytext=(10, offset), fontsize=11, fontweight='bold',
                    color=Theme.DIM_COLORS[i])

    # Légende
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], color=Theme.BRAND, linewidth=2.5, label=data.get('prospect_name', 'Prospect')),
        Line2D([0], [0], color=Theme.RED, linewidth=1.2, linestyle='--', alpha=0.5, label='Moyenne secteur'),
    ]
    ax.legend(handles=legend_elements, loc='lower right', bbox_to_anchor=(1.2, -0.08),
              fontsize=9, frameon=True, facecolor=Theme.BG, edgecolor=Theme.BORDER)

    # Titre insight
    ins = insights.get('radar', {})
    fig.suptitle(ins.get('title', f'Score multi-axes — {data.get("prospect_name", "Prospect")}'),
                 fontsize=13, fontweight='bold', color=Theme.ACCENT, x=0.5, y=0.98)

    # Message clé en bas
    key_msg = ins.get('key_insight', '')
    if key_msg:
        fig.text(0.5, 0.02, key_msg, ha='center', va='bottom',
                 fontsize=9, color=Theme.BRAND, fontweight='bold', style='italic',
                 bbox=dict(boxstyle='round,pad=0.5', facecolor=Theme.BRAND + '08',
                           edgecolor=Theme.BRAND + '30', linewidth=0.5))

    add_footer(fig)
    plt.tight_layout(rect=[0, 0.06, 1, 0.95])
    plt.savefig(outdir / 'radar-score.png', dpi=200, bbox_inches='tight', facecolor=Theme.BG)
    plt.close()


# ══════════════════════════════════════════════════════════════
# CHART 2 — BARRES HORIZONTALES (dimensions détaillées)
# ══════════════════════════════════════════════════════════════
def chart_bars(data, insights, outdir):
    scores = data['scores']
    vals = [scores['reputation'], scores['presence'], scores['activity'],
            scores['financial'], scores['neighborhood']]

    fig, ax = plt.subplots(figsize=(8, 4))

    y_pos = np.arange(len(Theme.DIM_LABELS))
    bars = ax.barh(y_pos, vals, height=0.55, color=Theme.DIM_COLORS, zorder=3)

    # Moyenne
    ax.axvline(x=50, color=Theme.RED, linewidth=1, linestyle='--', alpha=0.3, zorder=2)
    ax.text(51, len(vals) - 0.3, 'Moy.', fontsize=7, color=Theme.RED, alpha=0.5)

    # Zones
    ax.axvspan(0, 30, color=Theme.RED, alpha=0.02, zorder=1)
    ax.axvspan(60, 100, color=Theme.GREEN, alpha=0.02, zorder=1)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(Theme.DIM_LABELS, fontsize=11, fontweight='bold', color=Theme.ACCENT)
    ax.set_xlim(0, 108)

    for bar, val, color in zip(bars, vals, Theme.DIM_COLORS):
        # Valeur
        ax.text(val + 2, bar.get_y() + bar.get_height()/2, f'{val}',
                va='center', fontsize=12, fontweight='bold', color=color)
        # Indicateur
        indicator = '+' if val >= 50 else '-'
        ind_color = Theme.GREEN_DARK if val >= 50 else Theme.RED
        ax.text(val + 10, bar.get_y() + bar.get_height()/2, indicator,
                va='center', fontsize=10, fontweight='bold', color=ind_color)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.tick_params(left=False)
    ax.grid(axis='x', color=Theme.BORDER_SOFT, linewidth=0.5, zorder=1)

    ins = insights.get('bars', {})
    ax.set_title(ins.get('title', 'Detail par dimension'),
                 fontsize=13, fontweight='bold', color=Theme.ACCENT, loc='left', pad=12)

    key_msg = ins.get('key_insight', '')
    if key_msg:
        fig.text(0.02, -0.02, key_msg, ha='left', fontsize=8, color=Theme.BRAND,
                 fontweight='bold', style='italic')

    add_footer(fig)
    plt.tight_layout()
    plt.savefig(outdir / 'bar-dimensions.png', dpi=200, bbox_inches='tight', facecolor=Theme.BG)
    plt.close()


# ══════════════════════════════════════════════════════════════
# CHART 3 — DONUT SCORE GLOBAL
# ══════════════════════════════════════════════════════════════
def chart_donut(data, insights, outdir):
    score = data['scores']['global']
    color = score_color(score)
    classif = data.get('classification', 'TIEDE')

    fig, ax = plt.subplots(figsize=(4, 4.5))
    sizes = [score, 100 - score]
    colors = [color, Theme.BORDER_SOFT]

    wedges, _ = ax.pie(sizes, colors=colors, startangle=90,
                        wedgeprops=dict(width=0.25, edgecolor=Theme.BG, linewidth=3))

    ax.text(0, 0.08, f'{score}', ha='center', va='center',
            fontsize=42, fontweight='bold', color=color)
    ax.text(0, -0.15, '/100', ha='center', va='center',
            fontsize=13, color=Theme.TEXT_LIGHT)
    ax.text(0, -0.35, classif, ha='center', va='center',
            fontsize=11, fontweight='bold', color=color,
            bbox=dict(boxstyle='round,pad=0.3', facecolor=color + '15', edgecolor=color + '40'))

    ins = insights.get('donut', {})
    ax.set_title(ins.get('title', 'Score Global'),
                 fontsize=12, fontweight='bold', color=Theme.ACCENT, pad=10)

    add_footer(fig)
    plt.tight_layout()
    plt.savefig(outdir / 'donut-score.png', dpi=200, bbox_inches='tight', facecolor=Theme.BG)
    plt.close()


# ══════════════════════════════════════════════════════════════
# CHART 4 — DISTRIBUTION AVIS
# ══════════════════════════════════════════════════════════════
def chart_avis(data, insights, outdir):
    avis = data.get('avis')
    if not avis or not avis.get('distribution'):
        return

    dist = avis['distribution']
    stars = [d['stars'] for d in dist]
    pcts = [d['pct'] for d in dist]
    counts = [d['count'] for d in dist]
    color_map = {5: Theme.GREEN, 4: '#22C55E', 3: Theme.AMBER, 2: '#F97316', 1: Theme.RED}
    colors = [color_map.get(s, Theme.TEXT_LIGHT) for s in stars]

    fig, ax = plt.subplots(figsize=(8, 3.5))
    y_pos = np.arange(len(stars))
    bars = ax.barh(y_pos, pcts, height=0.6, color=colors, zorder=3)

    ax.set_yticks(y_pos)
    ax.set_yticklabels([f'{s} star{"s" if s > 1 else ""}' for s in stars],
                       fontsize=10, fontweight='bold', color=Theme.TEXT_MED)
    ax.set_xlim(0, 100)

    for bar, pct, count in zip(bars, pcts, counts):
        ax.text(pct + 2, bar.get_y() + bar.get_height()/2,
                f'{pct}%  ({count})', va='center', fontsize=9, color=Theme.TEXT_MED)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.tick_params(left=False)
    ax.grid(axis='x', color=Theme.BORDER_SOFT, linewidth=0.5, zorder=1)

    # Note moyenne annotation
    avg = avis.get('moyenne', 0)
    ax.annotate(f'{avg}/5', xy=(75, len(stars) - 0.8),
                fontsize=24, fontweight='bold', color=Theme.BRAND,
                bbox=dict(boxstyle='round,pad=0.4', facecolor=Theme.BRAND + '08',
                          edgecolor=Theme.BRAND, linewidth=1.5))

    ins = insights.get('avis', {})
    ax.set_title(ins.get('title', f'{avis.get("total", 0)} avis a {avg}/5'),
                 fontsize=13, fontweight='bold', color=Theme.ACCENT, loc='left', pad=12)

    key_msg = ins.get('key_insight', '')
    if key_msg:
        fig.text(0.02, -0.02, key_msg, ha='left', fontsize=8, color=Theme.GREEN_DARK,
                 fontweight='bold', style='italic')

    add_footer(fig)
    plt.tight_layout()
    plt.savefig(outdir / 'avis-distribution.png', dpi=200, bbox_inches='tight', facecolor=Theme.BG)
    plt.close()


# ══════════════════════════════════════════════════════════════
# CHART 5 — ROI PROJECTION 12 MOIS
# ══════════════════════════════════════════════════════════════
def chart_roi(data, insights, outdir):
    formation_prix = data.get('formation_prix', 1400)
    seance_prix = data.get('seance_prix', 200)
    clientes_sem = data.get('clientes_semaine', 3)

    months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12']

    # Courbe réaliste : montée progressive
    ramp = [0.4, 0.6, 0.8, 0.9, 1.0, 1.0, 1.1, 1.1, 1.0, 1.1, 1.2, 1.2]
    ca_mensuel = [round(seance_prix * clientes_sem * 4 * r) for r in ramp]
    ca_cumule = np.cumsum(ca_mensuel)

    fig, ax1 = plt.subplots(figsize=(8, 4))

    x = np.arange(len(months))

    # Barres CA mensuel
    bars = ax1.bar(x, ca_mensuel, width=0.6, color=Theme.BRAND, zorder=3, alpha=0.8, label='CA mensuel microblading')

    # Ligne cumul
    ax2 = ax1.twinx()
    ax2.plot(x, ca_cumule, '-o', color=Theme.GREEN, linewidth=2.5, markersize=5,
             zorder=4, label='CA cumule')
    ax2.set_ylabel('Cumule (EUR)', fontsize=9, color=Theme.GREEN)
    ax2.tick_params(axis='y', colors=Theme.GREEN)
    ax2.spines['right'].set_color(Theme.GREEN)

    # Zone remboursement
    breakeven_month = next((i for i, c in enumerate(ca_cumule) if c >= formation_prix), 2)
    ax1.axhline(y=formation_prix / 4, color=Theme.AMBER, linewidth=1, linestyle=':', alpha=0.5)
    ax1.annotate(f'Formation remboursee\nen {breakeven_month + 1} mois',
                 xy=(breakeven_month, ca_mensuel[breakeven_month]),
                 xytext=(breakeven_month + 2, ca_mensuel[breakeven_month] + 500),
                 fontsize=8, fontweight='bold', color=Theme.GREEN_DARK,
                 arrowprops=dict(arrowstyle='->', color=Theme.GREEN_DARK, lw=1.5),
                 bbox=dict(boxstyle='round,pad=0.3', facecolor=Theme.GREEN_BG,
                           edgecolor=Theme.GREEN, linewidth=1))

    ax1.set_xticks(x)
    ax1.set_xticklabels(months, fontsize=9)
    ax1.set_ylabel('CA mensuel (EUR)', fontsize=9, color=Theme.TEXT_LIGHT)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.grid(axis='y', color=Theme.BORDER_SOFT, linewidth=0.5, zorder=1)

    # Total annuel
    total = sum(ca_mensuel)
    fig.text(0.98, 0.92, f'+{total:,} EUR/an', ha='right',
             fontsize=16, fontweight='bold', color=Theme.GREEN,
             bbox=dict(boxstyle='round,pad=0.4', facecolor=Theme.GREEN_BG,
                       edgecolor=Theme.GREEN, linewidth=1.5))

    # Légendes combinées
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left',
               fontsize=8, frameon=True, facecolor=Theme.BG, edgecolor=Theme.BORDER)

    ins = insights.get('roi', {})
    ax1.set_title(ins.get('title', f'Projection ROI — +{total:,} EUR/an'),
                  fontsize=13, fontweight='bold', color=Theme.ACCENT, loc='left', pad=12)

    add_footer(fig)
    plt.tight_layout()
    plt.savefig(outdir / 'roi-projection.png', dpi=200, bbox_inches='tight', facecolor=Theme.BG)
    plt.close()


# ══════════════════════════════════════════════════════════════
# CHART 6 — QUARTIER INDICATEURS
# ══════════════════════════════════════════════════════════════
def chart_quartier(data, insights, outdir):
    q = data.get('quartier')
    if not q:
        return

    fig, axes = plt.subplots(1, 5, figsize=(10, 3))

    items = [
        ('Metros', q.get('metros', 0), Theme.BRAND),
        ('Restaurants', q.get('restaurants', 0), Theme.INDIGO),
        ('Salons beaute', q.get('concurrentsBeaute', 0), Theme.VIOLET),
        ('Pharmacies', q.get('pharmacies', 0), Theme.TEAL),
        ('Trafic pieton', q.get('footTrafficScore', 0), Theme.GREEN),
    ]

    for ax, (label, val, color) in zip(axes, items):
        ax.set_xlim(-1, 1)
        ax.set_ylim(-1, 1.3)
        ax.set_aspect('equal')
        ax.axis('off')

        # Cercle
        circle = plt.Circle((0, 0.15), 0.6, facecolor=color + '12',
                             edgecolor=color, linewidth=2.5)
        ax.add_patch(circle)

        # Valeur
        display = f'{val}/100' if label == 'Trafic pieton' else str(val)
        ax.text(0, 0.22, display, ha='center', va='center',
                fontsize=18 if label != 'Trafic pieton' else 13,
                fontweight='bold', color=color)

        # Label
        ax.text(0, -0.65, label, ha='center', va='center',
                fontsize=8, fontweight='bold', color=Theme.ACCENT)

    ins = insights.get('quartier', {})
    fig.suptitle(ins.get('title', 'Environnement du quartier'),
                 fontsize=13, fontweight='bold', color=Theme.ACCENT, y=1.02)

    key_msg = ins.get('key_insight', '')
    if key_msg:
        fig.text(0.5, -0.05, key_msg, ha='center', fontsize=8,
                 color=Theme.BRAND, fontweight='bold', style='italic')

    add_footer(fig)
    plt.tight_layout()
    plt.savefig(outdir / 'quartier-indicateurs.png', dpi=200, bbox_inches='tight', facecolor=Theme.BG)
    plt.close()


# ══════════════════════════════════════════════════════════════
# PIPELINE — Détermine quels graphiques générer
# ══════════════════════════════════════════════════════════════
def determine_charts(data):
    """Retourne la liste des graphiques à générer basé sur les données disponibles"""
    charts = []

    # Toujours : score + ROI (minimum 2)
    if data.get('scores'):
        charts.append('donut')
        charts.append('radar')
        charts.append('bars')

    charts.append('roi')  # Toujours pertinent

    # Si avis disponibles
    if data.get('avis') and data['avis'].get('distribution'):
        charts.append('avis')

    # Si quartier disponible
    if data.get('quartier'):
        charts.append('quartier')

    return charts


def generate_all(data, insights, outdir):
    """Génère tous les graphiques applicables"""
    Theme.setup()
    outdir = Path(outdir)
    outdir.mkdir(exist_ok=True)

    charts = determine_charts(data)
    generated = []

    chart_funcs = {
        'radar': chart_radar,
        'bars': chart_bars,
        'donut': chart_donut,
        'avis': chart_avis,
        'roi': chart_roi,
        'quartier': chart_quartier,
    }

    for chart_id in charts:
        func = chart_funcs.get(chart_id)
        if func:
            try:
                func(data, insights, outdir)
                generated.append(chart_id)
                print(f'  + {chart_id}.png')
            except Exception as e:
                print(f'  ! {chart_id} ERREUR: {e}')

    return generated


# ══════════════════════════════════════════════════════════════
# DONNEES TEST — ESTHELIA
# ══════════════════════════════════════════════════════════════
TEST_DATA = {
    'prospect_name': 'Esthelia — Beatrice Pignol',
    'classification': 'TIEDE',
    'scores': {
        'global': 64,
        'reputation': 78,
        'presence': 55,
        'activity': 35,
        'financial': 58,
        'neighborhood': 82,
    },
    'avg_scores': [50, 50, 50, 50, 50],
    'avis': {
        'total': 89,
        'moyenne': 4.8,
        'distribution': [
            {'stars': 5, 'count': 62, 'pct': 70},
            {'stars': 4, 'count': 18, 'pct': 20},
            {'stars': 3, 'count': 5, 'pct': 6},
            {'stars': 2, 'count': 2, 'pct': 2},
            {'stars': 1, 'count': 2, 'pct': 2},
        ],
    },
    'quartier': {
        'metros': 3,
        'restaurants': 60,
        'concurrentsBeaute': 12,
        'pharmacies': 8,
        'footTrafficScore': 82,
    },
    'formation_prix': 1400,
    'seance_prix': 225,
    'clientes_semaine': 3,
}

# Insights generés par Claude (simulés pour le test)
TEST_INSIGHTS = {
    'radar': {
        'title': 'Reputation solide (78) mais communication digitale en retard (35)',
        'key_insight': 'Le microblading genere du contenu Instagram naturellement — ca resout sa faiblesse #1',
    },
    'bars': {
        'title': 'Quartier ideal (82) et reputation prouvee (78) — deux atouts pour la vente',
        'key_insight': 'Prioriser l\'argument quartier : "Oberkampf = forte demande de microblading"',
    },
    'donut': {
        'title': 'Score 64/100 — prospect a fort potentiel de conversion',
    },
    'avis': {
        'title': '89 avis a 4.8 etoiles — dans le top 5% des instituts parisiens',
        'key_insight': 'Ses clientes l\'adorent. Elles seront les premieres a booker le microblading.',
    },
    'roi': {
        'title': '+27 000 EUR de CA annuel projete — formation remboursee en 3 semaines',
    },
    'quartier': {
        'title': 'Oberkampf : 3 metros, 60 restos, trafic pieton 82/100 — zone premium',
        'key_insight': '12 salons beaute concurrents mais AUCUN ne propose de dermopigmentation certifiee',
    },
}

# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            payload = json.load(f)
        data = payload.get('data', payload)
        insights = payload.get('insights', {})
    else:
        data = TEST_DATA
        insights = TEST_INSIGHTS

    print(f'Generation graphiques pour: {data.get("prospect_name", "Prospect")}')
    print(f'Scenario: {len(determine_charts(data))} graphiques a generer')
    print()

    generated = generate_all(data, insights, './charts')

    print(f'\nTermine ! {len(generated)} PNG generes dans ./charts/')
    print(f'Graphiques: {", ".join(generated)}')
