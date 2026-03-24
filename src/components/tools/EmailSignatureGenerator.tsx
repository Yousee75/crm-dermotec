'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { sanitizeEmail } from '@/lib/sanitize'

export function EmailSignatureGenerator() {
  const [form, setForm] = useState({
    nom: '',
    poste: '',
    telephone: '',
    email: '',
    site: 'www.dermotec.fr',
  })
  const [copied, setCopied] = useState(false)

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const signatureHtml = `
<table cellpadding="0" cellspacing="0" style="font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#1A1A1A;line-height:1.5">
  <tr>
    <td style="padding-right:16px;border-right:3px solid #FF5C00">
      <div style="width:60px;height:60px;background:#FF5C00;border-radius:12px;display:flex;align-items:center;justify-content:center">
        <span style="color:white;font-size:24px;font-weight:bold">D</span>
      </div>
    </td>
    <td style="padding-left:16px">
      <p style="margin:0;font-size:15px;font-weight:700;color:#1A1A1A">${form.nom || 'Votre Nom'}</p>
      <p style="margin:0;font-size:12px;color:#FF5C00;font-weight:600">${form.poste || 'Votre Poste'}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#64748b">
        ${form.telephone ? `📞 ${form.telephone}` : ''}${form.telephone && form.email ? ' · ' : ''}${form.email ? `✉️ ${form.email}` : ''}
      </p>
      <p style="margin:2px 0 0;font-size:12px">
        <a href="https://${form.site}" style="color:#FF5C00;text-decoration:none;font-weight:600">🌐 ${form.site}</a>
      </p>
      <p style="margin:6px 0 0;font-size:10px;color:#94a3b8">Dermotec Advanced · Centre de Formation Esthétique · Certifié Qualiopi</p>
    </td>
  </tr>
</table>`.trim()

  const copySignature = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([signatureHtml], { type: 'text/html' }),
          'text/plain': new Blob([signatureHtml], { type: 'text/plain' }),
        }),
      ])
    } catch {
      await navigator.clipboard.writeText(signatureHtml)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { field: 'nom', label: 'Nom complet', placeholder: 'Jean Dupont' },
          { field: 'poste', label: 'Poste', placeholder: 'Responsable Commercial' },
          { field: 'telephone', label: 'Téléphone', placeholder: '01 88 33 43 43' },
          { field: 'email', label: 'Email', placeholder: 'contact@dermotec.fr' },
        ].map(f => (
          <div key={f.field}>
            <label className="block text-xs font-medium text-[#777777] mb-1">{f.label}</label>
            <input
              type="text"
              value={form[f.field as keyof typeof form]}
              onChange={e => update(f.field, e.target.value)}
              placeholder={f.placeholder}
              className="w-full border border-[#EEEEEE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      {/* Aperçu */}
      <div className="border border-[#EEEEEE] rounded-xl p-4 bg-[#FAF8F5]">
        <p className="text-xs text-[#999999] mb-2">Aperçu :</p>
        <div dangerouslySetInnerHTML={{ __html: sanitizeEmail(signatureHtml) }} />
      </div>

      <button
        onClick={copySignature}
        className="w-full bg-accent hover:bg-accent-light text-white rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copié !' : 'Copier la signature HTML'}
      </button>
    </div>
  )
}
