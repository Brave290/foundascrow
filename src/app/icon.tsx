import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'

export const runtime = 'nodejs'
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'
const logo = `data:image/png;base64,${readFileSync('public/logo-brand.png').toString('base64')}`

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: '#0a0f16',
          border: '4px solid #f59e0b',
        }}
      >
        <img src={logo} width="52" height="52" />
      </div>
    ),
    { ...size }
  )
}
