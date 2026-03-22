"""
SATOREA — Cartes réelles OpenStreetMap avec folium
Données RÉELLES récupérées via Google Places API

Cartes générées :
1. Carte concurrents — prospect + 20 concurrents avec notes
2. Carte transports — métros + parking
3. Carte synthèse — tout en un
"""
import folium
from folium.plugins import MarkerCluster
from pathlib import Path

out = Path('charts')
out.mkdir(exist_ok=True)

# ═══ DONNÉES RÉELLES ═══
PROSPECT = {
    'nom': 'Latitude ZEN',
    'lat': 48.858315,
    'lng': 2.383743,
    'note': 4.4,
    'avis': 300,
    'adresse': '89 Rue Léon Frot, 75011 Paris',
}

CONCURRENTS = [
    {'nom': 'Bodyminute Roquette', 'lat': 48.8581474, 'lng': 2.3830279, 'note': 3.7, 'avis': 76},
    {'nom': 'Grain de Beauté', 'lat': 48.8582656, 'lng': 2.3818069, 'note': 4.8, 'avis': 6},
    {'nom': 'Zen et Beauté', 'lat': 48.854638, 'lng': 2.3845846, 'note': 4.7, 'avis': 141},
    {'nom': 'BIOBELA', 'lat': 48.5550593, 'lng': 2.384398, 'note': 4.6, 'avis': 216},
    {'nom': 'Bodyminute Charonne', 'lat': 48.8552605, 'lng': 2.3873426, 'note': 4.4, 'avis': 183},
    {'nom': 'Saint Algue', 'lat': 48.858251, 'lng': 2.3809143, 'note': 4.4, 'avis': 300},
    {'nom': 'Timy Ongles', 'lat': 48.8552656, 'lng': 2.3847998, 'note': 3.7, 'avis': 51},
    {'nom': 'Ongle Chemin Vert', 'lat': 48.8616719, 'lng': 2.3830652, 'note': 3.4, 'avis': 113},
    {'nom': 'Jean Louis David', 'lat': 48.8569278, 'lng': 2.37815, 'note': 4.5, 'avis': 231},
    {'nom': 'Point Soleil', 'lat': 48.8567782, 'lng': 2.3815421, 'note': 4.5, 'avis': 200},
    {'nom': 'The Beauty Zone', 'lat': 48.8587682, 'lng': 2.3832923, 'note': 4.2, 'avis': 9},
    {'nom': 'Beauty Hub', 'lat': 48.8587682, 'lng': 2.3832923, 'note': 4.3, 'avis': 138},
    {'nom': 'Yixin', 'lat': 48.8584081, 'lng': 2.3827872, 'note': 4.2, 'avis': 44},
    {'nom': 'Julia Léo Beauté', 'lat': 48.857353, 'lng': 2.381434, 'note': 4.5, 'avis': 16},
    {'nom': 'Skin Easy', 'lat': 48.8569905, 'lng': 2.3868479, 'note': 4.9, 'avis': 139},
    {'nom': '26 Nails', 'lat': 48.8564682, 'lng': 2.3810737, 'note': 3.8, 'avis': 20},
    {'nom': 'Laya Beauty Repair', 'lat': 48.8558543, 'lng': 2.3827133, 'note': 5.0, 'avis': 54},
]

METROS = [
    {'nom': 'Voltaire', 'lat': 48.8583977, 'lng': 2.3793497, 'lignes': '9'},
    {'nom': 'Charonne', 'lat': 48.85466, 'lng': 2.38553, 'lignes': '9'},
    {'nom': 'Philippe Auguste', 'lat': 48.85821, 'lng': 2.39028, 'lignes': '2'},
]


def note_color(note):
    if note >= 4.5: return '#22C55E'  # vert
    if note >= 4.0: return '#F59E0B'  # ambre
    if note >= 3.5: return '#FF5C00'  # orange
    return '#EF4444'  # rouge


