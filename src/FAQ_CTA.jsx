/* global React */
const { useState: faqUseState } = React;
const { PlusIcon, MinusIcon, AppleIcon, WindowsIcon } = window.LegadoIcons;
const { RevealWrapper } = window;
const C = window.C;

const FAQ_ITEMS = [
  { q: C.faq1_q, a: C.faq1_a },
  { q: C.faq2_q, a: C.faq2_a },
  { q: C.faq3_q, a: C.faq3_a },
  { q: C.faq4_q, a: C.faq4_a },
  { q: C.faq5_q, a: C.faq5_a },
  { q: C.faq6_q, a: C.faq6_a },
  { q: C.faq7_q, a: C.faq7_a },
  { q: C.faq8_q, a: C.faq8_a },
];

function FAQCard({ q, a, open, onToggle }) {
  return (
    <div style={{
      background: '#181818',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
      overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, width: '100%', textAlign: 'left',
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '22px 24px',
        }}
      >
        <span style={{
          font: '500 15px/1.4 var(--font-body)',
          color: 'var(--ds-text-high)',
          flex: 1,
        }}>
          {q}
        </span>
        <span style={{ flexShrink: 0, color: 'var(--ds-text-mid)', lineHeight: 0 }}>
          {open ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
        </span>
      </button>
      <div style={{
        maxHeight: open ? 600 : 0,
        overflow: 'hidden',
        opacity: open ? 1 : 0,
        transition: 'max-height 320ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease',
      }}>
        <p style={{
          font: '400 14px/1.75 var(--font-body)',
          color: 'var(--ds-text-mid)',
          margin: 0,
          padding: '0 24px 22px',
        }}>
          {a}
        </p>
      </div>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = faqUseState(null);
  const toggle = (i) => setOpen(open === i ? null : i);

  const withIdx = FAQ_ITEMS.map((item, i) => ({ ...item, idx: i }));
  const left  = withIdx.filter((_, i) => i % 2 === 0);
  const right = withIdx.filter((_, i) => i % 2 !== 0);

  return (
    <section id="faq" style={{ padding: '125px 0 0', background: 'var(--ds-bg-0)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>

        <RevealWrapper>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 64, alignItems: 'start', marginBottom: 56,
          }}>
            <h2 style={{
              font: '600 clamp(28px, 3.5vw, 44px)/1.1 var(--font-display)',
              letterSpacing: '-0.025em', color: 'var(--ds-text-high)', margin: 0,
            }}>
              {C.faq_titulo}
            </h2>
            <p style={{
              font: '400 17px/1.6 var(--font-body)', color: 'var(--ds-text-mid)',
              margin: 0, paddingTop: 8,
            }}>
              {C.faq_sub}
            </p>
          </div>
        </RevealWrapper>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {left.map((item, i) => (
              <RevealWrapper key={item.idx} delay={i * 60}>
                <FAQCard
                  q={item.q} a={item.a}
                  open={open === item.idx}
                  onToggle={() => toggle(item.idx)}
                />
              </RevealWrapper>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {right.map((item, i) => (
              <RevealWrapper key={item.idx} delay={i * 60 + 30}>
                <FAQCard
                  q={item.q} a={item.a}
                  open={open === item.idx}
                  onToggle={() => toggle(item.idx)}
                />
              </RevealWrapper>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <>
      <style>{`
        @keyframes ctaGlow {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
      `}</style>
      <section style={{
        padding: '125px 32px 0',
        background: 'var(--ds-bg-0)',
        textAlign: 'center',
      }}>
        <RevealWrapper>
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
            background: '#181818', border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 20, padding: '64px 48px',
            position: 'relative', overflow: 'hidden',
          }}>

            <div aria-hidden="true" style={{
              position: 'absolute',
              top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '80%', height: 220,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.22) 0%, transparent 70%)',
              animation: 'ctaGlow 9s ease-in-out infinite',
              pointerEvents: 'none',
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
  );
}

window.FAQ = FAQ;
window.FinalCTA = FinalCTA;
