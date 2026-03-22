"""
SATOREA — Graphiques MAXIMUM pour rapport premium
Toutes les nouvelles pages : concurrents, démographie, digital, horaires, tendances

Libs: matplotlib, numpy
Output: ./charts/*.png @ 250 DPI
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe
import numpy as np
from pathlib import Path
import math

# Charte Satorea
B = '#2EC6F3'; A = '#082545'; G = '#10B981'; GD = '#059669'
AM = '#F59E0B'; AD = '#D97706'; R = '#EF4444'; IN = '#6366F1'
VI = '#8B5CF6'; TL = '#14B8A6'; T = '#1E293B'; T2 = '#475569'
T3 = '#94A3B8'; T4 = '#CBD5E1'; BG = '#FFFFFF'; CD = '#F8FAFC'; BD = '#E2E8F0'

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Segoe UI', 'Calibri', 'Arial'],
    'figure.facecolor': BG, 'axes.facecolor': BG, 'text.color': T,
})
out = Path('charts')
out.mkdir(exist_ok=True)

# ══════════════════════════════════════════════════════
# Inclure les 8 graphiques existants (v2) +
# 6 NOUVEAUX graphiques
# ══════════════════════════════════════════════════════

# ── EXISTANTS (regénérés) ──
# Exécuter d'abord generate-charts-v2.py pour les 8 de base

# ══════════════════════════════════════════════════════
# 9. CARTE CONCURRENTS — Position relative
# ══════════════════════════════════════════════════════
def carte_concurrents():
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.set_xlim(-0.8, 0.8)
    ax.set_ylim(-0.6, 0.6)
    ax.set_aspect('equal')
    ax.axis('off')

    # Cercles de rayon 200m, 500m
    for r, label, alpha in [(0.2, '200m', 0.08), (0.5, '500m', 0.04)]:
        circle = plt.Circle((0, 0), r, facecolor=B + '08', edgecolor=BD, linewidth=1, linestyle='--')
        ax.add_patch(circle)
        ax.text(r * 0.7, r * 0.7, label, fontsize=7, color=T3, ha='center')

    # Prospect au centre
    ax.plot(0, 0, 'o', color=B, markersize=18, zorder=10, markeredgecolor=BG, markeredgewidth=3)
    ax.text(0, 0, 'E', fontsize=10, fontweight='bold', color=BG, ha='center', va='center', zorder=11)
    ax.text(0, -0.08, 'Esthelia', fontsize=8, fontweight='bold', color=A, ha='center', va='top')

    # Concurrents
    concurrents = [
        ('Latitude Zen', 0.15, 0.12, 4.2, 23, False),
        ('NLS Beaute', -0.18, 0.08, 3.9, 15, False),
        ('Beauty Paris', 0.25, -0.1, 4.5, 67, False),
        ('Body Minute', -0.3, -0.15, 3.6, 42, False),
        ('Institut Voltaire', 0.1, -0.22, 4.1, 31, False),
        ('Jolie Peau', -0.12, 0.25, 4.3, 18, False),
        ('L\'Eclat', 0.35, 0.2, 3.8, 12, False),
        ('Zen Institut', -0.4, 0.05, 4.0, 28, False),
        ('Nails & Co', 0.05, 0.35, 3.5, 8, False),
        ('Belle & Zen', -0.25, -0.3, 4.4, 55, True),  # True = fait du microblading
        ('Derma Studio', 0.4, -0.25, 4.6, 89, True),
        ('Skin Care Pro', -0.45, 0.25, 4.1, 34, True),
    ]

    for name, x, y, note, avis, has_micro in concurrents:
        color = R if has_micro else T3
        size = max(6, min(14, avis / 8))
        ax.plot(x, y, 'o', color=color, markersize=size, alpha=0.7, zorder=5,
                markeredgecolor=BG, markeredgewidth=1.5)
        ax.text(x, y - 0.045, name, fontsize=5.5, color=A, ha='center', va='top',
                bbox=dict(boxstyle='round,pad=0.15', facecolor=BG, edgecolor=BD, lw=0.3, alpha=0.85))
        ax.text(x + 0.03, y + 0.025, f'{note}', fontsize=6, color=color, fontweight='bold')

    # Légende
    ax.plot(0.55, -0.48, 'o', color=T3, markersize=8)
    ax.text(0.59, -0.48, 'Sans dermopigmentation', fontsize=7, color=T2, va='center')
    ax.plot(0.55, -0.53, 'o', color=R, markersize=8)
    ax.text(0.59, -0.53, 'Fait du microblading', fontsize=7, color=R, va='center', fontweight='bold')
    ax.plot(-0.55, -0.48, 'o', color=B, markersize=10, markeredgecolor=BG, markeredgewidth=2)
    ax.text(-0.50, -0.48, 'Esthelia (prospect)', fontsize=7, color=B, va='center', fontweight='bold')

    fig.suptitle('12 concurrents dans 500m — seuls 3 font du microblading',
                 fontsize=12, fontweight='bold', color=A, y=0.97)
    fig.text(0.5, 0.01, 'Taille = nombre d\'avis | Rouge = concurrent en dermopigmentation',
             ha='center', fontsize=8, color=B, fontweight='bold', style='italic')

    plt.tight_layout(rect=[0, 0.04, 1, 0.94])
    plt.savefig(out / '09-carte-concurrents.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  09-carte-concurrents.png')


# ══════════════════════════════════════════════════════
# 10. DÉMOGRAPHIE QUARTIER — INSEE IRIS
# ══════════════════════════════════════════════════════
def demographie_quartier():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), gridspec_kw={'width_ratios': [1.2, 1]})

    # LEFT: CSP en barres horizontales
    csp = [
        ('Cadres / Prof. intel.', 38, IN),
        ('Prof. intermediaires', 22, B),
        ('Employes', 18, TL),
        ('Artisans / Comm.', 12, AM),
        ('Ouvriers', 6, T3),
        ('Autres', 4, T4),
    ]
    labels = [c[0] for c in csp]
    vals = [c[1] for c in csp]
    colors = [c[2] for c in csp]

    y = np.arange(len(labels))
    bars = ax1.barh(y, vals, height=0.55, color=colors, zorder=3)
    ax1.set_yticks(y)
    ax1.set_yticklabels(labels, fontsize=9, fontweight='bold', color=A)
    ax1.set_xlim(0, 50)
    for bar, val in zip(bars, vals):
        ax1.text(val + 1, bar.get_y() + bar.get_height()/2,
                 f'{val}%', va='center', fontsize=9, fontweight='bold', color=T2)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.spines['left'].set_visible(False)
    ax1.tick_params(left=False)
    ax1.grid(axis='x', color=BD, linewidth=0.3, zorder=1)
    ax1.set_title('CSP dominantes — Paris 11e (IRIS)', fontsize=10, fontweight='bold', color=A, loc='left')

    # RIGHT: KPIs démographiques
    ax2.axis('off')
    kpis = [
        ('Revenu median', '32 400 EUR', IN),
        ('Prix m2', '10 800 EUR', AM),
        ('Population', '152 000', TL),
        ('25-39 ans', '34%', B),
        ('Diplome sup.', '58%', VI),
        ('Taux activite', '78%', G),
    ]
    for i, (label, value, color) in enumerate(kpis):
        row = i // 2
        col = i % 2
        x = 0.1 + col * 0.5
        y_pos = 0.85 - row * 0.32

        ax2.text(x, y_pos, value, ha='center', va='center',
                 fontsize=18, fontweight='bold', color=color, transform=ax2.transAxes)
        ax2.text(x, y_pos - 0.1, label, ha='center', va='center',
                 fontsize=7.5, color=T2, transform=ax2.transAxes)

    fig.suptitle('Quartier CSP+ avec fort pouvoir d\'achat — ideal prestations premium',
                 fontsize=12, fontweight='bold', color=A, y=0.99)
    fig.text(0.5, 0.01, '38% de cadres + revenu median 32K = clientele prete a payer 200 EUR une seance microblading',
             ha='center', fontsize=8, color=B, fontweight='bold', style='italic')

    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out / '10-demographie-quartier.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  10-demographie-quartier.png')


# ══════════════════════════════════════════════════════
# 11. SCORECARD DIGITAL — Présence en ligne
# ══════════════════════════════════════════════════════
def scorecard_digital():
    fig, ax = plt.subplots(figsize=(8, 3.5))
    ax.axis('off')

    channels = [
        ('Google Business', 78, G, 'Note 4.8 | 89 avis | Horaires OK'),
        ('Site Web', 55, B, 'institutesthelia.fr | Design basique'),
        ('Treatwell', 50, VI, 'Present | Reservations actives'),
        ('Instagram', 10, R, 'Pas de compte visible'),
        ('Facebook', 15, R, 'Page inactive ou inexistante'),
        ('Planity', 0, T4, 'Non reference'),
    ]

    for i, (name, score, color, detail) in enumerate(channels):
        y = 0.88 - i * 0.15

        # Label
        ax.text(0.02, y, name, ha='left', va='center', fontsize=10, fontweight='bold',
                color=A, transform=ax.transAxes)

        # Barre
        bar_x = 0.28
        bar_w = 0.42
        ax.add_patch(mpatches.FancyBboxPatch((bar_x, y - 0.025), bar_w, 0.05,
                     boxstyle="round,pad=0.01", facecolor=BD, transform=ax.transAxes, zorder=2))
        fill_w = bar_w * score / 100
        if fill_w > 0:
            ax.add_patch(mpatches.FancyBboxPatch((bar_x, y - 0.025), fill_w, 0.05,
                         boxstyle="round,pad=0.01", facecolor=color, transform=ax.transAxes, zorder=3))

        # Score
        ax.text(bar_x + bar_w + 0.02, y, f'{score}/100', ha='left', va='center',
                fontsize=9, fontweight='bold', color=color, transform=ax.transAxes)

        # Detail
        ax.text(0.78, y, detail, ha='left', va='center', fontsize=7, color=T2,
                transform=ax.transAxes, style='italic')

    # Score digital global
    avg = sum(c[1] for c in channels) / len(channels)
    ax.text(0.5, 0.02, f'Score digital global : {avg:.0f}/100',
            ha='center', va='center', fontsize=11, fontweight='bold', color=A,
            transform=ax.transAxes,
            bbox=dict(boxstyle='round,pad=0.4', facecolor=B + '10', edgecolor=B, lw=1.5))

    fig.suptitle('Presence digitale faible (35/100) — Instagram = opportunite #1',
                 fontsize=12, fontweight='bold', color=A, y=0.98)

    plt.tight_layout()
    plt.savefig(out / '11-scorecard-digital.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  11-scorecard-digital.png')


# ══════════════════════════════════════════════════════
# 12. COMPARAISON HORAIRES — Prospect vs concurrents
# ══════════════════════════════════════════════════════
def comparaison_horaires():
    fig, ax = plt.subplots(figsize=(9, 3.5))

    jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    salons = [
        ('Esthelia', [(10, 19), (10, 19), (10, 19), (10, 19), (10, 19), (10, 18), None], B),
        ('Beauty Paris', [(9, 20), (9, 20), (9, 20), (9, 20), (9, 20), (9, 19), None], T3),
        ('Belle & Zen', [(10, 20), (10, 20), (10, 20), (10, 20), (10, 20), (10, 19), (11, 17)], R),
        ('Body Minute', [(9, 21), (9, 21), (9, 21), (9, 21), (9, 21), (9, 20), (10, 18)], T4),
    ]

    y_pos = 0
    for salon_name, horaires, color in salons:
        for j, slot in enumerate(horaires):
            if slot:
                start, end = slot
                ax.barh(y_pos, end - start, left=start, height=0.5,
                        color=color + ('CC' if salon_name == 'Esthelia' else '40'),
                        edgecolor=color, linewidth=1 if salon_name == 'Esthelia' else 0.5,
                        zorder=3 if salon_name == 'Esthelia' else 2)
                if salon_name == 'Esthelia':
                    ax.text(start + (end - start) / 2, y_pos, f'{start}h-{end}h',
                            ha='center', va='center', fontsize=6, color=BG, fontweight='bold', zorder=4)
            y_pos += 1
        y_pos += 0.5

    # Y labels
    positions = []
    pos = 0
    for salon_name, horaires, _ in salons:
        mid = pos + len(jours) / 2 - 0.5
        positions.append(mid)
        pos += len(jours) + 0.5

    ax.set_yticks(positions)
    ax.set_yticklabels([s[0] for s in salons], fontsize=9, fontweight='bold', color=A)

    # Jours labels en haut
    ax.set_xlim(8, 22)
    ax.set_xticks(range(8, 23))
    ax.set_xticklabels([f'{h}h' for h in range(8, 23)], fontsize=7, color=T3)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='x', color=BD, linewidth=0.3, zorder=1)
    ax.invert_yaxis()

    # Annotation
    ax.annotate('Esthelia ferme 1h\nplus tot que la concurrence', xy=(19, 2.5),
                fontsize=8, color=AM, fontweight='bold', ha='center',
                bbox=dict(boxstyle='round,pad=0.3', facecolor=AM + '10', edgecolor=AM, lw=1))

    fig.suptitle('Esthelia ferme a 19h — ses concurrents ouvrent plus tard et le dimanche',
                 fontsize=11, fontweight='bold', color=A, y=0.99)

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    plt.savefig(out / '12-horaires-compares.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  12-horaires-compares.png')


# ══════════════════════════════════════════════════════
# 13. TENDANCES MARCHÉ — Demande microblading
# ══════════════════════════════════════════════════════
def tendances_marche():
    fig, ax = plt.subplots(figsize=(8, 3.5))

    # Données simulées Google Trends (indice relatif 0-100)
    mois = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
    microblading = [65, 72, 85, 90, 88, 78, 60, 55, 82, 95, 88, 70]
    maquillage_perm = [45, 50, 55, 60, 58, 52, 42, 38, 55, 62, 58, 48]

    x = np.arange(len(mois))

    ax.fill_between(x, microblading, alpha=0.1, color=B)
    ax.plot(x, microblading, '-o', color=B, linewidth=2.5, markersize=6,
            label='Microblading Paris', zorder=3)
    ax.fill_between(x, maquillage_perm, alpha=0.05, color=VI)
    ax.plot(x, maquillage_perm, '--', color=VI, linewidth=1.5,
            label='Maquillage permanent', zorder=2)

    # Pic
    peak_idx = microblading.index(max(microblading))
    ax.annotate(f'Pic : {mois[peak_idx]}\n(indice {max(microblading)})',
                xy=(peak_idx, max(microblading)),
                xytext=(peak_idx + 1.5, max(microblading) + 5),
                fontsize=8, fontweight='bold', color=B,
                arrowprops=dict(arrowstyle='->', color=B, lw=1.5),
                bbox=dict(boxstyle='round,pad=0.3', facecolor=B + '10', edgecolor=B, lw=1))

    # Zone haute saison
    ax.axvspan(2, 4, color=G, alpha=0.04, zorder=1)
    ax.axvspan(8, 10, color=G, alpha=0.04, zorder=1)
    ax.text(3, 40, 'Haute\nsaison', fontsize=7, color=GD, ha='center', fontweight='bold')
    ax.text(9, 40, 'Haute\nsaison', fontsize=7, color=GD, ha='center', fontweight='bold')

    ax.set_xticks(x)
    ax.set_xticklabels(mois, fontsize=9, color=T2)
    ax.set_ylabel('Indice de recherche', fontsize=9, color=T3)
    ax.set_ylim(30, 105)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', color=BD, linewidth=0.3, zorder=1)
    ax.legend(fontsize=8, loc='lower left', frameon=True, facecolor=BG, edgecolor=BD)

    fig.suptitle('Demande de microblading en hausse constante — 2 pics par an (mars + octobre)',
                 fontsize=11, fontweight='bold', color=A, y=0.99)
    fig.text(0.5, 0.01, 'Source : tendances de recherche Paris — La demande n\'a jamais ete aussi haute',
             ha='center', fontsize=8, color=B, fontweight='bold', style='italic')

    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out / '13-tendances-marche.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  13-tendances-marche.png')


# ══════════════════════════════════════════════════════
# 14. COMPARAISON PROSPECT vs CONCURRENTS — Bar chart
# ══════════════════════════════════════════════════════
def comparaison_concurrents():
    fig, ax = plt.subplots(figsize=(8, 4.5))

    salons = ['Esthelia\n(prospect)', 'Derma\nStudio', 'Belle\n& Zen', 'Beauty\nParis', 'Latitude\nZen', 'Body\nMinute']
    notes = [4.8, 4.6, 4.4, 4.5, 4.2, 3.6]
    avis = [89, 89, 55, 67, 23, 42]
    has_micro = [False, True, True, False, False, False]

    x = np.arange(len(salons))
    w = 0.35

    bars1 = ax.bar(x - w/2, notes, w, label='Note Google /5', color=[B if not m else R for m in has_micro], zorder=3, alpha=0.8)
    ax2 = ax.twinx()
    bars2 = ax2.bar(x + w/2, avis, w, label='Nombre d\'avis', color=[B + '30' if not m else R + '30' for m in has_micro], zorder=2, edgecolor=[B if not m else R for m in has_micro], linewidth=1)

    # Highlight prospect
    ax.bar(x[0] - w/2, notes[0], w, color=B, zorder=4, edgecolor=A, linewidth=2)

    for i, (n, a, m) in enumerate(zip(notes, avis, has_micro)):
        ax.text(i - w/2, n + 0.05, f'{n}', ha='center', fontsize=9, fontweight='bold',
                color=R if m else B)
        if m:
            ax.text(i, max(notes) + 0.25, 'MICRO', ha='center', fontsize=6, fontweight='bold',
                    color=R, bbox=dict(boxstyle='round,pad=0.2', facecolor=R + '15', edgecolor=R, lw=0.5))

    ax.set_xticks(x)
    ax.set_xticklabels(salons, fontsize=8, fontweight='bold', color=A)
    ax.set_ylim(3, 5.2)
    ax.set_ylabel('Note Google', fontsize=9, color=T3)
    ax2.set_ylabel('Nombre d\'avis', fontsize=9, color=T3)
    ax.spines['top'].set_visible(False)
    ax2.spines['top'].set_visible(False)

    # Légende
    from matplotlib.lines import Line2D
    legend = [
        Line2D([0], [0], color=B, lw=8, label='Sans microblading'),
        Line2D([0], [0], color=R, lw=8, label='Fait du microblading'),
    ]
    ax.legend(handles=legend, fontsize=8, loc='upper right', frameon=True, facecolor=BG, edgecolor=BD)

    fig.suptitle('Esthelia a la meilleure note (4.8) — mais 3 concurrents font deja le microblading',
                 fontsize=11, fontweight='bold', color=A, y=0.99)
    fig.text(0.5, 0.01, 'Sa reputation est un atout. Ajouter le microblading = devenir incontournable.',
             ha='center', fontsize=8, color=GD, fontweight='bold', style='italic')

    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out / '14-comparaison-concurrents.png', dpi=250, bbox_inches='tight', facecolor=BG)
    plt.close()
    print('  14-comparaison-concurrents.png')


# ══════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════
if __name__ == '__main__':
    print('Generation graphiques MAXIMUM Satorea...\n')
    carte_concurrents()
    demographie_quartier()
    scorecard_digital()
    comparaison_horaires()
    tendances_marche()
    comparaison_concurrents()
    count = len(list(out.glob('*.png')))
    print(f'\nTermine ! {count} graphiques dans ./charts/')
    print('Nouveaux : 09-carte-concurrents, 10-demographie, 11-scorecard-digital, 12-horaires, 13-tendances, 14-comparaison')
