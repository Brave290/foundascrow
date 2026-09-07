'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { BrandSpinner } from '@/components/site/brand-spinner'
import { Paperclip, FileText, Lock } from 'lucide-react'

type VaultFile = { path: string; name: string; size: number; type: string }
const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`

export function DeliveryUploader({ reference, initialFiles }: { reference: string; initialFiles: VaultFile[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<VaultFile[]>(initialFiles)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMsg('')
    const form = new FormData()
    form.append('file', file)
    form.append('reference', reference)
    const res = await fetch('/api/uploads', { method: 'POST', body: form })
    const d = await res.json().catch(() => null)
    if (res.ok) {
      setFiles((f) => [...f, { path: `${reference}/`, name: file.name, size: file.size, type: file.type }])
      setMsg('Attached. The buyer unlocks it after payment.')
    } else {
      setMsg(d?.error || 'Upload failed')
    }
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Delivery files</p>
        <input ref={inputRef} type="file" className="hidden" onChange={onPick} />
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <BrandSpinner className="size-3.5" /> : <Paperclip className="size-3.5" />} Attach file
        </Button>
      </div>
      {files.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background p-4 text-center text-xs text-muted-foreground">
          Images, documents, ZIPs — up to 10MB each. Sealed until the buyer pays.
        </p>
      ) : (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs">
              <span className="flex items-center gap-2 truncate text-foreground"><FileText className="size-3.5 shrink-0 text-primary" /> {f.name}</span>
              <span className="ml-2 shrink-0 font-mono text-muted-foreground">{kb(f.size)}</span>
            </div>
          ))}
        </div>
      )}
      {msg && <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Lock className="size-3 text-primary" /> {msg}</p>}
    </div>
  )
}
