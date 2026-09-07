import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
const logo = `data:image/png;base64,${readFileSync('public/logo-brand.png').toString('base64')}`

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 180,
          height: 180,
          borderRadius: 40,
          background: '#0a0f16',
          border: '8px solid #f59e0b',
        }}
      >
        <img src={logo} width="140" height="140" />
      </div>
    ),
    { ...size }
  )
}
