import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'FoundaScrow — Buy and sell without fear'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          background: '#0a0f16',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 84,
              height: 84,
              borderRadius: '50%',
              border: '3px solid #f59e0b',
              color: '#f59e0b',
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ display: 'flex', color: '#f8fafc', fontSize: 44, fontWeight: 700 }}>
            FoundaScrow
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', color: '#f59e0b', fontSize: 28, letterSpacing: 8 }}>
            ESCROW FOR EVERYONE
          </div>
          <div style={{ display: 'flex', color: '#f8fafc', fontSize: 54, fontWeight: 800, marginTop: 12 }}>
            Buy and sell without fear.
          </div>
          <div style={{ display: 'flex', color: '#94a3b8', fontSize: 26, marginTop: 16 }}>
            Money waits in a vault until delivery is confirmed.
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
