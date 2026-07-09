import { useState } from 'react'
import { PlusIcon, MinusIcon } from './icons'
import { RevealWrapper } from '../utils/text'
import type { Content } from '../content/types'

interface Props { content: Content }

function FAQCard({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{
      background: '#181818', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.45)', overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, width: '100%', textAlign: 'left',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '22px 24px',
        }}
      >
        <span style={{ font: '500 15px/1.4 var(--font-body)', color: 'var(--ds-text-high)', flex: 1 }}>{q}</span>
        <span style={{ flexShrink: 0, color: 'var(--ds-text-mid)', lineHeight: 0 }}>
          {open ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
        </span>
      </button>
      <div style={{
        maxHeight: open ? 600 : 0, overflow: 'hidden',
        opacity: open ? 1 : 0,
        transition: 'max-height 320ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease',
      }}>
        <p style={{ font: '400 14px/1.75 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0, padding: '0 24px 22px' }}>{a}</p>
      </div>
    </div>
  )
}

export default function FAQ({ content: C }: Props) {
  const [open, setOpen] = useState<number | null>(null)
  const toggle = (i: number) => setOpen(open === i ? null : i)

  const items = [
    { q: C.faq1_q, a: C.faq1_a },
    { q: C.faq2_q, a: C.faq2_a },
    { q: C.faq3_q, a: C.faq3_a },
    { q: C.faq4_q, a: C.faq4_a },
    { q: C.faq5_q, a: C.faq5_a },
    { q: C.faq6_q, a: C.faq6_a },
    { q: C.faq7_q, a: C.faq7_a },
    { q: C.faq8_q, a: C.faq8_a },
  ]

  const left  = items.filter((_, i) => i % 2 === 0)
  const right = items.filter((_, i) => i % 2 !== 0)

  return (
    <section id="faq" style={{ padding: '125px 0 0', background: 'var(--ds-bg-0)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <RevealWrapper>
          <h2 style={{ font: '600 clamp(28px, 3.5vw, 48px)/1.12 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-heading)', margin: '0 auto 56px', textAlign: 'center', maxWidth: 760 }}>
            {C.faq_titulo}
          </h2>
        </RevealWrapper>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {left.map((item, i) => (
              <RevealWrapper key={i * 2} delay={i * 60}>
                <FAQCard q={item.q} a={item.a} open={open === i * 2} onToggle={() => toggle(i * 2)} />
              </RevealWrapper>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {right.map((item, i) => (
              <RevealWrapper key={i * 2 + 1} delay={i * 60 + 30}>
                <FAQCard q={item.q} a={item.a} open={open === i * 2 + 1} onToggle={() => toggle(i * 2 + 1)} />
              </RevealWrapper>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
