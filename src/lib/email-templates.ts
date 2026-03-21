// ============================================================
// CRM DERMOTEC — Design System Email
// Inspiré de Qonto (clean, minimal) + Alan (chaleureux, accessible)
// Compatible dark mode, mobile-first, RGAA accessible
// ============================================================

// --- Design tokens ---

const COLORS = {
  primary: '#2EC6F3',
  primaryDark: '#1BA8D4',
  accent: '#082545',
  white: '#FFFFFF',
  bg: '#F8FAFC',
  bgCard: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',
  error: '#EF4444',
  whatsapp: '#25D366',
}

// --- Layout components ---

function layout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Dermotec Advanced</title>
  ${preheader ? `<!--[if !mso]><!--><span style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}</span><!--<![endif]-->` : ''}
  <style>
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0F172A !important; }
      .email-card { background-color: #1E293B !important; border-color: #334155 !important; }
      .email-text { color: #E2E8F0 !important; }
      .email-text-secondary { color: #94A3B8 !important; }
      .email-text-muted { color: #64748B !important; }
      .email-info-box { background-color: #1E3A5F !important; border-color: #2563EB !important; }
      .email-success-box { background-color: #064E3B !important; border-color: #059669 !important; }
      .email-warning-box { background-color: #451A03 !important; border-color: #D97706 !important; }
    }
    @media only screen and (max-width: 600px) {
      .email-container { padding: 12px !important; }
      .email-card { padding: 20px !important; }
      .email-btn { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased" class="email-bg">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px" class="email-container" role="article" aria-label="Email Dermotec">
    <!-- Header -->
    <div style="background:${COLORS.accent};padding:24px 32px;border-radius:16px 16px 0 0;text-align:center">
      <h1 style="color:${COLORS.primary};font-size:22px;margin:0;font-weight:700;letter-spacing:-0.3px">DERMOTEC</h1>
      <p style="color:${COLORS.textMuted};font-size:11px;margin:6px 0 0;text-transform:uppercase;letter-spacing:1.5px">Centre de Formation Certifié Qualiopi</p>
    </div>

    <!-- Body -->
    <div style="background:${COLORS.bgCard};padding:32px;border-radius:0 0 16px 16px;border:1px solid ${COLORS.border};border-top:none" class="email-card">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0 0">
      <p style="color:${COLORS.textMuted};font-size:12px;margin:0 0 8px;line-height:1.5" class="email-text-muted">
        Dermotec Advanced — 75 Bd Richard Lenoir, 75011 Paris
      </p>
      <p style="color:${COLORS.textMuted};font-size:12px;margin:0 0 12px" class="email-text-muted">
        01 88 33 43 43 — dermotec.fr@gmail.com
      </p>
      <div style="margin:0 0 8px">
        <a href="https://wa.me/33188334343" style="display:inline-block;margin:0 6px;color:${COLORS.textMuted};font-size:12px;text-decoration:none">WhatsApp</a>
        <span style="color:${COLORS.border}">·</span>
        <a href="https://www.instagram.com/dermotec_advanced" style="display:inline-block;margin:0 6px;color:${COLORS.textMuted};font-size:12px;text-decoration:none">Instagram</a>
        <span style="color:${COLORS.border}">·</span>
        <a href="https://www.dermotec.fr" style="display:inline-block;margin:0 6px;color:${COLORS.textMuted};font-size:12px;text-decoration:none">Site web</a>
      </div>
      <p style="color:${COLORS.textMuted};font-size:11px;margin:0" class="email-text-muted">
        Vous recevez cet email car vous avez contacté Dermotec Advanced.
      </p>
    </div>
  </div>
</body>
</html>`
}

// --- Atomic components ---

function heading(text: string): string {
  return `<h2 style="color:${COLORS.accent};font-size:22px;font-weight:700;margin:0 0 8px;line-height:1.3;letter-spacing:-0.3px" class="email-text">${text}</h2>`
}

function subheading(text: string): string {
  return `<h3 style="color:${COLORS.accent};font-size:16px;font-weight:600;margin:20px 0 8px;line-height:1.3" class="email-text">${text}</h3>`
}

function paragraph(text: string): string {
  return `<p style="color:${COLORS.text};font-size:15px;line-height:1.7;margin:0 0 16px" class="email-text">${text}</p>`
}

function smallText(text: string): string {
  return `<p style="color:${COLORS.textSecondary};font-size:13px;line-height:1.6;margin:0 0 12px" class="email-text-secondary">${text}</p>`
}

function button(text: string, url: string, color?: string): string {
  const bg = color || COLORS.primary
  return `<div style="text-align:center;margin:28px 0">
  <a href="${url}" style="display:inline-block;background:${bg};color:${COLORS.white};padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;line-height:1;letter-spacing:0.2px" class="email-btn">${text}</a>
</div>`
}

function secondaryButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:16px 0">
  <a href="${url}" style="display:inline-block;background:transparent;color:${COLORS.primary};padding:12px 24px;border:2px solid ${COLORS.primary};border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;line-height:1" class="email-btn">${text}</a>
</div>`
}

function infoBox(content: string, variant: 'info' | 'success' | 'warning' = 'info'): string {
  const colors = {
    info: { bg: COLORS.infoBg, border: COLORS.infoBorder, css: 'email-info-box' },
    success: { bg: COLORS.successBg, border: COLORS.successBorder, css: 'email-success-box' },
    warning: { bg: COLORS.warningBg, border: COLORS.warningBorder, css: 'email-warning-box' },
  }
  const c = colors[variant]
  return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:12px;padding:20px;margin:20px 0" class="${c.css}">${content}</div>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${COLORS.border};margin:24px 0">`
}

function listItem(icon: string, text: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;vertical-align:top;font-size:16px">${icon}</td><td style="padding:4px 0;color:${COLORS.text};font-size:14px;line-height:1.6" class="email-text">${text}</td></tr>`
}

function iconList(items: { icon: string; text: string }[]): string {
  return `<table role="presentation" style="margin:16px 0" cellpadding="0" cellspacing="0">${items.map(i => listItem(i.icon, i.text)).join('')}</table>`
}

function signature(name?: string): string {
  return `<div style="margin-top:24px;padding-top:20px;border-top:1px solid ${COLORS.border}">
  ${paragraph(`À très vite,`)}
  <p style="color:${COLORS.accent};font-size:15px;font-weight:600;margin:0" class="email-text">${name || "L'équipe Dermotec"}</p>
  <p style="color:${COLORS.textMuted};font-size:12px;margin:4px 0 0" class="email-text-muted">Centre de Formation Esthétique Certifié Qualiopi</p>
</div>`
}

// ============================================================
// TEMPLATES — 9 séquences automatisées
// ============================================================

export function emailBienvenue(data: {
  prenom: string
  formation_nom?: string
  portail_url?: string
}) {
  return {
    subject: `Bienvenue chez Dermotec, ${data.prenom} !`,
    html: layout([
      heading(`Bonjour ${data.prenom} !`),
      paragraph(`Merci pour votre intérêt pour <strong>${data.formation_nom || 'nos formations en esthétique'}</strong>. Nous sommes ravies de vous accompagner dans votre projet.`),
      paragraph(`Une conseillère vous contactera sous <strong>24 heures</strong> pour répondre à vos questions et vous aider à trouver la formation idéale.`),
      infoBox([
        `<p style="margin:0 0 4px;font-weight:600;color:${COLORS.accent}" class="email-text">En attendant, découvrez :</p>`,
        iconList([
          { icon: '📋', text: 'Le programme complet de la formation' },
          { icon: '💰', text: 'Les options de financement (OPCO, CPF, France Travail)' },
          { icon: '⭐', text: 'Les avis de nos +500 stagiaires (4.9/5 sur Google)' },
        ]),
      ].join(''), 'info'),
      button('Nous écrire sur WhatsApp', 'https://wa.me/33188334343', COLORS.whatsapp),
      signature(),
    ].join(''), `${data.prenom}, bienvenue chez Dermotec — nous vous contactons sous 24h`),
  }
}

export function emailConfirmationInscription(data: {
  prenom: string
  formation_nom: string
  dates: string
  horaires: string
  lieu?: string
  montant?: string
  portail_url?: string
}) {
  return {
    subject: `Inscription confirmée — ${data.formation_nom}`,
    html: layout([
      heading(`Félicitations ${data.prenom} ! 🎉`),
      paragraph(`Votre inscription à <strong>${data.formation_nom}</strong> est confirmée. Nous avons hâte de vous accueillir.`),
      infoBox([
        iconList([
          { icon: '📚', text: `<strong>${data.formation_nom}</strong>` },
          { icon: '📅', text: data.dates },
          { icon: '⏰', text: data.horaires },
          { icon: '📍', text: data.lieu || '75 Bd Richard Lenoir, 75011 Paris' },
          ...(data.montant ? [{ icon: '💳', text: data.montant }] : []),
        ]),
      ].join(''), 'success'),
      paragraph(`Vous recevrez une <strong>convocation détaillée</strong> 7 jours avant le début de la formation avec toutes les informations pratiques.`),
      data.portail_url ? button('Accéder à mon espace stagiaire', data.portail_url) : '',
      signature(),
    ].join(''), `${data.prenom}, votre inscription à ${data.formation_nom} est confirmée`),
  }
}

export function emailConvocationJ7(data: {
  prenom: string
  formation_nom: string
  date_debut: string
  date_fin: string
  horaires: string
  formatrice?: string
}) {
  return {
    subject: `J-7 — Votre formation ${data.formation_nom} approche !`,
    html: layout([
      heading(`Plus que 7 jours, ${data.prenom} !`),
      paragraph(`Votre formation commence bientôt. Voici tout ce que vous devez savoir.`),
      infoBox([
        iconList([
          { icon: '📚', text: `<strong>${data.formation_nom}</strong>` },
          { icon: '📅', text: `Du ${data.date_debut} au ${data.date_fin}` },
          { icon: '⏰', text: data.horaires },
          { icon: '📍', text: '75 Bd Richard Lenoir, 75011 Paris' },
          { icon: '🚇', text: 'Métro Oberkampf ou Richard-Lenoir' },
          ...(data.formatrice ? [{ icon: '👩‍🏫', text: `Formatrice : ${data.formatrice}` }] : []),
        ]),
      ].join(''), 'info'),
      subheading('À apporter'),
      iconList([
        { icon: '🪪', text: 'Pièce d\'identité' },
        { icon: '📝', text: 'De quoi prendre des notes' },
        { icon: '👕', text: 'Tenue confortable' },
      ]),
      subheading('Le matériel est fourni'),
      paragraph(`Tout le matériel pédagogique est fourni par Dermotec. Vous n'avez rien à acheter avant la formation.`),
      button('Voir le plan d\'accès', 'https://maps.google.com/?q=75+Boulevard+Richard+Lenoir+75011+Paris'),
      signature(),
    ].join(''), `${data.prenom}, votre formation ${data.formation_nom} dans 7 jours — infos pratiques`),
  }
}

export function emailRappelJ1(data: {
  prenom: string
  formation_nom: string
  horaire_debut: string
}) {
  return {
    subject: `C'est demain ! — ${data.formation_nom}`,
    html: layout([
      heading(`C'est demain, ${data.prenom} ! 🌟`),
      paragraph(`On a hâte de vous accueillir demain matin pour <strong>${data.formation_nom}</strong>.`),
      infoBox([
        iconList([
          { icon: '⏰', text: `Arrivée à <strong>${data.horaire_debut}</strong>` },
          { icon: '📍', text: '<strong>75 Bd Richard Lenoir, 75011 Paris</strong>' },
          { icon: '🪪', text: 'N\'oubliez pas votre pièce d\'identité' },
        ]),
      ].join(''), 'warning'),
      paragraph(`Si vous avez un empêchement de dernière minute, prévenez-nous au <strong>01 88 33 43 43</strong>.`),
      paragraph(`Passez une bonne soirée et à demain !`),
      signature(),
    ].join(''), `${data.prenom}, c'est demain — ${data.formation_nom} à ${data.horaire_debut}`),
  }
}

export function emailSatisfactionNPS(data: {
  prenom: string
  formation_nom: string
  portail_url: string
}) {
  return {
    subject: `${data.prenom}, votre avis compte !`,
    html: layout([
      heading(`Bravo ${data.prenom} ! 🎓`),
      paragraph(`Vous venez de terminer <strong>${data.formation_nom}</strong>. Félicitations !`),
      paragraph(`Votre avis est précieux pour nous améliorer. Cela prend <strong>2 minutes</strong>.`),
      button('Donner mon avis', data.portail_url),
      divider(),
      smallText(`Vos retours nous aident à maintenir notre certification Qualiopi et à offrir la meilleure formation possible.`),
      signature(),
    ].join(''), `${data.prenom}, donnez votre avis sur ${data.formation_nom} — 2 minutes`),
  }
}

export function emailCertificat(data: {
  prenom: string
  formation_nom: string
  certificat_numero: string
  portail_url: string
  duree_heures: number
  taux_presence: number
}) {
  return {
    subject: `Votre certificat Dermotec — ${data.formation_nom}`,
    html: layout([
      heading(`Votre certificat est prêt ! 🏆`),
      paragraph(`${data.prenom}, félicitations pour avoir complété avec succès <strong>${data.formation_nom}</strong>.`),
      infoBox([
        iconList([
          { icon: '📜', text: `Certificat n° <strong>${data.certificat_numero}</strong>` },
          { icon: '⏱️', text: `${data.duree_heures} heures de formation` },
          { icon: '✅', text: `Taux de présence : ${data.taux_presence}%` },
        ]),
      ].join(''), 'success'),
      paragraph(`Votre certificat et votre attestation de fin de formation sont disponibles dans votre espace stagiaire.`),
      button('Télécharger mon certificat', data.portail_url),
      divider(),
      subheading('Et maintenant ?'),
      paragraph(`Vous êtes désormais prête à proposer cette prestation à vos clientes. Voici quelques ressources pour vous lancer :`),
      iconList([
        { icon: '📖', text: 'Guide "Lancer votre activité" (dans votre espace)' },
        { icon: '🛒', text: '<a href="https://www.dermotec.fr" style="color:#2EC6F3">Matériel NPM professionnel</a> sur notre e-shop' },
        { icon: '👥', text: 'Rejoignez notre communauté alumni sur WhatsApp' },
      ]),
      signature(),
    ].join(''), `${data.prenom}, votre certificat Dermotec est prêt — téléchargez-le`),
  }
}

export function emailUpsellJ30(data: {
  prenom: string
  formation_completee: string
  formation_suggeree: string
  prix_suggeree: number
  url_inscription: string
}) {
  return {
    subject: `${data.prenom}, prête pour la suite ?`,
    html: layout([
      heading(`1 mois déjà, ${data.prenom} !`),
      paragraph(`Ça fait déjà un mois que vous avez terminé <strong>${data.formation_completee}</strong>. Comment ça se passe ?`),
      paragraph(`Beaucoup de nos stagiaires complètent leur expertise avec une formation complémentaire. Voici notre recommandation pour vous :`),
      infoBox([
        `<p style="font-weight:700;color:${COLORS.accent};font-size:16px;margin:0 0 8px" class="email-text">${data.formation_suggeree}</p>`,
        `<p style="color:${COLORS.primary};font-size:20px;font-weight:700;margin:0 0 4px">${data.prix_suggeree}€ HT</p>`,
        `<p style="color:${COLORS.textSecondary};font-size:13px;margin:0" class="email-text-secondary">ou 3x ${Math.round(data.prix_suggeree / 3)}€ sans frais avec Alma</p>`,
      ].join(''), 'info'),
      button('Découvrir cette formation', data.url_inscription),
      divider(),
      paragraph(`💡 <strong>Astuce :</strong> En combinant plusieurs compétences, vous augmentez votre CA moyen par cliente de 40 à 60%.`),
      signature(),
    ].join(''), `${data.prenom}, formation complémentaire recommandée après ${data.formation_completee}`),
  }
}

export function emailRelanceFinancement(data: {
  prenom: string
  organisme: string
  formation_nom: string
  jours_depuis: number
}) {
  return {
    subject: `Des nouvelles de votre dossier ${data.organisme} ?`,
    html: layout([
      heading(`Suivi de votre financement`),
      paragraph(`${data.prenom}, cela fait <strong>${data.jours_depuis} jours</strong> que votre dossier a été soumis à <strong>${data.organisme}</strong> pour <strong>${data.formation_nom}</strong>.`),
      paragraph(`Avez-vous eu des nouvelles de votre côté ? Parfois, un petit appel à votre conseiller ou à l'OPCO peut accélérer les choses.`),
      infoBox([
        `<p style="font-weight:600;color:${COLORS.accent};margin:0 0 8px" class="email-text">Ce que vous pouvez faire :</p>`,
        iconList([
          { icon: '📞', text: `Appeler ${data.organisme} pour demander l'état d'avancement` },
          { icon: '📧', text: 'Vérifier si un email de demande de complément est arrivé (et les spams)' },
          { icon: '💬', text: 'Nous contacter si vous avez besoin d\'aide' },
        ]),
      ].join(''), 'warning'),
      button('Nous contacter', 'https://wa.me/33188334343', COLORS.whatsapp),
      smallText(`Nous suivons votre dossier de notre côté et vous tiendrons informée dès que nous avons du nouveau.`),
      signature(),
    ].join(''), `${data.prenom}, suivi de votre dossier ${data.organisme} — ${data.jours_depuis} jours`),
  }
}

export function emailAbandonRelance(data: {
  prenom: string
  formation_nom: string
  prochaine_session?: string
  places_restantes?: number
}) {
  return {
    subject: `${data.prenom}, avez-vous encore des questions ?`,
    html: layout([
      heading(`On reste disponibles`),
      paragraph(`${data.prenom}, on s'est parlé il y a quelque temps au sujet de <strong>${data.formation_nom}</strong> et nous voulions savoir si vous aviez encore des questions.`),
      data.prochaine_session ? infoBox([
        iconList([
          { icon: '📅', text: `Prochaine session : <strong>${data.prochaine_session}</strong>` },
          ...(data.places_restantes ? [{ icon: '⚡', text: `<strong>${data.places_restantes} places restantes</strong>` }] : []),
          { icon: '💰', text: '80% de nos stagiaires sont financées à 100%' },
          { icon: '⭐', text: '4.9/5 sur Google — +500 stagiaires formées' },
        ]),
      ].join(''), 'info') : '',
      paragraph(`Si le financement était un frein, sachez que nous vous accompagnons <strong>gratuitement</strong> dans le montage du dossier (OPCO, CPF, France Travail).`),
      paragraph(`On peut en discuter sans engagement :`),
      button('Discuter sur WhatsApp', 'https://wa.me/33188334343', COLORS.whatsapp),
      secondaryButton('Nous appeler : 01 88 33 43 43', 'tel:+33188334343'),
      signature(),
    ].join(''), `${data.prenom}, on reste disponibles pour ${data.formation_nom}`),
  }
}

export function emailAlumniParrainage(data: {
  prenom: string
  formation_completee: string
  code_parrainage: string
  eshop_url: string
}) {
  return {
    subject: `${data.prenom}, 3 mois déjà ! Un cadeau pour vous 🎁`,
    html: layout([
      heading(`Joyeux 3 mois, ${data.prenom} !`),
      paragraph(`Cela fait 3 mois que vous avez terminé <strong>${data.formation_completee}</strong>. On espère que tout se passe bien pour vous !`),
      subheading('Votre code parrainage'),
      infoBox([
        `<p style="text-align:center;margin:0">`,
        `<span style="font-size:24px;font-weight:700;color:${COLORS.primary};letter-spacing:2px">${data.code_parrainage}</span>`,
        `</p>`,
        `<p style="text-align:center;color:${COLORS.textSecondary};font-size:13px;margin:8px 0 0" class="email-text-secondary">`,
        `<strong>100€</strong> pour vous + <strong>50€</strong> pour votre filleule`,
        `</p>`,
      ].join(''), 'success'),
      paragraph(`Partagez ce code avec une amie ou collègue intéressée par la formation. Vous recevez toutes les deux une réduction !`),
      divider(),
      subheading('Offre e-shop exclusive alumni'),
      paragraph(`Profitez de <strong>-10%</strong> sur tout le matériel NPM professionnel de notre boutique.`),
      button('Voir la boutique', data.eshop_url),
      signature(),
    ].join(''), `${data.prenom}, code parrainage + offre exclusive alumni Dermotec`),
  }
}

// Export all templates
export const EMAIL_TEMPLATES = {
  bienvenue: emailBienvenue,
  confirmation_inscription: emailConfirmationInscription,
  convocation_j7: emailConvocationJ7,
  rappel_j1: emailRappelJ1,
  satisfaction_nps: emailSatisfactionNPS,
  certificat: emailCertificat,
  upsell_j30: emailUpsellJ30,
  relance_financement: emailRelanceFinancement,
  abandon_relance: emailAbandonRelance,
  alumni_parrainage: emailAlumniParrainage,
} as const

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATES
