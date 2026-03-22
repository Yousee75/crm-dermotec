"""
SATOREA — Vraie carte Paris avec rues réelles
Utilise staticmaps + tuiles OpenStreetMap
Marqueurs concurrents + métros + prospect
"""
import sys
sys.path.insert(0, '.')

from pathlib import Path

out = Path('charts')
out.mkdir(exist_ok=True)

# Données réelles
PROSPECT = {'nom': 'Latitude ZEN', 'lat': 48.858315, 'lng': 2.383743}

CONCURRENTS = [
    {'lat': 48.8581, 'lng': 2.3830},  # Bodyminute Roquette
    {'lat': 48.8546, 'lng': 2.3846},  # Zen et Beauté
    {'lat': 48.8553, 'lng': 2.3873},  # Bodyminute Charonne
    {'lat': 48.8583, 'lng': 2.3809},  # Saint Algue
    {'lat': 48.8569, 'lng': 2.3782},  # Jean Louis David
    {'lat': 48.8568, 'lng': 2.3815},  # Point Soleil
    {'lat': 48.8588, 'lng': 2.3833},  # Beauty Hub
    {'lat': 48.8570, 'lng': 2.3868},  # Skin Easy
    {'lat': 48.8559, 'lng': 2.3827},  # Laya Beauty
    {'lat': 48.8617, 'lng': 2.3831},  # Ongle Chemin Vert
    {'lat': 48.8553, 'lng': 2.3848},  # Timy Ongles
    {'lat': 48.8584, 'lng': 2.3828},  # Yixin
    {'lat': 48.8573, 'lng': 2.3814},  # Julia Léo
    {'lat': 48.8565, 'lng': 2.3811},  # 26 Nails
]

METROS = [
    {'lat': 48.8584, 'lng': 2.3793},  # Voltaire
    {'lat': 48.8547, 'lng': 2.3855},  # Charonne
    {'lat': 48.8582, 'lng': 2.3903},  # Philippe Auguste
]

def generate():
    import staticmaps

    ctx = staticmaps.Context()
    ctx.set_tile_provider(staticmaps.tile_provider_OSM)

    # Prospect — gros point orange
    prospect_marker = staticmaps.create_latlng(PROSPECT['lat'], PROSPECT['lng'])
    ctx.add_object(staticmaps.Marker(prospect_marker, color=staticmaps.parse_color('#FF5C00'), size=18))

    # Concurrents — points rouges plus petits
    for c in CONCURRENTS:
        pos = staticmaps.create_latlng(c['lat'], c['lng'])
        ctx.add_object(staticmaps.Marker(pos, color=staticmaps.parse_color('#EF4444'), size=8))

    # Métros — points bleus
    for m in METROS:
        pos = staticmaps.create_latlng(m['lat'], m['lng'])
        ctx.add_object(staticmaps.Marker(pos, color=staticmaps.parse_color('#3B82F6'), size=10))

    # Cercle 500m autour du prospect
    circle_points = []
    import math
    for i in range(72):
        angle = math.radians(i * 5)
        dlat = 0.0045 * math.sin(angle)  # ~500m en latitude
        dlng = 0.0065 * math.cos(angle)  # ~500m en longitude (ajusté pour Paris)
        circle_points.append(staticmaps.create_latlng(PROSPECT['lat'] + dlat, PROSPECT['lng'] + dlng))
    circle_points.append(circle_points[0])
    ctx.add_object(staticmaps.Line(circle_points, color=staticmaps.parse_color('#2EC6F3'), width=2))

    # Rendu 800x600
    image = ctx.render_cairo(800, 600)
    image.write_to_png(str(out / 's-carte-reelle.png'))
    print('  s-carte-reelle.png (800x600)')

if __name__ == '__main__':
    print('SATOREA — Carte réelle OpenStreetMap\n')
    try:
        generate()
    except ImportError:
        print('staticmaps avec cairo non disponible, utilisation de Pillow...')
        import staticmaps as sm

        ctx = sm.Context()
        ctx.set_tile_provider(sm.tile_provider_OSM)

        import math

        prospect_pos = sm.create_latlng(PROSPECT['lat'], PROSPECT['lng'])
        ctx.add_object(sm.Marker(prospect_pos, color=sm.parse_color('#FF5C00'), size=18))

        for c in CONCURRENTS:
            pos = sm.create_latlng(c['lat'], c['lng'])
            ctx.add_object(sm.Marker(pos, color=sm.parse_color('#EF4444'), size=8))

        for m in METROS:
            pos = sm.create_latlng(m['lat'], m['lng'])
            ctx.add_object(sm.Marker(pos, color=sm.parse_color('#3B82F6'), size=10))

        # Cercle
        pts = []
        for i in range(72):
            a = math.radians(i * 5)
            pts.append(sm.create_latlng(PROSPECT['lat'] + 0.0045*math.sin(a), PROSPECT['lng'] + 0.0065*math.cos(a)))
        pts.append(pts[0])
        ctx.add_object(sm.Line(pts, color=sm.parse_color('#2EC6F3'), width=2))

        img = ctx.render_pillow(800, 600)
        img.save(str(out / 's-carte-reelle.png'))
        print('  s-carte-reelle.png (800x600) via Pillow')

    print('\nTerminé !')
