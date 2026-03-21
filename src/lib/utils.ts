import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('fr-FR', options || { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})/g, '$1 ').trim()
  }
  return phone
}

export function generateNumeroFacture(type: 'devis' | 'facture' | 'avoir'): string {
  const prefix = type === 'devis' ? 'D' : type === 'facture' ? 'F' : 'A'
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${year}-${random}`
}

export function generateCertificatNumero(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `CERT-${year}-${random}`
}

export function getInitials(prenom: string, nom?: string): string {
  return `${prenom[0] || ''}${nom?.[0] || ''}`.toUpperCase()
}

export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.floor((d2.getTime() - d1.getTime()) / 86400000)
}

export function isOverdue(dateRappel: string): boolean {
  return new Date(dateRappel) < new Date()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
