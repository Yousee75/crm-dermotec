"""
SATOREA — Generateur de graphiques premium pour briefing commercial
Genere des PNG haute qualite inserables dans Word/PDF

Usage: python generate-charts.py
Output: ./charts/*.png
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np
from pathlib import Path
import math

# ══════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════
BRAND = '#2EC6F3'
ACCENT = '#082545'
GREEN = '#10B981'
AMBER = '#F59E0B'
RED = '#EF4444'
INDIGO = '#6366F1'
VIOLET = '#8B5CF6'
TEAL = '#14B8A6'
TEXT = '#1E293B'
TEXT_MED = '#475569'
TEXT_LIGHT = '#94A3B8'
BG = '#FFFFFF'
CARD = '#F8FAFC'
GREEN_BG = '#ECFDF5'
AMBER_BG = '#FFFBEB'

DIM_COLORS = [GREEN, '#3B82F6', VIOLET, AMBER, TEAL]
DIM_LABELS = ['Reputation', 'Presence', 'Activite', 'Financier', 'Quartier']

# Font config
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Segoe UI', 'Calibri', 'Arial', 'Helvetica']
plt.rcParams['axes.facecolor'] = BG
plt.rcParams['figure.facecolor'] = BG
plt.rcParams['text.color'] = TEXT

outdir = Path('charts')
outdir.mkdir(exist_ok=True)

# ══════════════════════════════════════════════════════════════
# DONNEES ESTHELIA
# ══════════════════════════════════════════════════════════════
scores = [78, 55, 35, 58, 82]  # Reputation, Presence, Activite, Financier, Quartier
avg_scores = [50, 50, 50, 50, 50]  # Moyenne secteur
global_score = round(78*0.30 + 55*0.25 + 35*0.20 + 58*0.15 + 82*0.10)

# Avis distribution
avis_dist = [
    (5, 62, 70),
    (4, 18, 20),
    (3, 5, 6),
    (2, 2, 2),
    (1, 2, 2),
]

# ══════════════════════════════════════════════════════════════
# 1. RADAR CHART — Score 5 axes vs moyenne
# ══════════════════════════════════════════════════════════════
def radar_chart():
    fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
    fig.patch.set_facecolor(BG)

    N = 5
    angles = [n / float(N) * 2 * math.pi for n in range(N)]
    angles += angles[:1]

    vals = scores + scores[:1]
    avg = avg_scores + avg_scores[:1]

    ax.set_theta_offset(math.pi / 2)
    ax.set_theta_direction(-1)

    # Grid
    ax.set_rmax(100)
    ax.set_rticks([20, 40, 60, 80, 100])
    ax.set_yticklabels(['20', '40', '60', '80', '100'], fontsize=7, color=TEXT_LIGHT)
    ax.set_rlabel_position(30)
    ax.spines['polar'].set_visible(False)
    ax.grid(color='#E2E8F0', linewidth=0.5)

    # Labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(DIM_LABELS, fontsize=11, fontweight='bold', color=ACCENT)

    # Plot moyenne secteur (reference)
    ax.plot(angles, avg, '--', color=RED, linewidth=1.5, alpha=0.4, label='Moyenne secteur')
    ax.fill(angles, avg, color=RED, alpha=0.03)

    # Plot prospect
    ax.plot(angles, vals, color=BRAND, linewidth=2.5, label='Esthelia')
    ax.fill(angles, vals, color=BRAND, alpha=0.12)

    # Points avec couleurs par dimension
    for i, (angle, val) in enumerate(zip(angles[:-1], scores)):
        ax.plot(angle, val, 'o', color=DIM_COLORS[i], markersize=8, zorder=5)
        ax.annotate(f'{val}', (angle, val), textcoords="offset points",
                    xytext=(8, 5), fontsize=10, fontweight='bold', color=DIM_COLORS[i])

    # Legend
    ax.legend(loc='lower right', bbox_to_anchor=(1.15, -0.05), fontsize=9,
              frameon=True, facecolor=BG, edgecolor='#E2E8F0')

    plt.title(f'Profil Prospect — Score Global {global_score}/100',
              fontsize=14, fontweight='bold', color=ACCENT, pad=20)

    plt.tight_layout()
    plt.savefig(outdir / 'radar-score.png', dpi=200, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  radar-score.png')


# ══════════════════════════════════════════════════════════════
# 2. BAR CHART HORIZONTAL — Scores par dimension
# ══════════════════════════════════════════════════════════════
def bar_chart():
    fig, ax = plt.subplots(figsize=(7, 3.5))
    fig.patch.set_facecolor(BG)

    y_pos = np.arange(len(DIM_LABELS))
    bars = ax.barh(y_pos, scores, height=0.55, color=DIM_COLORS, zorder=3, edgecolor='none')

    # Moyenne line
    ax.axvline(x=50, color=RED, linewidth=1, linestyle='--', alpha=0.4, zorder=2, label='Moyenne secteur')

    # Labels
    ax.set_yticks(y_pos)
    ax.set_yticklabels(DIM_LABELS, fontsize=11, fontweight='bold', color=ACCENT)
    ax.set_xlim(0, 105)
    ax.set_xlabel('Score /100', fontsize=9, color=TEXT_LIGHT)

    # Value labels on bars
    for bar, val, color in zip(bars, scores, DIM_COLORS):
        ax.text(val + 2, bar.get_y() + bar.get_height()/2, f'{val}',
                va='center', fontsize=11, fontweight='bold', color=color)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color('#E2E8F0')
    ax.tick_params(left=False, bottom=True, colors=TEXT_LIGHT)
    ax.grid(axis='x', color='#F1F5F9', linewidth=0.5, zorder=1)
    ax.legend(fontsize=8, loc='lower right', frameon=False)

    plt.title('Detail par Dimension', fontsize=13, fontweight='bold', color=ACCENT, pad=10)
    plt.tight_layout()
    plt.savefig(outdir / 'bar-dimensions.png', dpi=200, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  bar-dimensions.png')


# ══════════════════════════════════════════════════════════════
# 3. DONUT CHART — Score global
# ══════════════════════════════════════════════════════════════
def donut_chart():
    fig, ax = plt.subplots(figsize=(3.5, 3.5))
    fig.patch.set_facecolor(BG)

    score_color = GREEN if global_score >= 60 else AMBER if global_score >= 30 else RED

    sizes = [global_score, 100 - global_score]
    colors = [score_color, '#F1F5F9']

    wedges, _ = ax.pie(sizes, colors=colors, startangle=90,
                        wedgeprops=dict(width=0.28, edgecolor=BG, linewidth=2))

    # Centre text
    ax.text(0, 0.05, f'{global_score}', ha='center', va='center',
            fontsize=36, fontweight='bold', color=score_color)
    ax.text(0, -0.2, '/100', ha='center', va='center',
            fontsize=12, color=TEXT_LIGHT)

    plt.title('Score Global', fontsize=11, fontweight='bold', color=ACCENT, pad=5)
    plt.tight_layout()
    plt.savefig(outdir / 'donut-score.png', dpi=200, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  donut-score.png')


# ══════════════════════════════════════════════════════════════
# 4. AVIS DISTRIBUTION — Barres horizontales etoiles
# ══════════════════════════════════════════════════════════════
def avis_chart():
    fig, ax = plt.subplots(figsize=(6, 3))
    fig.patch.set_facecolor(BG)

    stars = [d[0] for d in avis_dist]
    counts = [d[1] for d in avis_dist]
    pcts = [d[2] for d in avis_dist]
    colors_map = {5: GREEN, 4: '#22C55E', 3: AMBER, 2: '#F97316', 1: RED}
    colors = [colors_map[s] for s in stars]

    y_pos = np.arange(len(stars))
    bars = ax.barh(y_pos, pcts, height=0.6, color=colors, zorder=3, edgecolor='none')

    ax.set_yticks(y_pos)
    ax.set_yticklabels([f'{"★" * s}' for s in stars], fontsize=12, color=AMBER)
    ax.set_xlim(0, 100)
    ax.set_xlabel('% des avis', fontsize=9, color=TEXT_LIGHT)

    for bar, pct, count in zip(bars, pcts, counts):
        ax.text(pct + 2, bar.get_y() + bar.get_height()/2,
                f'{pct}%  ({count} avis)', va='center', fontsize=9, color=TEXT_MED)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color('#E2E8F0')
    ax.tick_params(left=False)
    ax.grid(axis='x', color='#F1F5F9', linewidth=0.5, zorder=1)

    # Note moyenne en annotation
    avg_rating = 4.8
    ax.annotate(f'Note moyenne : {avg_rating}/5', xy=(70, 4.2),
                fontsize=12, fontweight='bold', color=BRAND,
                bbox=dict(boxstyle='round,pad=0.3', facecolor='#F0F9FF', edgecolor=BRAND, linewidth=1))

    plt.title('Distribution des Avis Google', fontsize=13, fontweight='bold', color=ACCENT, pad=10)
    plt.tight_layout()
    plt.savefig(outdir / 'avis-distribution.png', dpi=200, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  avis-distribution.png')


# ══════════════════════════════════════════════════════════════
# 5. QUARTIER — Indicateurs environnement
# ══════════════════════════════════════════════════════════════
def quartier_chart():
    fig, axes = plt.subplots(1, 5, figsize=(10, 2.5))
    fig.patch.set_facecolor(BG)

    data = [
        ('Metros', 3, '🚇', BRAND),
        ('Restos', 60, '🍽', INDIGO),
        ('Beaute', 12, '💅', VIOLET),
        ('Pharma', 8, '💊', TEAL),
        ('Trafic', 82, '🚶', GREEN),
    ]

    for ax, (label, val, emoji, color) in zip(axes, data):
        ax.set_xlim(-1, 1)
        ax.set_ylim(-1, 1.2)
        ax.set_aspect('equal')
        ax.axis('off')

        # Circle background
        circle = plt.Circle((0, 0.2), 0.65, facecolor=color + '15', edgecolor=color, linewidth=2)
        ax.add_patch(circle)

        # Value
        ax.text(0, 0.3, str(val), ha='center', va='center',
                fontsize=22, fontweight='bold', color=color)

        # Label
        ax.text(0, -0.65, label, ha='center', va='center',
                fontsize=9, fontweight='bold', color=ACCENT)

    plt.suptitle('Environnement du Quartier', fontsize=13, fontweight='bold', color=ACCENT, y=1.05)
    plt.tight_layout()
    plt.savefig(outdir / 'quartier-indicateurs.png', dpi=200, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  quartier-indicateurs.png')


# ══════════════════════════════════════════════════════════════
# 6. ROI PROJECTION — CA additionnel mensuel
# ══════════════════════════════════════════════════════════════
def roi_chart():
    fig, ax = plt.subplots(figsize=(7, 3.5))
    fig.patch.set_facecolor(BG)

    months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12']
    ca_base = [13000] * 12  # CA mensuel actuel ~13K
    ca_micro = [1200, 1800, 2400, 2400, 2800, 3000, 3000, 3200, 3000, 3200, 3400, 3600]  # Microblading
    ca_total = [b + m for b, m in zip(ca_base, ca_micro)]

    x = np.arange(len(months))
    width = 0.35

    bars1 = ax.bar(x - width/2, ca_base, width, label='CA actuel', color='#E2E8F0', zorder=3, edgecolor='none')
    bars2 = ax.bar(x + width/2, ca_micro, width, label='+ Microblading', color=BRAND, zorder=3, edgecolor='none')

    # Ligne CA total
    ax.plot(x, ca_total, '-o', color=GREEN, linewidth=2, markersize=4, label='CA total projete', zorder=4)

    # Zone de remboursement formation
    ax.axhspan(0, 1400, xmin=0, xmax=0.25, color=AMBER, alpha=0.05)
    ax.annotate('Formation\nremboursee', xy=(0.5, 700), fontsize=8, color=AMBER, ha='center', style='italic')

    ax.set_xticks(x)
    ax.set_xticklabels(months, fontsize=9, color=TEXT_MED)
    ax.set_ylabel('EUR/mois', fontsize=9, color=TEXT_LIGHT)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#E2E8F0')
    ax.spines['bottom'].set_color('#E2E8F0')
    ax.grid(axis='y', color='#F1F5F9', linewidth=0.5, zorder=1)
    ax.legend(fontsize=8, loc='upper left', frameon=True, facecolor=BG, edgecolor='#E2E8F0')

    # Total annuel annotation
    total_micro = sum(ca_micro)
    ax.annotate(f'+{total_micro:,} EUR/an\nde CA additionnel', xy=(10, ca_total[10]),
                xytext=(8, ca_total[10] + 1500),
                fontsize=10, fontweight='bold', color=GREEN,
                arrowprops=dict(arrowstyle='->', color=GREEN, lw=1.5),
                bbox=dict(boxstyle='round,pad=0.4', facecolor=GREEN_BG, edgecolor=GREEN))

    plt.title('Projection ROI — 12 mois', fontsize=13, fontweight='bold', color=ACCENT, pad=10)
    plt.tight_layout()
    plt.savefig(outdir / 'roi-projection.png', dpi=200, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  roi-projection.png')


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print('Generation des graphiques Satorea...')
    radar_chart()
    bar_chart()
    donut_chart()
    avis_chart()
    quartier_chart()
    roi_chart()
    print(f'\nTermine ! {len(list(outdir.glob("*.png")))} images dans ./charts/')
