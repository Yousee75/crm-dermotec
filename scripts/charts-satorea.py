"""
SATOREA DESIGN SYSTEM — Graphiques rapport prospect
Palette : Noir #0A0A0A / Orange #FF5C00 / Rose #FF2D78 / Fond blanc
Chaque graphique = 1 message cle en titre, 1 explication, 1 insight
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe
import numpy as np
from pathlib import Path
import math

# ═══ PALETTE SATOREA ═══
BLACK = '#0A0A0A'
BLACK2 = '#1A1A1A'
ORANGE = '#FF5C00'
ORANGE_L = '#FF8C42'
ORANGE_BG = '#FFF5ED'
ROSE = '#FF2D78'
ROSE_L = '#FF6BA8'
ROSE_BG = '#FFF0F5'
WHITE = '#FFFFFF'
GRAY = '#888888'
GRAY_L = '#CCCCCC'
GRAY_XL = '#E8E8E8'
GRAY_BG = '#F5F5F5'
GREEN = '#22C55E'
GREEN_D = '#059669'
GREEN_BG = '#F0FDF4'
RED = '#EF4444'
RED_BG = '#FEF2F2'
BLUE = '#3B82F6'
VIOLET = '#A855F7'
AMBER = '#F59E0B'
CYAN = '#06B6D4'

# Dimensions du scoring
DIM_C = [GREEN, BLUE, VIOLET, ORANGE, CYAN]
DIM_L = ['Reputation', 'Presence', 'Activite', 'Financier', 'Quartier']

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Segoe UI', 'Calibri', 'Arial'],
    'figure.facecolor': WHITE,
    'axes.facecolor': WHITE,
    'text.color': BLACK,
})
out = Path('charts')
out.mkdir(exist_ok=True)

# Data Esthelia
SCORES = [78, 55, 35, 58, 82]
GLOBAL = 64
AVG = [50, 50, 50, 50, 50]

def footer(fig, text='Satorea — Briefing Prospect'):
    fig.text(0.98, 0.005, text, ha='right', va='bottom', fontsize=6, color=GRAY, style='italic')

# ═══ 1. GAUGE SCORE ═══
def gauge():
    fig, ax = plt.subplots(figsize=(5, 3.2))
    ax.set_xlim(-1.3, 1.3); ax.set_ylim(-0.3, 1.3); ax.set_aspect('equal'); ax.axis('off')

    for i in range(180):
        a = math.radians(i); r = 1.0
        x1, y1 = r*math.cos(math.pi-a), r*math.sin(math.pi-a)
        x2, y2 = (r-.15)*math.cos(math.pi-a), (r-.15)*math.sin(math.pi-a)
        c = RED if i < 54 else ORANGE if i < 108 else GREEN
        ax.plot([x1,x2],[y1,y2], color=c, lw=3, alpha=0.12, solid_capstyle='round')

    score_a = GLOBAL/100*180
    for i in range(int(score_a)):
        a = math.radians(i); r = 1.0
        x1, y1 = r*math.cos(math.pi-a), r*math.sin(math.pi-a)
        x2, y2 = (r-.15)*math.cos(math.pi-a), (r-.15)*math.sin(math.pi-a)
        c = RED if i < 54 else ORANGE if i < 108 else GREEN
        ax.plot([x1,x2],[y1,y2], color=c, lw=3, solid_capstyle='round')

    na = math.radians(GLOBAL/100*180)
    ax.annotate('', xy=(.75*math.cos(math.pi-na), .75*math.sin(math.pi-na)), xytext=(0,0),
                arrowprops=dict(arrowstyle='->', color=BLACK, lw=2.5))
    ax.plot(0, 0, 'o', color=BLACK, markersize=8, zorder=5)

    sc = GREEN if GLOBAL >= 60 else ORANGE if GLOBAL >= 30 else RED
    ax.text(0, 0.35, str(GLOBAL), ha='center', va='center', fontsize=38, fontweight='bold', color=sc)
    ax.text(0, 0.15, '/100', ha='center', fontsize=12, color=GRAY)
    ax.text(-1.15, -0.15, 'FROID', fontsize=7, color=RED, ha='center', fontweight='bold')
    ax.text(0, 1.12, 'TIEDE', fontsize=7, color=ORANGE, ha='center', fontweight='bold')
    ax.text(1.15, -0.15, 'CHAUD', fontsize=7, color=GREEN, ha='center', fontweight='bold')
    ax.text(0, -0.22, 'TIEDE — Fort potentiel', ha='center', fontsize=10, fontweight='bold', color=ORANGE,
            bbox=dict(boxstyle='round,pad=0.4', facecolor=ORANGE_BG, edgecolor=ORANGE, lw=1))

    fig.suptitle('Score Prospect', fontsize=14, fontweight='bold', color=BLACK, y=0.98)
    footer(fig)
    plt.tight_layout()
    plt.savefig(out/'s01-gauge.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s01-gauge')

# ═══ 2. RADAR PREMIUM ═══
def radar():
    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    N = 5
    angles = [n/float(N)*2*math.pi for n in range(N)] + [0]
    vals = SCORES + SCORES[:1]
    avg = AVG + AVG[:1]

    ax.set_theta_offset(math.pi/2); ax.set_theta_direction(-1); ax.set_rmax(100)
    ax.set_rticks([25,50,75,100]); ax.set_yticklabels(['','50','75',''], fontsize=7, color=GRAY_L)
    ax.spines['polar'].set_visible(False); ax.grid(color=GRAY_XL, lw=0.6)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(DIM_L, fontsize=12, fontweight='bold', color=BLACK)

    ax.fill(angles, avg, color=RED, alpha=0.03)
    ax.plot(angles, avg, '--', color=RED, lw=1.5, alpha=0.25, label='Moyenne secteur')

    for a_m in [0.02, 0.05, 0.08]:
        ax.fill(angles, [v*(1-a_m*3) for v in vals], color=ORANGE, alpha=a_m)
    ax.plot(angles, vals, color=ORANGE, lw=3, label='Esthelia')

    insights = ['Top 5%\nParis', 'Site OK\nPas Insta', 'Faible\n= opportunite', 'CA 156K\nMarge 7%', 'Oberkampf\nIdeal']
    for i, (a, v) in enumerate(zip(angles[:-1], SCORES)):
        ax.plot(a, v, 'o', color=DIM_C[i], markersize=12, zorder=5, markeredgecolor=WHITE, markeredgewidth=2.5)
        ax.text(a, v, f' {v}', fontsize=11, fontweight='bold', color=DIM_C[i], va='center',
                path_effects=[pe.withStroke(linewidth=3, foreground=WHITE)])
        r_t = min(v+18, 105)
        ax.text(a, r_t, insights[i], fontsize=6.5, color=GRAY, ha='center', va='center', style='italic',
                bbox=dict(boxstyle='round,pad=0.2', facecolor=WHITE, edgecolor=GRAY_XL, lw=0.5, alpha=0.9))

    ax.legend(loc='lower right', bbox_to_anchor=(1.2,-0.05), fontsize=9, frameon=True, facecolor=WHITE, edgecolor=GRAY_XL)
    fig.suptitle('Reputation solide (78) mais communication digitale en retard (35)', fontsize=12, fontweight='bold', color=BLACK, y=0.99)
    fig.text(0.5, 0.01, 'Le microblading genere du contenu Instagram — resout la faiblesse #1', ha='center', fontsize=9, color=ORANGE, fontweight='bold', style='italic')
    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out/'s02-radar.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s02-radar')

# ═══ 3. AVIS SENTIMENT ═══
def avis():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), gridspec_kw={'width_ratios': [1.2, 1]})
    stars = [5,4,3,2,1]; pcts = [70,20,6,2,2]; counts = [62,18,5,2,2]
    cm = {5:GREEN, 4:'#22C55E', 3:AMBER, 2:ORANGE, 1:RED}
    colors = [cm[s] for s in stars]

    bars = ax1.barh(range(len(stars)), pcts, height=0.6, color=colors, zorder=3)
    ax1.set_yticks(range(len(stars)))
    ax1.set_yticklabels([f'{s} {"*"*s}' for s in stars], fontsize=10, fontweight='bold', color=BLACK2)
    ax1.set_xlim(0, 100)
    for b, pc, ct in zip(bars, pcts, counts):
        ax1.text(pc+2, b.get_y()+b.get_height()/2, f'{pc}% ({ct})', va='center', fontsize=9, color=GRAY)
    ax1.spines['top'].set_visible(False); ax1.spines['right'].set_visible(False); ax1.spines['left'].set_visible(False)
    ax1.tick_params(left=False); ax1.grid(axis='x', color=GRAY_XL, lw=0.3, zorder=1)
    ax1.text(70, 4.3, '4.8', fontsize=36, fontweight='bold', color=ORANGE, ha='center')
    ax1.text(85, 4.3, '/5', fontsize=14, color=GRAY, ha='left', va='center')
    ax1.set_title('89 avis Google analyses', fontsize=11, fontweight='bold', color=BLACK, loc='left')

    ax2.axis('off')
    pos_kw = ['Apaisant', 'Professionnel', 'Chaleureux', 'Qualite', 'Zen', 'Prix correct']
    neg_kw = ['Pas de microblading', 'Horaires']
    ax2.text(0.5, 0.95, 'Mots-cles positifs', ha='center', va='top', fontsize=10, fontweight='bold', color=GREEN_D, transform=ax2.transAxes)
    for i, kw in enumerate(pos_kw):
        sz = 14-i*1.2; x = 0.15+(i%3)*0.3; y = 0.72-(i//3)*0.18
        ax2.text(x, y, kw, ha='center', va='center', fontsize=sz, color=GREEN, fontweight='bold',
                 alpha=0.7+0.05*(6-i), transform=ax2.transAxes,
                 bbox=dict(boxstyle='round,pad=0.2', facecolor=GREEN_BG, edgecolor='none'))
    ax2.text(0.5, 0.32, 'Points d\'attention', ha='center', va='top', fontsize=10, fontweight='bold', color=ROSE, transform=ax2.transAxes)
    for i, kw in enumerate(neg_kw):
        ax2.text(0.5, 0.18-i*0.14, kw, ha='center', va='center', fontsize=11, color=ROSE, fontweight='bold',
                 transform=ax2.transAxes, bbox=dict(boxstyle='round,pad=0.3', facecolor=ROSE_BG, edgecolor=ROSE, lw=1))

    fig.suptitle('89 % d\'avis positifs — une reputation en or', fontsize=12, fontweight='bold', color=BLACK, y=0.99)
    fig.text(0.5, 0.01, 'Un avis 4 etoiles mentionne le manque de microblading = demande reelle', ha='center', fontsize=9, color=ORANGE, fontweight='bold', style='italic')
    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out/'s03-avis.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s03-avis')

# ═══ 4. CARTE CONCURRENTS ═══
def concurrents():
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.set_xlim(-0.8, 0.8); ax.set_ylim(-0.6, 0.6); ax.set_aspect('equal'); ax.axis('off')

    for r, lb, al in [(0.2, '200m', 0.06), (0.5, '500m', 0.03)]:
        c = plt.Circle((0,0), r, facecolor=ORANGE+'08', edgecolor=GRAY_XL, lw=1, linestyle='--')
        ax.add_patch(c)
        ax.text(r*0.7, r*0.7, lb, fontsize=7, color=GRAY_L, ha='center')

    ax.plot(0, 0, 'o', color=ORANGE, markersize=20, zorder=10, markeredgecolor=WHITE, markeredgewidth=3)
    ax.text(0, 0, 'E', fontsize=11, fontweight='bold', color=WHITE, ha='center', va='center', zorder=11)
    ax.text(0, -0.085, 'Esthelia', fontsize=8, fontweight='bold', color=BLACK, ha='center', va='top')

    comps = [
        ('Latitude Zen', 0.15, 0.12, 4.2, 23, False), ('NLS Beaute', -0.18, 0.08, 3.9, 15, False),
        ('Beauty Paris', 0.25, -0.1, 4.5, 67, False), ('Body Minute', -0.3, -0.15, 3.6, 42, False),
        ('Institut Voltaire', 0.1, -0.22, 4.1, 31, False), ('Jolie Peau', -0.12, 0.25, 4.3, 18, False),
        ('L\'Eclat', 0.35, 0.2, 3.8, 12, False), ('Zen Institut', -0.4, 0.05, 4.0, 28, False),
        ('Nails & Co', 0.05, 0.35, 3.5, 8, False),
        ('Belle & Zen', -0.25, -0.3, 4.4, 55, True), ('Derma Studio', 0.4, -0.25, 4.6, 89, True),
        ('Skin Care Pro', -0.45, 0.25, 4.1, 34, True),
    ]
    for nm, x, y, nt, av, micro in comps:
        cl = ROSE if micro else GRAY_L
        sz = max(6, min(14, av/8))
        ax.plot(x, y, 'o', color=cl, markersize=sz, alpha=0.7, zorder=5, markeredgecolor=WHITE, markeredgewidth=1.5)
        ax.text(x, y-0.045, nm, fontsize=5.5, color=BLACK2, ha='center', va='top',
                bbox=dict(boxstyle='round,pad=0.15', facecolor=WHITE, edgecolor=GRAY_XL, lw=0.3, alpha=0.85))
        ax.text(x+0.03, y+0.025, f'{nt}', fontsize=6, color=cl, fontweight='bold')

    ax.plot(0.55, -0.48, 'o', color=GRAY_L, markersize=8); ax.text(0.59, -0.48, 'Sans microblading', fontsize=7, color=GRAY, va='center')
    ax.plot(0.55, -0.53, 'o', color=ROSE, markersize=8); ax.text(0.59, -0.53, 'Fait du microblading', fontsize=7, color=ROSE, va='center', fontweight='bold')
    ax.plot(-0.55, -0.48, 'o', color=ORANGE, markersize=10, markeredgecolor=WHITE, markeredgewidth=2)
    ax.text(-0.50, -0.48, 'Esthelia (prospect)', fontsize=7, color=ORANGE, va='center', fontweight='bold')

    fig.suptitle('12 concurrents dans 500 m — seuls 3 font du microblading', fontsize=12, fontweight='bold', color=BLACK, y=0.97)
    fig.text(0.5, 0.01, 'Taille du point = nombre d\'avis  |  Rouge = concurrent en dermopigmentation', ha='center', fontsize=8, color=ORANGE, fontweight='bold', style='italic')
    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.94])
    plt.savefig(out/'s04-concurrents.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s04-concurrents')

# ═══ 5. ROI WATERFALL ═══
def waterfall():
    fig, ax = plt.subplots(figsize=(8, 4.5))
    cats = ['CA actuel\nmensuel', 'Microblading\n+2 700', 'Full Lips\n+1 800', 'CA total\nmensuel', 'CA total\nannuel']
    vals = [13000, 2700, 1800, 17500, 210000]
    bottoms = [0, 13000, 15700, 0, 0]
    colors = [GRAY, ORANGE, ROSE, GREEN, GREEN_D]
    totals = [False, False, False, True, True]

    for i, (c, v, b, cl, tot) in enumerate(zip(cats, vals, bottoms, colors, totals)):
        if tot: ax.bar(i, v, width=0.6, color=cl+'30', edgecolor=cl, lw=2, zorder=3)
        else: ax.bar(i, v, bottom=b, width=0.6, color=cl+'CC', edgecolor=cl, lw=1.5, zorder=3)
        y_t = (b+v) if not tot else v
        ax.text(i, y_t+2500, f'{v:,} EUR'.replace(',', ' '), ha='center', va='bottom', fontsize=10, fontweight='bold', color=cl)
        if 0 < i < 3:
            ax.plot([i-0.35, i-0.65], [bottoms[i], bottoms[i]], '--', color=GRAY_L, lw=0.8, alpha=0.5)

    ax.set_xticks(range(len(cats))); ax.set_xticklabels(cats, fontsize=9, fontweight='bold', color=BLACK)
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False); ax.spines['left'].set_color(GRAY_XL)
    ax.set_ylabel('EUR', fontsize=9, color=GRAY); ax.grid(axis='y', color=GRAY_XL, lw=0.3, zorder=1)

    ax.annotate('+35 % de CA\nannuel', xy=(4, 210000), xytext=(4, 235000), fontsize=11, fontweight='bold', color=GREEN_D, ha='center',
                bbox=dict(boxstyle='round,pad=0.4', facecolor=GREEN_BG, edgecolor=GREEN, lw=1.5))

    fig.suptitle('+4 500 EUR de CA par mois — decomposition du gain', fontsize=13, fontweight='bold', color=BLACK, y=0.98)
    fig.text(0.5, 0.01, 'Investissement : 0 EUR (OPCO)  |  Remboursement : 3 semaines', ha='center', fontsize=9, color=ORANGE, fontweight='bold', style='italic')
    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.95])
    plt.savefig(out/'s05-waterfall.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s05-waterfall')

# ═══ 6. AVANT/APRES ═══
def avant_apres():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4))
    cats = ['CA\nmensuel', 'Panier\nmoyen', 'Prestations\npremium', 'Contenu\nInstagram', 'Marge\nnette']
    avant = [13000, 55, 0, 0, 7.2]; apres = [17500, 225, 3, 12, 18]

    x = np.arange(len(cats)); w = 0.35
    ax1.bar(x-w/2, avant, w, color=GRAY_L, label='Aujourd\'hui', zorder=3)
    ax1.bar(x+w/2, apres, w, color=ORANGE+'CC', label='Avec microblading', zorder=3, edgecolor=ORANGE, lw=1)
    ax1.set_xticks(x); ax1.set_xticklabels(cats, fontsize=8, fontweight='bold', color=BLACK)
    ax1.spines['top'].set_visible(False); ax1.spines['right'].set_visible(False)
    ax1.grid(axis='y', color=GRAY_XL, lw=0.3, zorder=1)
    ax1.legend(fontsize=8, loc='upper left', frameon=True, facecolor=WHITE, edgecolor=GRAY_XL)
    ax1.set_title('Impact mesurable', fontsize=11, fontweight='bold', color=BLACK, loc='left')

    for i, (a, b) in enumerate(zip(avant, apres)):
        if b > a:
            d = f'+{b-a:,.0f}'.replace(',', ' ') if a > 100 else f'+{b-a:.0f}'
            ax1.text(i+w/2, b+max(avant)*0.03, d, ha='center', fontsize=8, fontweight='bold', color=ORANGE)

    ax2.axis('off')
    kpis = [('+35%', 'CA annuel', ORANGE), ('x4', 'Panier moyen', ROSE), ('3 sem.', 'Remboursement', GREEN), ('0 EUR', 'Cout formation', GREEN_D)]
    for i, (v, l, c) in enumerate(kpis):
        row = i//2; col = i%2; xp = 0.15+col*0.5; yp = 0.75-row*0.45
        ax2.text(xp, yp, v, ha='center', va='center', fontsize=28, fontweight='bold', color=c, transform=ax2.transAxes)
        ax2.text(xp, yp-0.12, l, ha='center', va='center', fontsize=9, color=GRAY, transform=ax2.transAxes)
    ax2.text(0.5, 0.98, 'Chiffres cles', ha='center', va='top', fontsize=11, fontweight='bold', color=BLACK, transform=ax2.transAxes)

    fig.suptitle('Avant / Apres formation : transformation du salon', fontsize=12, fontweight='bold', color=BLACK, y=0.99)
    footer(fig)
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.savefig(out/'s06-avant-apres.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s06-avant-apres')

# ═══ 7. PARCOURS PROSPECT ═══
def parcours():
    fig, ax = plt.subplots(figsize=(9, 3))
    ax.set_xlim(-0.5, 10.5); ax.set_ylim(-1.5, 2); ax.axis('off')
    ax.plot([-0.3, 9.5], [0.5, 0.5], color=GRAY_XL, lw=3, zorder=1, solid_capstyle='round')

    steps = [
        (0, 'Appel\n10h-11h30', 'J0', ORANGE, True), (1.5, 'SMS +\ncatalogue', 'J+1', ORANGE_L, False),
        (3, 'Email\navant/apres', 'J+1', BLUE, False), (4.5, 'Rappel\n« photos ? »', 'J+3', VIOLET, True),
        (6, 'Visite\nsalon', 'J+7', ROSE, True), (7.5, 'Temoignage\nvideo', 'J+14', GREEN, False),
        (9, 'Inscription', 'J+30', GREEN_D, True),
    ]
    for idx, (x, label, timing, color, key) in enumerate(steps):
        sz = 14 if key else 10
        ax.plot(x, 0.5, 'o', color=color, markersize=sz, zorder=4, markeredgecolor=WHITE, markeredgewidth=2)
        y_l = 1.4 if idx%2==0 else -0.6
        ax.text(x, y_l, label, ha='center', va='center', fontsize=8, fontweight='bold', color=BLACK,
                bbox=dict(boxstyle='round,pad=0.3', facecolor=color+'10', edgecolor=color, lw=1))
        y_s = 0.5+(0.15 if y_l > 0 else -0.15); y_e = y_l+(-0.25 if y_l > 0 else 0.25)
        ax.plot([x, x], [y_s, y_e], color=color, lw=1, linestyle=':', alpha=0.5)
        ax.text(x, 0.15 if y_l > 0 else 0.85, timing, ha='center', fontsize=7, color=GRAY, fontweight='bold')

    fig.suptitle('Du premier appel a l\'inscription — 5 semaines', fontsize=12, fontweight='bold', color=BLACK, y=0.98)
    footer(fig)
    plt.tight_layout()
    plt.savefig(out/'s07-parcours.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s07-parcours')

# ═══ 8. TENDANCES MARCHE ═══
def tendances():
    fig, ax = plt.subplots(figsize=(8, 3.5))
    mois = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec']
    micro = [65,72,85,90,88,78,60,55,82,95,88,70]
    perm = [45,50,55,60,58,52,42,38,55,62,58,48]
    x = np.arange(len(mois))

    ax.fill_between(x, micro, alpha=0.08, color=ORANGE)
    ax.plot(x, micro, '-o', color=ORANGE, lw=2.5, markersize=6, label='Microblading Paris', zorder=3)
    ax.fill_between(x, perm, alpha=0.04, color=ROSE)
    ax.plot(x, perm, '--', color=ROSE, lw=1.5, label='Maquillage permanent', zorder=2)

    peak = micro.index(max(micro))
    ax.annotate(f'Pic : {mois[peak]}', xy=(peak, max(micro)), xytext=(peak+1.5, max(micro)+5),
                fontsize=8, fontweight='bold', color=ORANGE,
                arrowprops=dict(arrowstyle='->', color=ORANGE, lw=1.5),
                bbox=dict(boxstyle='round,pad=0.3', facecolor=ORANGE_BG, edgecolor=ORANGE, lw=1))

    ax.axvspan(2, 4, color=GREEN, alpha=0.03, zorder=1); ax.axvspan(8, 10, color=GREEN, alpha=0.03, zorder=1)
    ax.text(3, 40, 'Haute\nsaison', fontsize=7, color=GREEN_D, ha='center', fontweight='bold')
    ax.text(9, 40, 'Haute\nsaison', fontsize=7, color=GREEN_D, ha='center', fontweight='bold')

    ax.set_xticks(x); ax.set_xticklabels(mois, fontsize=9, color=GRAY)
    ax.set_ylim(30, 105)
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    ax.grid(axis='y', color=GRAY_XL, lw=0.3, zorder=1)
    ax.legend(fontsize=8, loc='lower left', frameon=True, facecolor=WHITE, edgecolor=GRAY_XL)

    fig.suptitle('La demande de microblading a Paris n\'a jamais ete aussi forte', fontsize=11, fontweight='bold', color=BLACK, y=0.99)
    fig.text(0.5, 0.01, '2 pics par an (mars + octobre) — C\'est maintenant le meilleur moment', ha='center', fontsize=8, color=ORANGE, fontweight='bold', style='italic')
    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out/'s08-tendances.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s08-tendances')

# ═══ 9. DEMOGRAPHIE ═══
def demographie():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), gridspec_kw={'width_ratios': [1.2, 1]})
    csp = [('Cadres', 38, ORANGE), ('Prof. inter.', 22, BLUE), ('Employes', 18, CYAN), ('Artisans', 12, VIOLET), ('Ouvriers', 6, GRAY), ('Autres', 4, GRAY_L)]
    labels = [c[0] for c in csp]; vals = [c[1] for c in csp]; colors = [c[2] for c in csp]

    bars = ax1.barh(range(len(labels)), vals, height=0.55, color=colors, zorder=3)
    ax1.set_yticks(range(len(labels))); ax1.set_yticklabels(labels, fontsize=9, fontweight='bold', color=BLACK)
    ax1.set_xlim(0, 50)
    for b, v in zip(bars, vals):
        ax1.text(v+1, b.get_y()+b.get_height()/2, f'{v} %', va='center', fontsize=9, fontweight='bold', color=GRAY)
    ax1.spines['top'].set_visible(False); ax1.spines['right'].set_visible(False); ax1.spines['left'].set_visible(False)
    ax1.tick_params(left=False); ax1.grid(axis='x', color=GRAY_XL, lw=0.3, zorder=1)
    ax1.set_title('CSP — Paris 11e', fontsize=10, fontweight='bold', color=BLACK, loc='left')

    ax2.axis('off')
    kpis = [('32 400 EUR', 'Revenu median', ORANGE), ('10 800 EUR', 'Prix m2', ROSE), ('152 000', 'Population', BLUE), ('34 %', '25-39 ans', GREEN), ('58 %', 'Diplome sup.', VIOLET), ('78 %', 'Taux activite', CYAN)]
    for i, (v, l, c) in enumerate(kpis):
        row = i//2; col = i%2; xp = 0.1+col*0.5; yp = 0.85-row*0.32
        ax2.text(xp, yp, v, ha='center', va='center', fontsize=18, fontweight='bold', color=c, transform=ax2.transAxes)
        ax2.text(xp, yp-0.1, l, ha='center', va='center', fontsize=7.5, color=GRAY, transform=ax2.transAxes)

    fig.suptitle('Quartier CSP+ — clientele prete a payer 200 EUR une seance', fontsize=12, fontweight='bold', color=BLACK, y=0.99)
    fig.text(0.5, 0.01, '38 % de cadres + revenu median 32K = marche ideal pour le microblading', ha='center', fontsize=8, color=ORANGE, fontweight='bold', style='italic')
    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out/'s09-demographie.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s09-demographie')

# ═══ 10. SCORECARD DIGITAL ═══
def digital():
    fig, ax = plt.subplots(figsize=(8, 3.5))
    ax.axis('off')
    channels = [
        ('Google Business', 78, GREEN, 'Note 4.8 | 89 avis | Profil complet'),
        ('Site Web', 55, BLUE, 'institutesthelia.fr | Design basique'),
        ('Treatwell', 50, VIOLET, 'Present | Reservations actives'),
        ('Instagram', 10, RED, 'Pas de compte visible'),
        ('Facebook', 15, RED, 'Page inactive'),
        ('Planity', 0, GRAY_L, 'Non reference'),
    ]
    for i, (nm, sc, cl, det) in enumerate(channels):
        y = 0.88-i*0.15
        ax.text(0.02, y, nm, ha='left', va='center', fontsize=10, fontweight='bold', color=BLACK, transform=ax.transAxes)
        bx, bw = 0.28, 0.42
        ax.add_patch(mpatches.FancyBboxPatch((bx, y-0.025), bw, 0.05, boxstyle="round,pad=0.01", facecolor=GRAY_XL, transform=ax.transAxes, zorder=2))
        fw = bw*sc/100
        if fw > 0:
            ax.add_patch(mpatches.FancyBboxPatch((bx, y-0.025), fw, 0.05, boxstyle="round,pad=0.01", facecolor=cl, transform=ax.transAxes, zorder=3))
        ax.text(bx+bw+0.02, y, f'{sc}/100', ha='left', va='center', fontsize=9, fontweight='bold', color=cl, transform=ax.transAxes)
        ax.text(0.78, y, det, ha='left', va='center', fontsize=7, color=GRAY, transform=ax.transAxes, style='italic')

    avg = sum(c[1] for c in channels)/len(channels)
    ax.text(0.5, 0.02, f'Score digital global : {avg:.0f}/100', ha='center', va='center', fontsize=11, fontweight='bold', color=BLACK, transform=ax.transAxes,
            bbox=dict(boxstyle='round,pad=0.4', facecolor=ORANGE_BG, edgecolor=ORANGE, lw=1.5))

    fig.suptitle('Presence digitale faible — Instagram = opportunite #1', fontsize=12, fontweight='bold', color=BLACK, y=0.98)
    footer(fig)
    plt.tight_layout()
    plt.savefig(out/'s10-digital.png', dpi=250, bbox_inches='tight', facecolor=WHITE)
    plt.close()
    print('  s10-digital')

# ═══ MAIN ═══
if __name__ == '__main__':
    print('SATOREA — Generation graphiques palette Noir/Orange/Rose\n')
    gauge()
    radar()
    avis()
    concurrents()
    waterfall()
    avant_apres()
    parcours()
    tendances()
    demographie()
    digital()
    n = len(list(out.glob('s*.png')))
    print(f'\nTermine ! {n} graphiques Satorea dans ./charts/')
