"""
SATOREA — Carte premium style magazine / cabinet de conseil
Utilise prettymapp (OpenStreetMap + matplotlib)
Vrais bâtiments, rues, parcs du quartier
+ marqueurs concurrents superposés
"""
from prettymapp.geo import get_aoi
from prettymapp.osm import get_osm_geometries
from prettymapp.plotting import Plot
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path
import math

out = Path('charts')

# Prospect
P_LAT, P_LNG = 48.858315, 2.383743

# Concurrents (top 10 avec noms)
CONCURRENTS = [
    ('Bodyminute', 48.8581, 2.3830, 3.7, 76),
    ('Zen et Beaute', 48.8546, 2.3846, 4.7, 141),
    ('Saint Algue', 48.8583, 2.3809, 4.4, 300),
    ('Skin Easy', 48.8570, 2.3868, 4.9, 139),
    ('Laya Beauty', 48.8559, 2.3827, 5.0, 54),
    ('Point Soleil', 48.8568, 2.3815, 4.5, 200),
    ('Beauty Hub', 48.8588, 2.3833, 4.3, 138),
    ('Jean Louis David', 48.8569, 2.3782, 4.5, 231),
]

METROS = [
    ('Voltaire L9', 48.8584, 2.3793),
    ('Charonne L9', 48.8547, 2.3855),
    ('Ph. Auguste L2', 48.8582, 2.3903),
]

def note_color(n):
    if n >= 4.5: return '#22C55E'
    if n >= 4.0: return '#F59E0B'
    return '#EF4444'

print('SATOREA — Carte premium quartier Oberkampf\n')
print('1. Telechargement donnees OpenStreetMap...')

# Récupérer les données OSM du quartier (rayon 600m)
aoi = get_aoi(address="89 Rue Léon Frot, 75011 Paris", radius=600, rectangular=False)
df = get_osm_geometries(aoi=aoi)

print(f'   {len(df)} elements OSM recuperes')
print('2. Generation de la carte...')

# Style Satorea — fond blanc, bâtiments gris, rues noires
fig = Plot(
    df=df,
    aoi_bounds=aoi.bounds,
    draw_settings={
        "perimeter": {"fill": False, "lw": 0},
        "streets": {"fc": "#2a2a2a", "ec": "#1a1a1a", "alpha": 1, "lw": 1, "zorder": 4},
        "building": {"palette": ["#E8E8E8", "#D4D4D4", "#C0C0C0"], "ec": "#BBBBBB", "lw": 0.3, "zorder": 3},
        "water": {"fc": "#CCE5FF", "ec": "#99CCFF", "lw": 0.5, "zorder": 2},
        "green": {"fc": "#D5E8D4", "ec": "#A3C4A3", "lw": 0.3, "zorder": 2},
        "forest": {"fc": "#C8DCC8", "ec": "#A0BCA0", "lw": 0.3, "zorder": 2},
        "parking": {"fc": "#F0F0F0", "ec": "#D0D0D0", "lw": 0.3, "zorder": 2},
    },
    shape="circle",
    contour_width=3,
    contour_color="#FF5C00",
    name_on=False,
).ax

# Convertir lat/lng en coordonnées figure
# La carte est centrée sur P_LAT, P_LNG, rayon ~600m
# On doit convertir les coordonnées GPS en positions sur le plot
bounds = aoi.bounds  # (minx, miny, maxx, maxy) = (lng_min, lat_min, lng_max, lat_max)
xlim = fig.get_xlim()
ylim = fig.get_ylim()

def gps_to_plot(lat, lng):
    x = xlim[0] + (lng - bounds[0]) / (bounds[2] - bounds[0]) * (xlim[1] - xlim[0])
    y = ylim[0] + (lat - bounds[1]) / (bounds[3] - bounds[1]) * (ylim[1] - ylim[0])
    return x, y

# Prospect — grande étoile orange
px, py = gps_to_plot(P_LAT, P_LNG)
fig.plot(px, py, '*', color='#FF5C00', markersize=30, zorder=20, markeredgecolor='white', markeredgewidth=2)

# Concurrents
for nom, lat, lng, note, avis in CONCURRENTS:
    x, y = gps_to_plot(lat, lng)
    if xlim[0] < x < xlim[1] and ylim[0] < y < ylim[1]:
        sz = max(8, min(16, avis / 20))
        color = note_color(note)
        fig.plot(x, y, 'o', color=color, markersize=sz, zorder=15,
                 markeredgecolor='white', markeredgewidth=1.5, alpha=0.85)

# Métros
for nom, lat, lng in METROS:
    x, y = gps_to_plot(lat, lng)
    if xlim[0] < x < xlim[1] and ylim[0] < y < ylim[1]:
        fig.plot(x, y, 's', color='#3B82F6', markersize=12, zorder=16,
                 markeredgecolor='white', markeredgewidth=2)
        fig.text(x, y, 'M', fontsize=7, color='white', ha='center', va='center',
                 fontweight='bold', zorder=17)

# Légende
legend_items = [
    plt.Line2D([0], [0], marker='*', color='w', markerfacecolor='#FF5C00', markersize=16, label='Latitude ZEN'),
    plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='#22C55E', markersize=10, label='Concurrent ≥ 4,5★'),
    plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='#F59E0B', markersize=10, label='Concurrent 4,0–4,4★'),
    plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='#EF4444', markersize=10, label='Concurrent < 4,0★'),
    plt.Line2D([0], [0], marker='s', color='w', markerfacecolor='#3B82F6', markersize=10, label='Station de métro'),
]
fig.legend(handles=legend_items, loc='lower left', fontsize=9, frameon=True,
           facecolor='white', edgecolor='#E8E8E8', bbox_to_anchor=(0.02, 0.02))

# Titre
plt.gcf().text(0.5, 0.97,
    'Latitude ZEN — 8 concurrents + 3 métros — Paris 11e',
    ha='center', fontsize=14, fontweight='bold', color='#0A0A0A',
    fontfamily='sans-serif')
plt.gcf().text(0.5, 0.94,
    'Données Google Places API | Fond OpenStreetMap | Satorea CRM',
    ha='center', fontsize=9, color='#888888', style='italic',
    fontfamily='sans-serif')

# Sauvegarder
output = out / 's-carte-premium.png'
plt.savefig(str(output), dpi=200, bbox_inches='tight', facecolor='white', pad_inches=0.3)
plt.close()

size_kb = output.stat().st_size // 1024
print(f'\n3. Carte sauvegardee : {output} ({size_kb} KB)')
print('   Style : batiments + rues + parcs reels OpenStreetMap')
print('   Marqueurs : 1 prospect + 8 concurrents + 3 metros')