# ═══ CARTE 1 — CONCURRENTS ═══
def carte_concurrents():
    m = folium.Map(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        zoom_start=16,
        tiles='CartoDB positron',  # Style clean, pas de pub
        attr='© OpenStreetMap contributors | Satorea CRM',
    )

    # Cercle de rayon 500m
    folium.Circle(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        radius=500,
        color='#2EC6F3',
        fill=True,
        fill_color='#2EC6F3',
        fill_opacity=0.03,
        weight=1.5,
        dash_array='5',
        popup='Rayon 500m',
    ).add_to(m)

    # Cercle 200m
    folium.Circle(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        radius=200,
        color='#FF5C00',
        fill=True,
        fill_color='#FF5C00',
        fill_opacity=0.03,
        weight=1,
        dash_array='5',
        popup='Rayon 200m',
    ).add_to(m)

    # Prospect — gros marqueur orange
    folium.Marker(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        popup=folium.Popup(
            f"<b style='color:#FF5C00;font-size:14px'>{PROSPECT['nom']}</b><br>"
            f"⭐ {PROSPECT['note']}/5 ({PROSPECT['avis']} avis)<br>"
            f"📍 {PROSPECT['adresse']}",
            max_width=250,
        ),
        icon=folium.Icon(color='orange', icon='star', prefix='fa'),
    ).add_to(m)

    # Concurrents
    for c in CONCURRENTS:
        color = 'green' if c['note'] >= 4.5 else 'orange' if c['note'] >= 4.0 else 'red'
        icon_name = 'certificate' if c['note'] >= 4.5 else 'cut' if c['avis'] > 100 else 'circle'

        folium.CircleMarker(
            location=[c['lat'], c['lng']],
            radius=max(4, min(12, c['avis'] / 25)),  # Taille = nb avis
            color=note_color(c['note']),
            fill=True,
            fill_color=note_color(c['note']),
            fill_opacity=0.7,
            weight=2,
            popup=folium.Popup(
                f"<b>{c['nom']}</b><br>"
                f"⭐ {c['note']}/5 ({c['avis']} avis)<br>"
                f"<span style='color:{note_color(c['note'])}'>"
                f"{'Bien note' if c['note'] >= 4.5 else 'Correct' if c['note'] >= 4.0 else 'Faible'}</span>",
                max_width=200,
            ),
        ).add_to(m)

        # Label nom
        folium.Tooltip(f"{c['nom']} ({c['note']}★)", permanent=False).add_to(
            folium.CircleMarker(location=[c['lat'], c['lng']], radius=0).add_to(m)
        )

    # Légende
    legend_html = '''
    <div style="position:fixed;bottom:30px;left:30px;z-index:1000;background:white;
         padding:12px 16px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.15);
         font-family:Calibri,sans-serif;font-size:12px;border:1px solid #E5E7EB">
        <div style="font-weight:bold;margin-bottom:8px;color:#0A0A0A;font-size:13px">Légende</div>
        <div style="margin-bottom:4px">
            <span style="color:#FF5C00;font-size:16px">★</span> Latitude ZEN (prospect)
        </div>
        <div style="margin-bottom:4px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22C55E"></span>
            Note ≥ 4,5
        </div>
        <div style="margin-bottom:4px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#F59E0B"></span>
            Note 4,0 – 4,4
        </div>
        <div style="margin-bottom:4px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#EF4444"></span>
            Note < 4,0
        </div>
        <div style="color:#888;margin-top:6px;font-size:10px">Taille = nombre d'avis</div>
        <div style="color:#888;font-size:10px">Source : Google Places API</div>
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))

    # Titre
    title_html = '''
    <div style="position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:1000;
         background:#0A0A0A;color:white;padding:8px 20px;border-radius:8px;
         font-family:Calibri,sans-serif;font-size:14px;font-weight:bold;
         box-shadow:0 2px 10px rgba(0,0,0,0.3)">
        <span style="color:#FF5C00">SATOREA</span> — 20 concurrents dans 500m autour de Latitude ZEN
    </div>
    '''
    m.get_root().html.add_child(folium.Element(title_html))

    m.save(str(out / 'carte-concurrents.html'))
    print('  carte-concurrents.html')


# ═══ CARTE 2 — TRANSPORTS ═══
def carte_transports():
    m = folium.Map(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        zoom_start=16,
        tiles='CartoDB positron',
    )

    # Prospect
    folium.Marker(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        popup=f"<b>{PROSPECT['nom']}</b>",
        icon=folium.Icon(color='orange', icon='star', prefix='fa'),
    ).add_to(m)

    # Métros
    for metro in METROS:
        folium.Marker(
            location=[metro['lat'], metro['lng']],
            popup=f"<b>Métro {metro['nom']}</b><br>Ligne {metro['lignes']}",
            icon=folium.Icon(color='blue', icon='subway', prefix='fa'),
        ).add_to(m)

        # Ligne vers le prospect
        folium.PolyLine(
            locations=[[PROSPECT['lat'], PROSPECT['lng']], [metro['lat'], metro['lng']]],
            color='#3B82F6',
            weight=2,
            opacity=0.4,
            dash_array='5',
        ).add_to(m)

    # Isochrone 5 min à pied (~400m)
    folium.Circle(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        radius=400,
        color='#22C55E',
        fill=True,
        fill_color='#22C55E',
        fill_opacity=0.04,
        weight=1,
        dash_array='8',
        popup='5 min à pied',
    ).add_to(m)

    title_html = '''
    <div style="position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:1000;
         background:#0A0A0A;color:white;padding:8px 20px;border-radius:8px;
         font-family:Calibri,sans-serif;font-size:14px;font-weight:bold">
        <span style="color:#FF5C00">SATOREA</span> — Transports : 3 métros à moins de 5 min
    </div>
    '''
    m.get_root().html.add_child(folium.Element(title_html))

    m.save(str(out / 'carte-transports.html'))
    print('  carte-transports.html')


# ═══ CARTE 3 — SYNTHÈSE ═══
def carte_synthese():
    m = folium.Map(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        zoom_start=16,
        tiles='CartoDB positron',
    )

    # Zones
    folium.Circle(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        radius=500, color='#FF5C00', fill=True, fill_color='#FF5C00',
        fill_opacity=0.02, weight=1, dash_array='5',
    ).add_to(m)

    # Prospect
    folium.Marker(
        location=[PROSPECT['lat'], PROSPECT['lng']],
        popup=folium.Popup(
            f"<div style='font-family:Calibri;'>"
            f"<b style='color:#FF5C00;font-size:16px'>{PROSPECT['nom']}</b><br>"
            f"⭐ {PROSPECT['note']}/5 ({PROSPECT['avis']} avis)<br>"
            f"📍 {PROSPECT['adresse']}<br>"
            f"<hr style='border-color:#E5E7EB'>"
            f"<b>1 225 avis</b> toutes plateformes<br>"
            f"<b>Note pondérée : 4,78/5</b><br>"
            f"<b>Score Satorea : 64/100</b>"
            f"</div>",
            max_width=280,
        ),
        icon=folium.Icon(color='orange', icon='star', prefix='fa'),
    ).add_to(m)

    # Concurrents
    for c in CONCURRENTS:
        folium.CircleMarker(
            location=[c['lat'], c['lng']],
            radius=max(3, min(10, c['avis'] / 30)),
            color=note_color(c['note']),
            fill=True, fill_color=note_color(c['note']), fill_opacity=0.6, weight=1.5,
            popup=f"<b>{c['nom']}</b><br>{c['note']}★ ({c['avis']} avis)",
        ).add_to(m)

    # Métros
    for metro in METROS:
        folium.Marker(
            location=[metro['lat'], metro['lng']],
            popup=f"Métro {metro['nom']} (L{metro['lignes']})",
            icon=folium.Icon(color='blue', icon='subway', prefix='fa'),
        ).add_to(m)

    # Légende complète
    legend_html = '''
    <div style="position:fixed;bottom:30px;left:30px;z-index:1000;background:white;
         padding:14px 18px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.15);
         font-family:Calibri,sans-serif;font-size:11px;border:1px solid #E5E7EB;max-width:200px">
        <div style="font-weight:bold;margin-bottom:8px;color:#0A0A0A;font-size:14px">
            <span style="color:#FF5C00">SATOREA</span> Carte synthèse
        </div>
        <div style="margin-bottom:6px">
            <span style="color:#FF5C00;font-size:14px">★</span> Latitude ZEN (prospect)
        </div>
        <div style="margin-bottom:4px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22C55E"></span>
            Concurrent ≥ 4,5★
        </div>
        <div style="margin-bottom:4px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F59E0B"></span>
            Concurrent 4,0 – 4,4★
        </div>
        <div style="margin-bottom:4px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#EF4444"></span>
            Concurrent < 4,0★
        </div>
        <div style="margin-bottom:4px">
            <span style="color:#3B82F6;font-size:12px">Ⓜ</span> Station de métro
        </div>
        <div style="color:#888;margin-top:8px;font-size:9px">
            Données : Google Places API<br>
            Fond : OpenStreetMap / CartoDB
        </div>
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))

    title_html = '''
    <div style="position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:1000;
         background:#0A0A0A;color:white;padding:8px 24px;border-radius:8px;
         font-family:Calibri,sans-serif;font-size:14px;font-weight:bold;
         box-shadow:0 2px 12px rgba(0,0,0,0.3)">
        <span style="color:#FF5C00">SATOREA</span> — Latitude ZEN · 20 concurrents · 3 métros · Paris 11e
    </div>
    '''
    m.get_root().html.add_child(folium.Element(title_html))

    m.save(str(out / 'carte-synthese.html'))
    print('  carte-synthese.html')


if __name__ == '__main__':
    print('SATOREA — Cartes réelles OpenStreetMap\n')
    print('Données : Google Places API (20 concurrents, 3 métros)\n')
    carte_concurrents()
    carte_transports()
    carte_synthese()
    print(f'\n3 cartes HTML dans ./charts/')
    print('Ouvrir dans le navigateur pour voir les cartes interactives')
