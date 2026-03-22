import { redirect } from 'next/navigation'

// Page fusionnée → onglet Facturation dans /gestion
export default function FacturationPage() {
  redirect('/gestion')
}
