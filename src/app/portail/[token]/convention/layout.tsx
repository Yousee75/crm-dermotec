import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Convention de Formation | Dermotec Advanced',
  description: 'Signez votre convention de formation en ligne de manière sécurisée',
}

export default function ConventionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}