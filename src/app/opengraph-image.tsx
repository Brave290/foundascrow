import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'

export const runtime = 'nodejs'
export const alt = 'FoundaScrow — Buy and sell without fear'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
const logo = `data:image/png;base64,${readFileSync('public/logo-brand.png').toString('base64')}`

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
          <img src={logo} width="84" height="84" />
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
