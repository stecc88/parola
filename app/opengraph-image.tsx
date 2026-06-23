import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #16548A 0%, #2F8FE0 60%, #1E6FB8 100%)',
          fontFamily: 'Georgia, serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
            borderRadius: 70,
            background: '#FFF6DC',
            marginBottom: 32
          }}
        >
          <span style={{ fontSize: 90, fontStyle: 'italic', color: '#2F8FE0' }}>P</span>
        </div>
        <div style={{ fontSize: 96, fontStyle: 'italic', color: 'white' }}>Parola</div>
        <div
          style={{
            marginTop: 20,
            fontSize: 30,
            color: '#FFE07D',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            maxWidth: 760
          }}
        >
          Scrivi, sbaglia, migliora — allenati per gli esami di italiano
        </div>
      </div>
    ),
    { ...size }
  )
}
