import { RevealWrapper } from '../utils/text'
import type { Content } from '../content/types'

interface Props { content: Content }

export default function FinalCTA({ content: C }: Props) {
  return (
    <>
      <style>{`
        @keyframes ctaGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
      <section style={{ padding: '125px 32px 0', background: 'var(--ds-bg-0)', textAlign: 'center' }}>
        <RevealWrapper>
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
            background: '#181818', border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 20, padding: '64px 48px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div aria-hidden="true" style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '80%', height: 220,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.22) 0%, transparent 70%)',
              animation: 'ctaGlow 9s ease-in-out infinite', pointerEvents: 'none',
            }} />
            <h2 style={{
              font: '700 clamp(32px, 4.5vw, 60px)/1.05 var(--font-display)',
              letterSpacing: '-0.035em', color: 'var(--ds-text-high)', margin: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3em',
              position: 'relative', zIndex: 1,
            }}>
              {C.cta_titulo.split('\n').map((line, i) => (
                <span key={i} style={{ whiteSpace: 'nowrap' }}>{line}</span>
              ))}
            </h2>
          </div>
        </RevealWrapper>
      </section>
    </>
  )
}
