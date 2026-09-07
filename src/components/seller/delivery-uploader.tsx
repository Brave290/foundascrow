'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Paperclip, FileText, Lock, Check, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Row = { key: string; name: string; size: number; state: 'uploading' | 'done' | 'error'; msg?: string }
const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`

export function DeliveryUploader({ reference, initialFiles }: { reference: string; initialFiles: { path: string; name: string; size: number; type: string }[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<Row[]>(initialFiles.map((f, i) => ({ key: `old-${i}`, name: f.name, size: f.size, state: 'done' })))
  const [msg, setMsg] = useState('')

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []).filter((f) => f.size <= 10 * 1024 * 1024)
    if (inputRef.current) inputRef.current.value = ''
    setMsg('')
    for (const file of picked) {
      const key = `${Date.now()}-${file.name}`
      setRows((r) => [...r, { key, name: file.name, size: file.size, state: 'uploading' }])
      const form = new FormData()
      form.append('file', file)
      form.append('reference', reference)
      const res = await fetch('/api/uploads', { method: 'POST', body: form })
      const d = await res.json().catch(() => null)
      if (res.ok) {
        setRows((r) => r.map((x) => (x.key === key ? { ...x, state: 'done' } : x)))
        setMsg('Attached. The buyer unlocks it after payment.')
      } else {
        setRows((r) => r.map((x) => (x.key === key ? { ...x, state: 'error', msg: d?.error || 'Upload failed' } : x)))
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Delivery files</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={onPick} />
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          <Paperclip className="size-3.5" /> Attach file
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background p-4 text-center text-xs text-muted-foreground">
          Images, documents, ZIPs — up to 10MB each. Sealed until the buyer pays.
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {rows.map((r) => (
              <motion.div
                key={r.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 truncate text-foreground">
                    <FileText className="size-3.5 shrink-0 text-primary" /> {r.name}
                  </span>
                  <span className="ml-2 flex shrink-0 items-center gap-2 font-mono text-muted-foreground">
                    {kb(r.size)}
                    {r.state === 'done' && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 12 }}>
                        <Check className="size-3.5 text-emerald-400" />
                      </motion.span>
                    )}
                    {r.state === 'error' && <AlertCircle className="size-3.5 text-destructive" />}
                  </span>
                </div>
                {r.state === 'uploading' && <div className="mt-2 h-1 overflow-hidden rounded-full"><div className="h-full w-full animate-shimmer rounded-full" /></div>}
                {r.state === 'error' && <p className="mt-1 text-[10px] text-destructive">{r.msg}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {msg && (
        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock className="size-3 text-primary" /> {msg}
        </p>
      )}
    </div>
  )
}
