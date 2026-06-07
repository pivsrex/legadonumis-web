/* global React */
const { RevealWrapper } = window;
const C = window.C;

const TESTIMONIALS = [C.tm1_quote, C.tm2_quote, C.tm3_quote];

function TestimonialCard({ quote }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 20,
      padding: '36px 32px',
      borderRadius: 14,
      background: '#181818',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
      boxSizing: 'border-box',
      height: '100%',
    }}>
      <div style={{
        font: '600 56px/1 var(--font-display)',
        color: 'var(--ds-accent)',
        userSelect: 'none',
        marginBottom: -8,
        lineHeight: 1,
      }}>
        {'“'}
      </div>
      <p style={{
        font: '400 16px/1.75 var(--font-body)',
        color: 'rgba(255,255,255,0.88)',
        margin: 0,
      }}>
        {quote}
      </p>
    </div>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" style={{
      padding: '125px 0 0',
      background: 'var(--ds-bg-0)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Comilla decorativa de fondo */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '50%', right: '4%',
        transform: 'translateY(-55%)',
        font: '600 280px/1 var(--font-display)',
        color: 'var(--ds-accent)',
        opacity: 0.035,
        userSelect: 'none', pointerEvents: 'none',
        lineHeight: 1,
      }}>
        {'“'}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>
        <div
          className="tm-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}
        >
          {TESTIMONIALS.map((quote, i) => (
            <RevealWrapper key={i} delay={i * 80}>
              <TestimonialCard quote={quote} />
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Testimonials = Testimonials;
