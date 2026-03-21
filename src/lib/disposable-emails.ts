// ============================================================
// CRM DERMOTEC — Blocklist emails jetables
// Empêcher les leads avec des adresses jetables
// ============================================================

export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'yopmail.com',
  'throwaway.email', 'temp-mail.org', 'guerrillamailblock.com',
  'sharklasers.com', 'guerrillamail.info', 'grr.la', 'guerrillamail.net',
  'trashmail.com', 'trashmail.me', 'trashmail.net', 'dispostable.com',
  'mailnesia.com', 'tempr.email', 'maildrop.cc', 'getairmail.com',
  'mohmal.com', 'mailsac.com', 'getnada.com', 'tempail.com',
  'boun.cr', 'dropmail.me', 'mailcatch.com', 'emailondeck.com',
  'inboxbear.com', '10minutemail.com', 'minutemail.com',
  'tempmailaddress.com', 'emailfake.com', 'crazymailing.com',
  'fakeinbox.com', 'mailtemp.org', 'temp-mail.io', 'tempinbox.com',
  'mytemp.email', 'tmpmail.net', 'tmpmail.org', 'discard.email',
  'mailpoof.com', 'jetable.org', 'spamfree24.org', 'trash-mail.com',
  'harakirimail.com', 'mailinator.net', 'mailinator.org',
  'notmailinator.com', 'safetymail.info', 'mailhazard.com',
  'spamgourmet.com', 'mytrashmail.com', 'incognitomail.org',
  'throwam.com', 'filzmail.com', 'tempomail.fr', 'byom.de',
  'e4ward.com', 'nomail.xl.cx', 'despam.it', 'spamhereplease.com',
  'amilegit.com', 'fakemail.fr', 'jetable.fr.nf', 'link2mail.net',
  'maileater.com', 'mailexpire.com', 'tempmailer.com',
  'temporaryemail.net', 'temporaryforwarding.com', 'thankyou2010.com',
  'trashymail.com', 'trashymail.net', 'pookmail.com',
  'bugmenot.com', 'devnullmail.com', 'disposableaddress.com',
  'mailnull.com', 'spamcero.com', 'dead.letter',
])

export function isDisposableEmail(email: string): boolean {
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return DISPOSABLE_DOMAINS.has(domain)
}

export function extractDomain(email: string): string | null {
  return email.split('@')[1]?.toLowerCase() || null
}
