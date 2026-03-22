import { redirect } from 'next/navigation'

// Page fusionnée → onglet "Clients" dans /contacts
export default function ClientsPage() {
  redirect('/contacts')
}
