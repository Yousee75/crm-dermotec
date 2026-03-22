"""
SATOREA — Graphiques FUTURISTES style cabinet de conseil
McKinsey / BCG / Bain level — infographiques, schemas explicatifs, gauges

Libs: matplotlib, plotly (export PNG via kaleido), pywaffle, squarify
Output: ./charts/*.png haute resolution
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Arc
import matplotlib.patheffects as pe
import numpy as np
from pathlib import Path
import math

# ══════════════════════════════════════════════════════
# CHARTE SATOREA
# ══════════════════════════════════════════════════════
BRAND = '#2EC6F3'
ACCENT = '#082545'
GREEN = '#10B981'
GREEN_D = '#059669'
AMBER = '#F59E0B'
AMBER_D = '#D97706'
RED = '#EF4444'
INDIGO = '#6366F1'
VIOLET = '#8B5CF6'
TEAL = '#14B8A6'
TXT = '#1E293B'
TXT2 = '#475569'
TXT3 = '#94A3B8'
TXT4 = '#CBD5E1'
BG = '#FFFFFF'
CARD = '#F8FAFC'
BRD = '#E2E8F0'

DIM_C = [GREEN, '#3B82F6', VIOLET, AMBER, TEAL]
DIM_L = ['Reputation', 'Presence', 'Activite', 'Financier', 'Quartier']

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Segoe UI', 'Calibri', 'Arial'],
    'figure.facecolor': BG, 'axes.facecolor': BG,
    'text.color': TXT,
})
out = Path('charts')
out.mkdir(exist_ok=True)

# Data Esthelia
SCORES = [78, 55, 35, 58, 82]
GLOBAL = 64
AVG = [50, 50, 50, 50, 50]

# ══════════════════════════════════════════════════════
# 1. GAUGE SPEEDOMETRE — Score global
# ══════════════════════════════════════════════════════
def gauge_score():
    fig, ax = plt.subplots(figsize=(5, 3.5))
    ax.set_xlim(-1.3, 1.3)
    ax.set_ylim(-0.3, 1.3)
    ax.set_aspect('equal')
    ax.axis('off')

    # Arc fond
    for i in range(180):
        angle = math.radians(i)
        r = 1.0
        x1, y1 = r * math.cos(math.pi - angle), r * math.sin(math.pi - angle)
        x2, y2 = (r - 0.15) * math.cos(math.pi - angle), (r - 0.15) * math.sin(math.pi - angle)

        # Couleur par zone
        if i < 54:  # 0-30%
            c = RED
        elif i < 108:  # 30-60%
            c = AMBER
        else:  # 60-100%
            c = GREEN

        alpha = 0.15
        ax.plot([x1, x2], [y1, y2], color=c, linewidth=3, alpha=alpha, solid_capstyle='round')

    # Arc rempli jusqu'au score
    score_angle = GLOBAL / 100 * 180
    for i in range(int(score_angle)):
        angle = math.radians(i)
        r = 1.0
        x1, y1 = r * math.cos(math.pi - angle), r * math.sin(math.pi - angle)
        x2, y2 = (r - 0.15) * math.cos(math.pi - angle), (r - 0.15) * math.sin(math.pi - angle)
        if i < 54: c = RED
        elif i < 108: c = AMBER
        else: c = GREEN
        ax.plot([x1, x2], [y1, y2], color=c, linewidth=3, solid_capstyle='round')

    # Aiguille
    needle_angle = math.radians(GLOBAL / 100 * 180)
    nx = 0.75 * math.cos(math.pi - needle_angle)
    ny = 0.75 * math.sin(math.pi - needle_angle)
    ax.annotate('', xy=(nx, ny), xytext=(0, 0),
                arrowprops=dict(arrowstyle='->', color=ACCENT, lw=2.5))
    ax.plot(0, 0, 'o', color=ACCENT, markersize=8, zorder=5)

    # Score central
    sc = GREEN if GLOBAL >= 60 else AMBER if GLOBAL >= 30 else RED
    ax.text(0, 0.35, str(GLOBAL), ha='center', va='center',
            fontsize=38, fontweight='bold', color=sc)
    ax.text(0, 0.15, '/100', ha='center', fontsize=12, color=TXT3)

    # Labels zones
    ax.text(-1.15, -0.15, 'FROID', fontsize=7, color=RED, ha='center', fontweight='bold')
    ax.text(0, 1.12, 'TIEDE', fontsize=7, color=AMBER, ha='center', fontweight='bold')
    ax.text(1.15, -0.15, 'CHAUD', fontsize=7, color=GREEN, ha='center', fontweight='bold')

    # Classification
    ax.text(0, -0.2, 'TIEDE — Fort potentiel',
            ha='center', fontsize=10, fontweight='bold', color=AMBER,
            bbox=dict(boxstyle='round,pad=0.4', facecolor=AMBER + '15', edgecolor=AMBER, lw=1))

    fig.suptitle('Score Prospect Global', fontsize=13, fontweight='bold', color=ACCENT, y=0.98)
    plt.tight_layout()
    plt.savefig(out / '01-gauge-score.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  01-gauge-score.png')


# ══════════════════════════════════════════════════════
# 2. RADAR PREMIUM — Score 5 axes comparatif
# ══════════════════════════════════════════════════════
def radar_premium():
    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    N = 5
    angles = [n / float(N) * 2 * math.pi for n in range(N)]
    angles += angles[:1]
    vals = SCORES + SCORES[:1]
    avg = AVG + AVG[:1]

    ax.set_theta_offset(math.pi / 2)
    ax.set_theta_direction(-1)
    ax.set_rmax(100)
    ax.set_rticks([25, 50, 75, 100])
    ax.set_yticklabels(['25', '50', '75', '100'], fontsize=7, color=TXT4)
    ax.spines['polar'].set_visible(False)
    ax.grid(color=BRD, linewidth=0.6)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(DIM_L, fontsize=12, fontweight='bold', color=ACCENT)

    # Zone moyenne
    ax.fill(angles, avg, color=RED, alpha=0.04)
    ax.plot(angles, avg, '--', color=RED, linewidth=1.5, alpha=0.3, label='Moyenne secteur')

    # Zone prospect — gradient effect via multiple fills
    for alpha_mult in [0.03, 0.06, 0.10]:
        scaled = [v * (1 - alpha_mult * 3) for v in vals]
        ax.fill(angles, scaled, color=BRAND, alpha=alpha_mult)
    ax.plot(angles, vals, color=BRAND, linewidth=3, label='Esthelia')

    # Points + annotations
    insights = [
        'Top 5%\nParis', 'Site OK\nPas Insta', 'Faible\n= opportunite', 'CA 156K\nMarge 7%', 'Oberkampf\nIdeal'
    ]
    for i, (angle, val) in enumerate(zip(angles[:-1], SCORES)):
        ax.plot(angle, val, 'o', color=DIM_C[i], markersize=12, zorder=5,
                markeredgecolor=BG, markeredgewidth=2.5)
        ax.text(angle, val, f' {val}', fontsize=11, fontweight='bold', color=DIM_C[i],
                va='center', path_effects=[pe.withStroke(linewidth=3, foreground=BG)])
        # Mini insight
        r_text = min(val + 18, 105)
        ax.text(angle, r_text, insights[i], fontsize=6.5, color=TXT2,
                ha='center', va='center', style='italic',
                bbox=dict(boxstyle='round,pad=0.2', facecolor=BG, edgecolor=BRD, lw=0.5, alpha=0.9))

    ax.legend(loc='lower right', bbox_to_anchor=(1.2, -0.05), fontsize=9,
              frameon=True, facecolor=BG, edgecolor=BRD)

    fig.suptitle('Reputation solide (78) mais communication digitale en retard (35)',
                 fontsize=12, fontweight='bold', color=ACCENT, y=0.99)
    fig.text(0.5, 0.01, 'Le microblading genere du contenu Instagram naturellement — resout la faiblesse #1',
             ha='center', fontsize=9, color=BRAND, fontweight='bold', style='italic')

    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out / '02-radar-premium.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  02-radar-premium.png')


# ══════════════════════════════════════════════════════
# 3. FUNNEL CONVERSION — Pipeline prospect
# ══════════════════════════════════════════════════════
def funnel_conversion():
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')

    stages = [
        ('Premier contact', '100%', BRAND, 4.5),
        ('RDV qualifie', '60%', INDIGO, 3.6),
        ('Proposition envoyee', '40%', VIOLET, 2.8),
        ('Dossier OPCO', '30%', AMBER, 2.2),
        ('Inscription', '20%', GREEN, 1.6),
    ]

    for i, (label, pct, color, width) in enumerate(stages):
        y = 4.2 - i * 0.85
        x_center = 5
        # Trapeze
        x1 = x_center - width / 2
        x2 = x_center + width / 2
        next_w = stages[i + 1][3] if i < len(stages) - 1 else width * 0.7
        x3 = x_center + next_w / 2
        x4 = x_center - next_w / 2

        trap = plt.Polygon(
            [(x1, y + 0.6), (x2, y + 0.6), (x3, y - 0.05), (x4, y - 0.05)],
            facecolor=color + '20', edgecolor=color, linewidth=1.5, zorder=3
        )
        ax.add_patch(trap)

        ax.text(x_center, y + 0.28, label, ha='center', va='center',
                fontsize=10, fontweight='bold', color=color, zorder=4)
        ax.text(x_center + width / 2 + 0.3, y + 0.28, pct,
                ha='left', fontsize=10, fontweight='bold', color=color, zorder=4)

    # Flèche
    ax.annotate('', xy=(8.5, 0.8), xytext=(8.5, 4.5),
                arrowprops=dict(arrowstyle='->', color=GREEN, lw=2))
    ax.text(8.8, 2.5, 'Taux\nconversion\nmoyen', fontsize=7, color=TXT3, ha='left', va='center')

    fig.suptitle('Funnel de conversion type — formation esthetique',
                 fontsize=13, fontweight='bold', color=ACCENT, y=0.98)
    fig.text(0.5, 0.01, 'Objectif Esthelia : passer du premier contact au dossier OPCO en 7 jours',
             ha='center', fontsize=9, color=BRAND, fontweight='bold', style='italic')

    plt.tight_layout()
    plt.savefig(out / '03-funnel-conversion.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  03-funnel-conversion.png')


# ══════════════════════════════════════════════════════
# 4. SCHEMA EXPLICATIF — Parcours prospect
# ══════════════════════════════════════════════════════
def schema_parcours():
    fig, ax = plt.subplots(figsize=(9, 3))
    ax.set_xlim(-0.5, 10.5)
    ax.set_ylim(-1, 2.5)
    ax.axis('off')

    steps = [
        ('Appel\ntel', BRAND, 'J0'),
        ('RDV\nsalon', INDIGO, 'J+3'),
        ('Demo\n+ ROI', VIOLET, 'J+7'),
        ('Dossier\nOPCO', AMBER, 'J+10'),
        ('Formation\n2 jours', GREEN, 'J+30'),
        ('1ere\ncliente', GREEN_D, 'J+35'),
    ]

    for i, (label, color, timing) in enumerate(steps):
        x = i * 2
        # Cercle
        circle = plt.Circle((x, 1), 0.55, facecolor=color + '15', edgecolor=color, linewidth=2.5, zorder=3)
        ax.add_patch(circle)
        # Numéro
        ax.text(x, 1.15, str(i + 1), ha='center', va='center',
                fontsize=14, fontweight='bold', color=color, zorder=4)
        # Label
        ax.text(x, 0.15, label, ha='center', va='top',
                fontsize=8, fontweight='bold', color=ACCENT, zorder=4)
        # Timing
        ax.text(x, 1.85, timing, ha='center', va='center',
                fontsize=8, color=TXT2,
                bbox=dict(boxstyle='round,pad=0.2', facecolor=CARD, edgecolor=BRD, lw=0.5))

        # Flèche vers le suivant
        if i < len(steps) - 1:
            ax.annotate('', xy=(x + 1.3, 1), xytext=(x + 0.65, 1),
                        arrowprops=dict(arrowstyle='->', color=TXT4, lw=1.5))

    fig.suptitle('Parcours prospect : du premier appel a la premiere cliente en 5 semaines',
                 fontsize=12, fontweight='bold', color=ACCENT, y=0.98)

    plt.tight_layout()
    plt.savefig(out / '04-schema-parcours.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  04-schema-parcours.png')


# ══════════════════════════════════════════════════════
# 5. ROI WATERFALL — Decomposition du gain
# ══════════════════════════════════════════════════════
def roi_waterfall():
    fig, ax = plt.subplots(figsize=(8, 4.5))

    categories = ['CA actuel\nmensuel', 'Microblading\n+2 400', 'Full Lips\n+1 800', 'CA total\nmensuel', 'CA total\nannuel']
    values = [13000, 2400, 1800, 17200, 206400]
    cumulative = [0, 13000, 15400, 0, 0]
    bar_bottoms = [0, 13000, 15400, 0, 0]
    colors = [TXT4, BRAND, VIOLET, GREEN, GREEN_D]
    is_total = [False, False, False, True, True]

    for i, (cat, val, bottom, color, total) in enumerate(zip(categories, values, bar_bottoms, colors, is_total)):
        if total:
            ax.bar(i, val, width=0.6, color=color + '30', edgecolor=color, linewidth=2, zorder=3)
        else:
            ax.bar(i, val, bottom=bottom, width=0.6, color=color + '80', edgecolor=color, linewidth=1.5, zorder=3)

        # Valeur
        y_text = (bottom + val) if not total else val
        ax.text(i, y_text + 2000, f'{val:,} EUR'.replace(',', ' '),
                ha='center', va='bottom', fontsize=10, fontweight='bold', color=color)

        # Lignes de connexion
        if i > 0 and i < 3:
            ax.plot([i - 0.35, i - 0.65], [bar_bottoms[i], bar_bottoms[i]],
                    '--', color=TXT4, linewidth=0.8, alpha=0.5)

    ax.set_xticks(range(len(categories)))
    ax.set_xticklabels(categories, fontsize=9, fontweight='bold', color=ACCENT)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color(BRD)
    ax.set_ylabel('EUR', fontsize=9, color=TXT3)
    ax.grid(axis='y', color=BRD, linewidth=0.3, zorder=1)

    # Annotation ROI
    ax.annotate('+32% de CA\nannuel', xy=(4, 206400), xytext=(4, 230000),
                fontsize=11, fontweight='bold', color=GREEN_D, ha='center',
                bbox=dict(boxstyle='round,pad=0.4', facecolor=GREEN + '15', edgecolor=GREEN, lw=1.5))

    fig.suptitle('Decomposition du gain : +4 200 EUR/mois de CA additionnel',
                 fontsize=13, fontweight='bold', color=ACCENT, y=0.98)
    fig.text(0.5, 0.01, 'Investissement : 0 EUR (OPCO) | ROI : formation remboursee en 3 semaines',
             ha='center', fontsize=9, color=GREEN_D, fontweight='bold', style='italic')

    plt.tight_layout(rect=[0, 0.04, 1, 0.95])
    plt.savefig(out / '05-roi-waterfall.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  05-roi-waterfall.png')


# ══════════════════════════════════════════════════════
# 6. AVIS SENTIMENT — Analyse visuelle
# ══════════════════════════════════════════════════════
def avis_sentiment():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), gridspec_kw={'width_ratios': [1.2, 1]})

    # LEFT: Distribution etoiles
    stars = [5, 4, 3, 2, 1]
    pcts = [70, 20, 6, 2, 2]
    counts = [62, 18, 5, 2, 2]
    cmap = {5: GREEN, 4: '#22C55E', 3: AMBER, 2: '#F97316', 1: RED}
    colors = [cmap[s] for s in stars]

    bars = ax1.barh(range(len(stars)), pcts, height=0.6, color=colors, zorder=3)
    ax1.set_yticks(range(len(stars)))
    ax1.set_yticklabels([f'{s} {"*" * s}' for s in stars], fontsize=10, fontweight='bold', color=TXT2)
    ax1.set_xlim(0, 100)
    for bar, pct, count in zip(bars, pcts, counts):
        ax1.text(pct + 2, bar.get_y() + bar.get_height()/2,
                 f'{pct}% ({count})', va='center', fontsize=9, color=TXT2)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.spines['left'].set_visible(False)
    ax1.tick_params(left=False)
    ax1.grid(axis='x', color=BRD, linewidth=0.3, zorder=1)

    # Note moyenne
    ax1.text(70, 4.3, '4.8', fontsize=36, fontweight='bold', color=BRAND, ha='center')
    ax1.text(85, 4.3, '/5', fontsize=14, color=TXT3, ha='left', va='center')

    ax1.set_title('Distribution des 89 avis Google', fontsize=11, fontweight='bold', color=ACCENT, loc='left')

    # RIGHT: Keywords cloud-like
    ax2.axis('off')
    pos_kw = ['Apaisant', 'Professionnel', 'Chaleureux', 'Qualite', 'Zen', 'Prix correct']
    neg_kw = ['Pas de microblading', 'Horaires']

    ax2.text(0.5, 0.95, 'Mots-cles positifs', ha='center', va='top',
             fontsize=10, fontweight='bold', color=GREEN_D, transform=ax2.transAxes)

    for i, kw in enumerate(pos_kw):
        size = 14 - i * 1.2
        x = 0.15 + (i % 3) * 0.3
        y = 0.72 - (i // 3) * 0.18
        ax2.text(x, y, kw, ha='center', va='center', fontsize=size, color=GREEN,
                 fontweight='bold', alpha=0.7 + 0.05 * (6 - i), transform=ax2.transAxes,
                 bbox=dict(boxstyle='round,pad=0.2', facecolor=GREEN + '10', edgecolor='none'))

    ax2.text(0.5, 0.32, 'Points d\'attention', ha='center', va='top',
             fontsize=10, fontweight='bold', color=RED, transform=ax2.transAxes)

    for i, kw in enumerate(neg_kw):
        ax2.text(0.5, 0.18 - i * 0.14, kw, ha='center', va='center',
                 fontsize=11, color=RED, fontweight='bold', transform=ax2.transAxes,
                 bbox=dict(boxstyle='round,pad=0.3', facecolor=RED + '10', edgecolor=RED, lw=1))

    fig.suptitle('89% d\'avis positifs — reputation en or a exploiter pour la vente',
                 fontsize=12, fontweight='bold', color=ACCENT, y=0.99)
    fig.text(0.5, 0.01, 'Un avis 4 etoiles mentionne explicitement le manque de microblading = demande reelle',
             ha='center', fontsize=9, color=BRAND, fontweight='bold', style='italic')

    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out / '06-avis-sentiment.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  06-avis-sentiment.png')


# ══════════════════════════════════════════════════════
# 7. COMPARAISON AVANT/APRES — Impact formation
# ══════════════════════════════════════════════════════
def avant_apres():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4))

    # AVANT
    cats = ['CA mensuel', 'Panier moyen', 'Prestations\npremium', 'Contenu\nInstagram', 'Marge nette']
    avant = [13000, 55, 0, 0, 7.2]
    apres = [17200, 225, 3, 12, 18]
    units = ['EUR', 'EUR', '', 'posts/mois', '%']

    x = np.arange(len(cats))
    w = 0.35
    b1 = ax1.bar(x - w/2, avant, w, color=TXT4 + '60', label='Aujourd\'hui', zorder=3)
    b2 = ax1.bar(x + w/2, apres, w, color=BRAND + 'CC', label='Avec microblading', zorder=3)

    ax1.set_xticks(x)
    ax1.set_xticklabels(cats, fontsize=8, fontweight='bold', color=ACCENT)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.grid(axis='y', color=BRD, linewidth=0.3, zorder=1)
    ax1.legend(fontsize=8, loc='upper left', frameon=True, facecolor=BG, edgecolor=BRD)
    ax1.set_title('Impact mesurable de la formation', fontsize=11, fontweight='bold', color=ACCENT, loc='left')

    # Annotations delta
    for i, (a, b, u) in enumerate(zip(avant, apres, units)):
        if b > a:
            delta = f'+{b - a:,.0f}'.replace(',', ' ') if a > 100 else f'+{b - a:.0f}'
            ax1.text(i + w/2, b + max(avant) * 0.03, f'{delta}',
                     ha='center', fontsize=8, fontweight='bold', color=GREEN_D)

    # DROITE: KPIs impact
    ax2.axis('off')
    kpis = [
        ('+32%', 'CA annuel', GREEN),
        ('x4', 'Panier moyen', BRAND),
        ('3 sem.', 'Remboursement', AMBER),
        ('0 EUR', 'Cout formation\n(OPCO)', GREEN_D),
    ]
    for i, (val, label, color) in enumerate(kpis):
        row = i // 2
        col = i % 2
        x = 0.15 + col * 0.5
        y = 0.75 - row * 0.45

        ax2.text(x, y, val, ha='center', va='center', fontsize=26, fontweight='bold',
                 color=color, transform=ax2.transAxes)
        ax2.text(x, y - 0.12, label, ha='center', va='center', fontsize=9,
                 color=TXT2, transform=ax2.transAxes)

    ax2.text(0.5, 0.98, 'Chiffres cles', ha='center', va='top', fontsize=11,
             fontweight='bold', color=ACCENT, transform=ax2.transAxes)

    fig.suptitle('Avant / Apres formation : transformation du salon en 5 semaines',
                 fontsize=12, fontweight='bold', color=ACCENT, y=0.99)
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.savefig(out / '07-avant-apres.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  07-avant-apres.png')


# ══════════════════════════════════════════════════════
# 8. TIMELINE PLAN ACTION — Schema chronologique
# ══════════════════════════════════════════════════════
def timeline_plan():
    fig, ax = plt.subplots(figsize=(10, 3))
    ax.set_xlim(-0.5, 10)
    ax.set_ylim(-1.5, 2)
    ax.axis('off')

    # Ligne centrale
    ax.plot([-0.3, 9.5], [0.5, 0.5], color=BRD, linewidth=3, zorder=1, solid_capstyle='round')

    events = [
        (0, 'Appel\n10h-11h30', 'J0', BRAND, True),
        (1.5, 'SMS +\ncatalogue', 'J+1', INDIGO, False),
        (3, 'Email\navant/apres', 'J+1', VIOLET, False),
        (4.5, 'Rappel\n"photos ?"', 'J+3', AMBER, True),
        (6, 'Visite\nsalon', 'J+7', GREEN, True),
        (7.5, 'Temoignage\nvideo', 'J+14', GREEN_D, False),
        (9, 'Inscription\nformation', 'J+30', GREEN_D, True),
    ]

    for x, label, timing, color, is_key in events:
        # Point sur la timeline
        size = 14 if is_key else 10
        ax.plot(x, 0.5, 'o', color=color, markersize=size, zorder=4,
                markeredgecolor=BG, markeredgewidth=2)

        # Label en haut ou en bas (alterner)
        y_label = 1.4 if events.index((x, label, timing, color, is_key)) % 2 == 0 else -0.6
        ax.text(x, y_label, label, ha='center', va='center', fontsize=8, fontweight='bold',
                color=ACCENT, bbox=dict(boxstyle='round,pad=0.3', facecolor=color + '10',
                                         edgecolor=color, lw=1))

        # Ligne verticale
        y_start = 0.5 + (0.15 if y_label > 0 else -0.15)
        y_end = y_label + (-0.25 if y_label > 0 else 0.25)
        ax.plot([x, x], [y_start, y_end], color=color, linewidth=1, linestyle=':', alpha=0.5)

        # Timing
        ax.text(x, 0.15 if y_label > 0 else 0.85, timing, ha='center', fontsize=7,
                color=TXT3, fontweight='bold')

    fig.suptitle('Plan d\'action chronologique — du premier appel a l\'inscription',
                 fontsize=12, fontweight='bold', color=ACCENT, y=0.98)
    plt.tight_layout()
    plt.savefig(out / '08-timeline-plan.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  08-timeline-plan.png')


# ══════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════
if __name__ == '__main__':
    print('Generation graphiques FUTURISTES Satorea...\n')
    gauge_score()
    radar_premium()
    funnel_conversion()
    schema_parcours()
    roi_waterfall()
    avis_sentiment()
    avant_apres()
    timeline_plan()
    print(f'\nTermine ! {len(list(out.glob("0*.png")))} graphiques premium dans ./charts/')
