import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
        <span style={{ display: 'flex', color: '#f59e0b', fontSize: 68, fontWeight: 800, fontFamily: 'sans-serif' }}>
          S
        </span>
      </div>
    ),
    { width: 128, height: 128 }
  )
  return new Response(img.body, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  })
}
