import { redirect } from 'next/navigation'

// Page fusionnée → onglet BPF dans /qualiopi
export default function BPFPage() {
  redirect('/qualiopi')
}
