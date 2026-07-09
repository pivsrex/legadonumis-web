import type { Content } from '../content/types'

interface Props { content: Content }

function TestimonialCard({ quote }: { quote: string }) {
  return (
    <div style={{
      width: 480, flexShrink: 0, marginRight: 24,
      display: 'flex', flexDirection: 'column',
      padding: '32px 36px 36px', borderRadius: 14,
      background: '#1a1816', border: '1px solid rgba(255,255,255,0.07)',
      boxSizing: 'border-box', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
        background: 'var(--ds-accent)', opacity: 0.55,
        borderRadius: '14px 0 0 14px', pointerEvents: 'none',
      }} />
      <p style={{ font: '400 16px/1.8 var(--font-body)', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
        {'"'}{quote}{'"'}
      </p>
    </div>
  )
}

export default function Testimonials({ content: C }: Props) {
  const quotes = [C.tm1_quote, C.tm2_quote, C.tm3_quote, C.tm4_quote, C.tm5_quote, C.tm6_quote]

  return (
    <section id="testimonials" style={{ padding: '70px 0 0' }}>
      <style>{`
        @keyframes tmScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .tm-carousel {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
        }
        .tm-track { display: flex; width: max-content; animation: tmScroll 70s linear infinite; }
        .tm-carousel:hover .tm-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .tm-track { animation-play-state: paused !important; } }
      `}</style>
      <div className="tm-carousel">
        <div className="tm-track">
          {[...quotes, ...quotes].map((quote, i) => (
            <TestimonialCard key={i} quote={quote} />
          ))}
        </div>
      </div>
    </section>
  )
}
