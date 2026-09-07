import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const logo = `data:image/png;base64,${readFileSync('public/logo-brand.png').toString('base64')}`

export async function GET() {
  const img = new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 128,
          height: 128,
          borderRadius: '50%',
          background: '#0a0f16',
          border: '6px solid #f59e0b',
        }}
      >
        <img src={logo} width="104" height="104" />
      </div>
    ),
    { width: 128, height: 128 }
  )
  return new Response(img.body, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  })
}
