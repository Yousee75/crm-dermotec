"""
Carte réelle OpenStreetMap avec staticmap (Python)
Vraies rues de Paris + marqueurs concurrents
"""
from staticmap import StaticMap, CircleMarker, Line
from pathlib import Path
import math

out = Path('charts')

# Prospect
P_LAT, P_LNG = 48.858315, 2.383743

# Concurrents réels (Google Places API)
CONCURRENTS = [
    (48.8581, 2.3830), (48.8546, 2.3846), (48.8553, 2.3873),
    (48.8583, 2.3809), (48.8569, 2.3782), (48.8568, 2.3815),
    (48.8588, 2.3833), (48.8570, 2.3868), (48.8559, 2.3827),
    (48.8617, 2.3831), (48.8553, 2.3848), (48.8584, 2.3828),
    (48.8573, 2.3814), (48.8565, 2.3811),
]

# Métros réels
METROS = [
    (48.8584, 2.3793),  # Voltaire
    (48.8547, 2.3855),  # Charonne
    (48.8582, 2.3903),  # Philippe Auguste
]

# Créer la carte
m = StaticMap(900, 600, url_template='https://tile.openstreetmap.org/{z}/{x}/{y}.png')

# Cercle 500m (approximation avec des points)
for i in range(60):
    a = math.radians(i * 6)
    lat = P_LAT + 0.0045 * math.sin(a)
    lng = P_LNG + 0.0065 * math.cos(a)
    m.add_marker(CircleMarker((lng, lat), '#2EC6F3', 2))

# Concurrents — points rouges
for lat, lng in CONCURRENTS:
    m.add_marker(CircleMarker((lng, lat), '#EF4444', 8))

# Métros — points bleus
for lat, lng in METROS:
    m.add_marker(CircleMarker((lng, lat), '#3B82F6', 10))

# Prospect — gros point orange
m.add_marker(CircleMarker((P_LNG, P_LAT), '#FF5C00', 16))

# Rendu
image = m.render(zoom=16)
image.save(str(out / 's-carte-reelle.png'))
print(f'Carte generee : {out / "s-carte-reelle.png"}')
print(f'Taille : {(out / "s-carte-reelle.png").stat().st_size // 1024} KB')
