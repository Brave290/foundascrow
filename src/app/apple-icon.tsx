import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

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
        <span style={{ display: 'flex', color: '#f59e0b', fontSize: 96, fontWeight: 800, fontFamily: 'sans-serif' }}>
          S
        </span>
      </div>
    ),
    { ...size }
  )
}
