'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function TrackEntry() {
  const router = useRouter()
  const [ref, setRef] = useState('')

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4">
      <h1 className="font-display text-2xl text-foreground">Track your payment</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter the reference from your payment link or receipt.
      </p>
      <div className="mt-6 flex w-full gap-2">
        <Input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ref.trim() && router.push(`/track/${ref.trim()}`)}
          placeholder="ORD-8F3K2M"
          className="font-mono"
        />
        <Button onClick={() => ref.trim() && router.push(`/track/${ref.trim()}`)}>
          <Search className="size-4" /> Track
        </Button>
      </div>
    </main>
  )
}
