import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

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
        <span style={{ display: 'flex', color: '#f59e0b', fontSize: 34, fontWeight: 800, fontFamily: 'sans-serif' }}>
          S
        </span>
      </div>
    ),
    { ...size }
  )
}
