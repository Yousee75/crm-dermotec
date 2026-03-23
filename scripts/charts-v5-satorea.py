"""
SATOREA V5 — Graphiques palette OFFICIELLE
Orange #FF5C00 / Rose #FF2D78 / Noir #1A1A1A / Papier #FAF8F5
ZÉRO bleu, violet, cyan, teal — INTERDIT

Données VÉRIFIÉES Latitude Zen (browser + APIs)
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe
import numpy as np
from pathlib import Path
import math

# ═══ PALETTE SATOREA OFFICIELLE ═══
OR = '#FF5C00'       # Primary, CTA, énergie
ORL = '#FF8C42'      # Hover, warning, nuance
RS = '#FF2D78'       # Accent, attention, beauté
RSL = '#FF6BA8'      # Rose clair
BK = '#1A1A1A'       # Noir texte
GR2 = '#3A3A3A'      # Gris secondaire
GR = '#888888'        # Gris discret
BORDER = '#EEEEEE'   # Bordures
PAPIER = '#FAF8F5'    # Fond papier
W = '#FFFFFF'         # Cards
GN = '#10B981'        # Seul vert autorisé (success)

# Dimensions scoring — palette Satorea UNIQUEMENT
DIM_C = [GN, OR, RS, ORL, BK]  # Réputation=vert, Présence=orange, Activité=rose, Financier=orangeL, Quartier=noir
DIM_L = ['Réputation', 'Présence', 'Activité', 'Financier', 'Quartier']

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Segoe UI', 'Calibri', 'Arial'],
    'figure.facecolor': W,
    'axes.facecolor': W,
    'text.color': BK,
})
out = Path('charts')
out.mkdir(exist_ok=True)

# ═══ DONNÉES VÉRIFIÉES ═══
SCORES = [82, 68, 45, 42, 72]
GLOBAL = 64
AVG = [50, 50, 50, 50, 50]

def footer(fig):
    fig.text(0.98, 0.005, 'Satorea CRM', ha='right', va='bottom', fontsize=6, color=GR, style='italic')

# ═══ 1. GAUGE ═══
def gauge():
    fig, ax = plt.subplots(figsize=(5, 3.2))
    ax.set_xlim(-1.3,1.3); ax.set_ylim(-0.3,1.3); ax.set_aspect('equal'); ax.axis('off')
    for i in range(180):
        a=math.radians(i); r=1.0
        x1,y1=r*math.cos(math.pi-a),r*math.sin(math.pi-a)
        x2,y2=(r-.15)*math.cos(math.pi-a),(r-.15)*math.sin(math.pi-a)
        c=RS if i<54 else ORL if i<108 else GN
        ax.plot([x1,x2],[y1,y2],color=c,lw=3,alpha=0.12,solid_capstyle='round')
    for i in range(int(GLOBAL/100*180)):
        a=math.radians(i); r=1.0
        x1,y1=r*math.cos(math.pi-a),r*math.sin(math.pi-a)
        x2,y2=(r-.15)*math.cos(math.pi-a),(r-.15)*math.sin(math.pi-a)
        c=RS if i<54 else ORL if i<108 else GN
        ax.plot([x1,x2],[y1,y2],color=c,lw=3,solid_capstyle='round')
    na=math.radians(GLOBAL/100*180)
    ax.annotate('',xy=(.75*math.cos(math.pi-na),.75*math.sin(math.pi-na)),xytext=(0,0),arrowprops=dict(arrowstyle='->',color=BK,lw=2.5))
    ax.plot(0,0,'o',color=BK,markersize=8,zorder=5)
    sc=GN if GLOBAL>=60 else ORL
    ax.text(0,0.35,str(GLOBAL),ha='center',va='center',fontsize=38,fontweight='bold',color=sc)
    ax.text(0,0.15,'/100',ha='center',fontsize=12,color=GR)
    ax.text(-1.15,-0.15,'FROID',fontsize=7,color=RS,ha='center',fontweight='bold')
    ax.text(0,1.12,'TIÈDE',fontsize=7,color=ORL,ha='center',fontweight='bold')
    ax.text(1.15,-0.15,'CHAUD',fontsize=7,color=GN,ha='center',fontweight='bold')
    ax.text(0,-0.22,f'CHAUD — {GLOBAL}/100',ha='center',fontsize=10,fontweight='bold',color=GN,
            bbox=dict(boxstyle='round,pad=0.4',facecolor=GN+'15',edgecolor=GN,lw=1))
    footer(fig)
    plt.tight_layout()
    plt.savefig(out/'v5-gauge.png',dpi=250,bbox_inches='tight',facecolor=W)
    plt.close()
    print('  v5-gauge')

# ═══ 2. RADAR ═══
def radar():
    fig, ax = plt.subplots(figsize=(7,7),subplot_kw=dict(polar=True))
    N=5; angles=[n/float(N)*2*math.pi for n in range(N)]+[0]
    vals=SCORES+SCORES[:1]; avg=AVG+AVG[:1]
    ax.set_theta_offset(math.pi/2); ax.set_theta_direction(-1); ax.set_rmax(100)
    ax.set_rticks([25,50,75,100]); ax.set_yticklabels(['','50','75',''],fontsize=7,color=BORDER)
    ax.spines['polar'].set_visible(False); ax.grid(color=BORDER,lw=0.6)
    ax.set_xticks(angles[:-1]); ax.set_xticklabels(DIM_L,fontsize=12,fontweight='bold',color=BK)

    # Moyenne secteur — rose pointillé
    ax.fill(angles,avg,color=RS,alpha=0.03)
    ax.plot(angles,avg,'--',color=RS,lw=1.5,alpha=0.25,label='Moyenne secteur')

    # Prospect — orange plein
    for am in [0.02,0.05,0.08]: ax.fill(angles,[v*(1-am*3) for v in vals],color=OR,alpha=am)
    ax.plot(angles,vals,color=OR,lw=3,label='Latitude Zen')

    insights=['4,4 Google\n300 avis','Site+Planity\n+Insta+FB','Insta actif\n276 posts','CA non\ncommuniqué','Léon Frot\n3 métros']
    for i,(a,v) in enumerate(zip(angles[:-1],SCORES)):
        ax.plot(a,v,'o',color=DIM_C[i],markersize=12,zorder=5,markeredgecolor=W,markeredgewidth=2.5)
        ax.text(a,v,f' {v}',fontsize=11,fontweight='bold',color=DIM_C[i],va='center',
                path_effects=[pe.withStroke(linewidth=3,foreground=W)])
        ax.text(a,min(v+18,105),insights[i],fontsize=6.5,color=GR2,ha='center',va='center',style='italic',
                bbox=dict(boxstyle='round,pad=0.2',facecolor=W,edgecolor=BORDER,lw=0.5,alpha=0.9))

    ax.legend(loc='lower right',bbox_to_anchor=(1.2,-0.05),fontsize=9,frameon=True,facecolor=W,edgecolor=BORDER)
    fig.suptitle('Réputation excellente (82) mais finances opaques (42)',fontsize=11,fontweight='bold',color=BK,y=0.99)
    fig.text(0.5,0.01,'Instagram actif (276 posts) mais engagement faible (378 followers)',ha='center',fontsize=9,color=OR,fontweight='bold',style='italic')
    footer(fig)
    plt.tight_layout(rect=[0,0.04,1,0.96])
    plt.savefig(out/'v5-radar.png',dpi=250,bbox_inches='tight',facecolor=W)
    plt.close()
    print('  v5-radar')

# ═══ 3. MULTI-PLATEFORMES ═══
def multiplateforme():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), gridspec_kw={'width_ratios': [1.3, 1]})

    platforms = ['Planity', 'Google', 'Treatwell', 'Facebook', 'Petit Futé', 'Tripadvisor']
    notes = [4.9, 4.4, 5.0, 4.8, 4.7, 2.7]
    avis = [729, 300, 164, 23, 3, 6]
    colors_p = [OR, ORL, GN, GR2, GN, RS]  # Pas de bleu !

    y = np.arange(len(platforms))
    bars = ax1.barh(y, notes, height=0.55, color=colors_p, zorder=3, alpha=0.8)
    ax1.axvline(x=4.78, color=OR, linewidth=2, linestyle='-', alpha=0.3)
    ax1.text(4.78, len(platforms)-0.3, '4,78\nmoyenne', fontsize=7, color=OR, ha='center', fontweight='bold')
    ax1.set_yticks(y); ax1.set_yticklabels(platforms, fontsize=10, fontweight='bold', color=BK)
    ax1.set_xlim(0, 5.5)
    for bar, note, count, color in zip(bars, notes, avis, colors_p):
        if note > 0:
            ax1.text(note+0.08, bar.get_y()+bar.get_height()/2, f'{note}/5  ({count})', va='center', fontsize=9, fontweight='bold', color=color)
    ax1.spines['top'].set_visible(False); ax1.spines['right'].set_visible(False); ax1.spines['left'].set_visible(False)
    ax1.tick_params(left=False); ax1.grid(axis='x', color=BORDER, lw=0.3, zorder=1)
    ax1.set_title('Notes par plateforme', fontsize=11, fontweight='bold', color=BK, loc='left')

    # Pie
    ax2.axis('off')
    sizes = [729, 300, 164, 23, 6, 3]
    labels_pie = ['Planity\n729', 'Google\n300', 'Treatwell\n164', 'FB\n23', 'Trip.\n6', 'PF\n3']
    colors_pie = [OR, ORL, GN, GR2, RS, GR]
    wedges, texts = ax2.pie(sizes, labels=labels_pie, colors=colors_pie, startangle=90,
                             wedgeprops=dict(width=0.6, edgecolor=W, linewidth=2),
                             textprops=dict(fontsize=8, fontweight='bold', color=BK))
    ax2.text(0, 0, '1 225\navis', ha='center', va='center', fontsize=18, fontweight='bold', color=OR)
    ax2.set_title('Répartition', fontsize=11, fontweight='bold', color=BK)

    fig.suptitle('1 225 avis sur 6 plateformes — note pondérée 4,78/5', fontsize=12, fontweight='bold', color=BK, y=0.99)
    fig.text(0.5, 0.01, 'Planity = plateforme principale (59%)  |  Tripadvisor 2,7 = non représentatif (6 avis)', ha='center', fontsize=8, color=OR, fontweight='bold', style='italic')
    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out/'v5-multiplateforme.png', dpi=250, bbox_inches='tight', facecolor=W)
    plt.close()
    print('  v5-multiplateforme')

# ═══ 4. GOOGLE DÉTAIL ═══
def google_detail():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4), gridspec_kw={'width_ratios': [1.2, 1]})
    stars = [5,4,3,2,1]; counts = [226,32,5,5,32]; pcts = [75,11,2,2,11]
    cm = {5:GN, 4:GN, 3:ORL, 2:OR, 1:RS}
    colors = [cm[s] for s in stars]
    bars = ax1.barh(range(len(stars)), pcts, height=0.6, color=colors, zorder=3)
    ax1.set_yticks(range(len(stars))); ax1.set_yticklabels([f'{s} {"*"*s}' for s in stars], fontsize=10, fontweight='bold', color=BK)
    ax1.set_xlim(0, 100)
    for b, pc, ct in zip(bars, pcts, counts):
        ax1.text(pc+2, b.get_y()+b.get_height()/2, f'{pc}% ({ct})', va='center', fontsize=9, color=GR)
    ax1.spines['top'].set_visible(False); ax1.spines['right'].set_visible(False); ax1.spines['left'].set_visible(False)
    ax1.tick_params(left=False); ax1.grid(axis='x', color=BORDER, lw=0.3, zorder=1)
    ax1.text(70, 4.3, '4,4', fontsize=36, fontweight='bold', color=OR, ha='center')
    ax1.text(85, 4.3, '/5', fontsize=14, color=GR, ha='left', va='center')
    ax1.set_title('Google Maps — 300 avis', fontsize=11, fontweight='bold', color=BK, loc='left')

    ax2.axis('off')
    themes = [('esthéticienne',27,OR),('épilation',24,ORL),('soins',11,GN),('soin visage',8,RS),('cire',8,ORL),('équipe',7,GN),('professionnalisme',6,GR2),('manucure',5,GR)]
    ax2.text(0.5, 0.98, 'Thèmes les plus mentionnés', ha='center', va='top', fontsize=10, fontweight='bold', color=BK, transform=ax2.transAxes)
    for i, (theme, count, color) in enumerate(themes):
        y = 0.85 - i * 0.11
        bar_w = count / 30 * 0.6
        ax2.add_patch(mpatches.FancyBboxPatch((0.05, y-0.025), bar_w, 0.05, boxstyle="round,pad=0.01", facecolor=color+'30', edgecolor=color, linewidth=1, transform=ax2.transAxes, zorder=3))
        ax2.text(0.05+bar_w+0.03, y, f'{theme} ({count})', ha='left', va='center', fontsize=8, color=color, fontweight='bold', transform=ax2.transAxes)

    fig.suptitle('75% de 5 étoiles — "esthéticienne" et "épilation" en tête', fontsize=11, fontweight='bold', color=BK, y=0.99)
    fig.text(0.5, 0.01, '32 avis 1 étoile (11%) = bons cadeaux + alternantes, PAS la qualité des soins', ha='center', fontsize=8, color=RS, fontweight='bold', style='italic')
    footer(fig)
    plt.tight_layout(rect=[0, 0.04, 1, 0.96])
    plt.savefig(out/'v5-google-detail.png', dpi=250, bbox_inches='tight', facecolor=W)
    plt.close()
    print('  v5-google-detail')

# ═══ 5. WATERFALL ROI ═══
def waterfall():
    fig, ax = plt.subplots(figsize=(8, 4.5))
    cats = ['CA actuel\nmensuel','Microblading\n+3 200','Full Lips\n+1 800','CA total\nmensuel','CA total\nannuel']
    vals = [13000,3200,1800,18000,216000]
    bottoms = [0,13000,16200,0,0]
    colors = [GR,OR,RS,GN,GN]
    totals = [False,False,False,True,True]
    for i,(c,v,b,cl,tot) in enumerate(zip(cats,vals,bottoms,colors,totals)):
        if tot: ax.bar(i,v,width=0.6,color=cl+'30',edgecolor=cl,lw=2,zorder=3)
        else: ax.bar(i,v,bottom=b,width=0.6,color=cl+'CC',edgecolor=cl,lw=1.5,zorder=3)
        y_t=(b+v) if not tot else v
        ax.text(i,y_t+2500,f'{v:,} EUR'.replace(',', ' '),ha='center',va='bottom',fontsize=10,fontweight='bold',color=cl)
    ax.set_xticks(range(len(cats))); ax.set_xticklabels(cats,fontsize=9,fontweight='bold',color=BK)
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
    ax.grid(axis='y',color=BORDER,lw=0.3,zorder=1)
    ax.annotate('+38% CA\nannuel',xy=(4,216000),xytext=(4,240000),fontsize=11,fontweight='bold',color=GN,ha='center',
                bbox=dict(boxstyle='round,pad=0.4',facecolor=GN+'15',edgecolor=GN,lw=1.5))
    fig.suptitle('+5 000 EUR/mois — décomposition du gain',fontsize=12,fontweight='bold',color=BK,y=0.98)
    fig.text(0.5,0.01,'Investissement : 0 EUR (OPCO)  |  Remboursement : 2 semaines',ha='center',fontsize=9,color=OR,fontweight='bold',style='italic')
    footer(fig)
    plt.tight_layout(rect=[0,0.04,1,0.95])
    plt.savefig(out/'v5-waterfall.png',dpi=250,bbox_inches='tight',facecolor=W)
    plt.close()
    print('  v5-waterfall')

# ═══ 6. PARCOURS ═══
def parcours():
    fig, ax = plt.subplots(figsize=(9,3))
    ax.set_xlim(-0.5,10.5); ax.set_ylim(-1.5,2); ax.axis('off')
    ax.plot([-0.3,9.5],[0.5,0.5],color=BORDER,lw=3,zorder=1,solid_capstyle='round')
    steps = [
        (0,'Appel\ntél.',  'J0',OR,True),(1.5,'SMS +\ncatalogue','J+1',ORL,False),
        (3,'Email\navant/après','J+1',GR2,False),(4.5,'Rappel','J+3',RS,True),
        (6,'Visite\nsalon','J+7',OR,True),(7.5,'Témoignage','J+14',GN,False),
        (9,'Inscription','J+30',GN,True),
    ]
    for idx,(x,label,timing,color,key) in enumerate(steps):
        sz=14 if key else 10
        ax.plot(x,0.5,'o',color=color,markersize=sz,zorder=4,markeredgecolor=W,markeredgewidth=2)
        y_l=1.4 if idx%2==0 else -0.6
        ax.text(x,y_l,label,ha='center',va='center',fontsize=8,fontweight='bold',color=BK,
                bbox=dict(boxstyle='round,pad=0.3',facecolor=color+'10',edgecolor=color,lw=1))
        ax.plot([x,x],[0.5+(0.15 if y_l>0 else -0.15),y_l+(-0.25 if y_l>0 else 0.25)],color=color,lw=1,linestyle=':',alpha=0.5)
        ax.text(x,0.15 if y_l>0 else 0.85,timing,ha='center',fontsize=7,color=GR,fontweight='bold')
    fig.suptitle('Du premier appel à l\'inscription — 5 semaines',fontsize=12,fontweight='bold',color=BK,y=0.98)
    footer(fig)
    plt.tight_layout()
    plt.savefig(out/'v5-parcours.png',dpi=250,bbox_inches='tight',facecolor=W)
    plt.close()
    print('  v5-parcours')

# ═══ 7. AVANT/APRÈS ═══
def avant_apres():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4))
    cats = ['CA\nmensuel','Panier\nmoyen','Prestations\npremium','Contenu\nInstagram','Marge']
    avant = [13000,62,0,3,8]; apres = [18000,225,3,15,20]
    x = np.arange(len(cats)); w = 0.35
    ax1.bar(x-w/2, avant, w, color=GR, label="Aujourd'hui", zorder=3)
    ax1.bar(x+w/2, apres, w, color=OR+'CC', label='Avec microblading', zorder=3, edgecolor=OR, lw=1)
    ax1.set_xticks(x); ax1.set_xticklabels(cats, fontsize=8, fontweight='bold', color=BK)
    ax1.spines['top'].set_visible(False); ax1.spines['right'].set_visible(False)
    ax1.grid(axis='y', color=BORDER, lw=0.3, zorder=1)
    ax1.legend(fontsize=8, loc='upper left', frameon=True, facecolor=W, edgecolor=BORDER)
    ax1.set_title('Impact mesurable', fontsize=11, fontweight='bold', color=BK, loc='left')
    for i,(a,b) in enumerate(zip(avant,apres)):
        if b>a:
            d=f'+{b-a:,.0f}'.replace(',', ' ') if a>100 else f'+{b-a:.0f}'
            ax1.text(i+w/2,b+max(avant)*0.03,d,ha='center',fontsize=8,fontweight='bold',color=OR)

    ax2.axis('off')
    kpis = [('+38%','CA annuel',OR),('x3.6','Panier moyen',RS),('2 sem.','Remboursement',GN),('0 EUR','Coût formation',GN)]
    for i,(v,l,c) in enumerate(kpis):
        row=i//2; col=i%2; xp=0.15+col*0.5; yp=0.75-row*0.45
        ax2.text(xp,yp,v,ha='center',va='center',fontsize=28,fontweight='bold',color=c,transform=ax2.transAxes)
        ax2.text(xp,yp-0.12,l,ha='center',va='center',fontsize=9,color=GR,transform=ax2.transAxes)
    ax2.text(0.5,0.98,'Chiffres clés',ha='center',va='top',fontsize=11,fontweight='bold',color=BK,transform=ax2.transAxes)

    fig.suptitle('Avant / Après : +5 000 EUR/mois, panier moyen x3.6',fontsize=12,fontweight='bold',color=BK,y=0.99)
    footer(fig)
    plt.tight_layout(rect=[0,0,1,0.95])
    plt.savefig(out/'v5-avant-apres.png',dpi=250,bbox_inches='tight',facecolor=W)
    plt.close()
    print('  v5-avant-apres')

# ═══ MAIN ═══
if __name__ == '__main__':
    print('SATOREA V5 — Palette OFFICIELLE Orange/Rose/Noir\n')
    gauge()
    radar()
    multiplateforme()
    google_detail()
    waterfall()
    parcours()
    avant_apres()
    n = len(list(out.glob('v5-*.png')))
    print(f'\n{n} graphiques V5 dans ./charts/')
    print('Palette : Orange #FF5C00 / Rose #FF2D78 / Noir #1A1A1A / Vert #10B981')
    print('ZÉRO bleu, violet, cyan.')
