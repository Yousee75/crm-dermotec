"""
SATOREA — Carte PNG propre pour le rapport Word
Utilise matplotlib + données réelles Google Places
Fond : grille de rues simulée + points GPS réels
Pas superposé, lisible, exportable en PNG
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from pathlib import Path
import math

out = Path('charts')

# Palette Satorea
OR = '#FF5C00'
BK = '#0A0A0A'
GN = '#22C55E'
AM = '#F59E0B'
RD = '#EF4444'
BL = '#3B82F6'
VL = '#A855F7'
GR = '#888888'
GRL = '#CCCCCC'
GXL = '#E8E8E8'
W = '#FFFFFF'

# Données réelles Google Places API
PROSPECT = {'nom': 'Latitude ZEN', 'lat': 48.858315, 'lng': 2.383743, 'note': 4.4, 'avis': 300}

CONCURRENTS = [
    {'nom': 'Bodyminute\nRoquette', 'lat': 48.8581, 'lng': 2.3830, 'note': 3.7, 'avis': 76},
    {'nom': 'Zen et\nBeaute', 'lat': 48.8546, 'lng': 2.3846, 'note': 4.7, 'avis': 141},
    {'nom': 'Bodyminute\nCharonne', 'lat': 48.8553, 'lng': 2.3873, 'note': 4.4, 'avis': 183},
    {'nom': 'Saint\nAlgue', 'lat': 48.8583, 'lng': 2.3809, 'note': 4.4, 'avis': 300},
    {'nom': 'Jean Louis\nDavid', 'lat': 48.8569, 'lng': 2.3782, 'note': 4.5, 'avis': 231},
    {'nom': 'Point\nSoleil', 'lat': 48.8568, 'lng': 2.3815, 'note': 4.5, 'avis': 200},
    {'nom': 'Beauty\nHub', 'lat': 48.8588, 'lng': 2.3833, 'note': 4.3, 'avis': 138},
    {'nom': 'Skin\nEasy', 'lat': 48.8570, 'lng': 2.3868, 'note': 4.9, 'avis': 139},
    {'nom': 'Laya Beauty\nRepair', 'lat': 48.8559, 'lng': 2.3827, 'note': 5.0, 'avis': 54},
    {'nom': 'Ongle\nChemin Vert', 'lat': 48.8617, 'lng': 2.3831, 'note': 3.4, 'avis': 113},
]

METROS = [
    {'nom': 'Voltaire', 'lat': 48.8584, 'lng': 2.3793, 'ligne': '9'},
    {'nom': 'Charonne', 'lat': 48.8547, 'lng': 2.3855, 'ligne': '9'},
    {'nom': 'Philippe Auguste', 'lat': 48.8582, 'lng': 2.3903, 'ligne': '2'},
]

def note_color(n):
    if n >= 4.5: return GN
    if n >= 4.0: return AM
    return RD

def latlon_to_xy(lat, lng, center_lat, center_lng, scale=15000):
    """Convertit lat/lng en coordonnées x,y relatives au centre"""
    x = (lng - center_lng) * scale * math.cos(math.radians(center_lat))
    y = (lat - center_lat) * scale
    return x, y

def generate_carte():
    fig, ax = plt.subplots(figsize=(9, 7))
    ax.set_aspect('equal')
    ax.axis('off')
    fig.patch.set_facecolor(W)

    clat, clng = PROSPECT['lat'], PROSPECT['lng']

    # Grille de rues (simulée mais à l'échelle)
    for offset in np.arange(-8, 9, 1.5):
        ax.plot([-8, 8], [offset, offset], color=GXL, lw=0.3, zorder=1)
        ax.plot([offset, offset], [-6, 6], color=GXL, lw=0.3, zorder=1)

    # Cercles de rayon
    for r, label, color, style in [(3.3, '200m', OR, '--'), (8.2, '500m', BL, ':')]:
        circle = plt.Circle((0, 0), r, facecolor='none', edgecolor=color, lw=1.2, linestyle=style, zorder=2)
        ax.add_patch(circle)
        ax.text(r * 0.65, r * 0.75, label, fontsize=7, color=color, ha='center', fontweight='bold')

    # Concurrents — points avec taille proportionnelle aux avis
    for c in CONCURRENTS:
        x, y = latlon_to_xy(c['lat'], c['lng'], clat, clng)
        if abs(x) > 9 or abs(y) > 7: continue  # hors cadre
        sz = max(5, min(14, c['avis'] / 22))
        color = note_color(c['note'])
        ax.plot(x, y, 'o', color=color, markersize=sz, zorder=4, alpha=0.75,
                markeredgecolor=W, markeredgewidth=1.5)
        # Nom (décalé pour pas superposer)
        offset_y = -0.6 if y > 0 else 0.5
        ax.text(x, y + offset_y, c['nom'], fontsize=5.5, color=BK, ha='center', va='center',
                bbox=dict(boxstyle='round,pad=0.15', facecolor=W, edgecolor=GXL, lw=0.3, alpha=0.85),
                zorder=5)
        # Note
        ax.text(x + 0.4, y + 0.3, f'{c["note"]}', fontsize=6, color=color, fontweight='bold', zorder=5)

    # Métros — carrés bleus
    for m in METROS:
        x, y = latlon_to_xy(m['lat'], m['lng'], clat, clng)
        if abs(x) > 9 or abs(y) > 7: continue
        ax.plot(x, y, 's', color=BL, markersize=10, zorder=6, markeredgecolor=W, markeredgewidth=2)
        ax.text(x, y, 'M', fontsize=7, color=W, ha='center', va='center', fontweight='bold', zorder=7)
        ax.text(x, y - 0.55, f'{m["nom"]}\nL{m["ligne"]}', fontsize=5.5, color=BL, ha='center',
                fontweight='bold', zorder=5)

    # Prospect — grande étoile orange
    ax.plot(0, 0, '*', color=OR, markersize=25, zorder=10, markeredgecolor=W, markeredgewidth=1.5)
    ax.text(0, -1.1, f'{PROSPECT["nom"]}\n{PROSPECT["note"]}★ ({PROSPECT["avis"]} avis)',
            fontsize=8, color=OR, ha='center', fontweight='bold', zorder=10,
            bbox=dict(boxstyle='round,pad=0.3', facecolor=W, edgecolor=OR, lw=1.5))

    # Légende
    legend_items = [
        plt.Line2D([0], [0], marker='*', color=W, markerfacecolor=OR, markersize=14, label=f'{PROSPECT["nom"]} (prospect)'),
        plt.Line2D([0], [0], marker='o', color=W, markerfacecolor=GN, markersize=8, label='Concurrent ≥ 4,5★'),
        plt.Line2D([0], [0], marker='o', color=W, markerfacecolor=AM, markersize=8, label='Concurrent 4,0 – 4,4★'),
        plt.Line2D([0], [0], marker='o', color=W, markerfacecolor=RD, markersize=8, label='Concurrent < 4,0★'),
        plt.Line2D([0], [0], marker='s', color=W, markerfacecolor=BL, markersize=8, label='Station de métro'),
    ]
    ax.legend(handles=legend_items, loc='lower right', fontsize=7, frameon=True,
              facecolor=W, edgecolor=GXL, bbox_to_anchor=(1.02, -0.02))

    ax.set_xlim(-9.5, 9.5)
    ax.set_ylim(-7.5, 7.5)

    fig.suptitle('10 concurrents + 3 métros autour de Latitude ZEN — données Google Places',
                 fontsize=11, fontweight='bold', color=BK, y=0.97)
    fig.text(0.5, 0.01, 'Taille des points = nombre d\'avis  |  Couleur = note Google  |  Source : Google Places API',
             ha='center', fontsize=8, color=OR, fontweight='bold', style='italic')
    fig.text(0.98, 0.005, 'Satorea CRM', ha='right', fontsize=6, color=GRL, style='italic')

    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    plt.savefig(out / 's-carte-concurrents.png', dpi=250, bbox_inches='tight', facecolor=W)
    plt.close()
    print('  s-carte-concurrents.png')

if __name__ == '__main__':
    print('SATOREA — Carte PNG pour rapport Word\n')
    generate_carte()
    print('\nTerminé !')
