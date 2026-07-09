import { useRef, useEffect } from 'react'
import { br, RevealWrapper } from '../utils/text'
import type { Content } from '../content/types'

interface Props { content: Content }

function LazyVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [src])

  const poster = src.replace(/\.mp4$/, '_poster.jpg')

  return (
    <video
      ref={ref} muted loop playsInline preload="none" poster={poster}
      style={{ width: '100%', display: 'block', aspectRatio: '16 / 9', objectFit: 'cover', background: '#181818' }}
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}

function CoinLogo() {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        // Gira al entrar en pantalla; se resetea al salir para repetir en el siguiente scroll
        if (entry.isIntersecting) el.classList.add('lg-coin-flip')
        else el.classList.remove('lg-coin-flip')
      },
      { threshold: 0.9 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <img
      ref={ref}
      src="/assets/LogoOscSoloTrans.png"
      alt=""
      width={22}
      height={22}
      style={{ display: 'block' }}
    />
  )
}

const TOP     = 80
const CARD_H  = 580
const OVERLAP = CARD_H

export default function Showcase({ content: C }: Props) {
  const CARDS = [
    { title: C.sc1_titulo,       desc: C.sc1_desc,       src: C.asset_sc1,      reverse: false },
    { title: C.sc2_titulo,       desc: C.sc2_desc,       src: C.asset_sc2,      reverse: true  },
    { title: C.sc3_titulo,       desc: C.sc3_desc,       src: C.asset_sc3,      reverse: false },
    { title: C.sc4_titulo,       desc: C.sc4_desc,       src: C.asset_sc4,      reverse: true  },
    { title: C.sc_anota_titulo,  desc: C.sc_anota_desc,  src: C.asset_sc_anota, reverse: false },
    { title: C.sc5_titulo,       desc: C.sc5_desc,       src: C.asset_sc5,      reverse: true  },
  ]

  const N = CARDS.length

  const TextPanel = ({ card, i }: { card: typeof CARDS[0], i: number }) => (
    <div style={{
      background: '#181818', padding: '48px 32px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <CoinLogo />
        <span style={{ font: '500 12px/1 var(--font-body)', letterSpacing: '0.1em', color: 'var(--ds-text-mid)' }}>
          <span style={{ color: 'var(--ds-accent)' }}>{String(i + 1).padStart(2, '0')}</span>
          {' / '}
          {String(N).padStart(2, '0')}
        </span>
      </div>
      <h3 style={{ font: '600 clamp(20px, 1.8vw, 26px)/1.25 var(--font-display)', letterSpacing: '-0.02em', color: 'var(--ds-text-high)', margin: 0 }}>
        {br(card.title)}
      </h3>
      <p style={{ font: '400 16px/1.75 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0 }}>
        {card.desc}
      </p>
    </div>
  )

  const MediaPanel = ({ src }: { src: string }) => (
    <div className="lg-showcase-media" style={{
      position: 'relative', overflow: 'hidden', background: '#181818',
      padding: '20px', display: 'flex', alignItems: 'stretch',
    }}>
      <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden' }}>
        <LazyVideo src={src} />
      </div>
    </div>
  )

  return (
    <section id="showcase" style={{ background: 'var(--ds-bg-0)' }}>
      <style>{`
        @keyframes lgCoinFlip {
          from { transform: perspective(400px) rotateY(0deg); }
          to   { transform: perspective(400px) rotateY(360deg); }
        }
        .lg-coin-flip { animation: lgCoinFlip 0.9s cubic-bezier(0.3, 0, 0.2, 1) 1; }
        @media (prefers-reduced-motion: reduce) {
          .lg-coin-flip { animation: none; }
        }
      `}</style>
      <div className="lg-showcase-header" style={{ maxWidth: 1200, margin: '0 auto', padding: '125px 32px 48px' }}>
        <RevealWrapper>
          <h2 style={{ font: '600 clamp(28px, 3.5vw, 48px)/1.12 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-heading)', margin: '0 auto', textAlign: 'center', maxWidth: 760 }}>
            {br(C.sc_h2)}
          </h2>
        </RevealWrapper>
      </div>

      {CARDS.map((card, i) => (
        <div key={i} className="lg-showcase-section" style={{
          position: 'relative',
          minHeight: i < N - 1 ? '160vh' : '100vh',
          marginTop: i > 0 ? -OVERLAP : 0,
        }}>
          <div className="lg-showcase-sticky" style={{
            position: 'sticky', top: TOP, zIndex: i + 1,
            padding: '0 32px', boxSizing: 'border-box',
          }}>
            <div className="lg-showcase-card" style={{
              maxWidth: 1200, margin: '0 auto', height: CARD_H,
              borderRadius: 18, overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: card.reverse ? '320px 1fr' : '1fr 320px',
              background: '#181818', border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            }}>
              {card.reverse ? (
                <><TextPanel card={card} i={i} /><MediaPanel src={card.src} /></>
              ) : (
                <><MediaPanel src={card.src} /><TextPanel card={card} i={i} /></>
              )}
            </div>
          </div>
        </div>
      ))}

      <div style={{ height: 0 }} />
    </section>
  )
}
