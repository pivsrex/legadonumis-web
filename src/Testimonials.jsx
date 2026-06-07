/* global React */
const { RevealWrapper } = window;
const C = window.C;

const TESTIMONIALS = [C.tm1_quote, C.tm2_quote, C.tm3_quote];

function TestimonialCard({ quote }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 20,
        padding: '36px 32px',
        borderRadius: 14,
        background: '#1c1916',
        border: `1px solid ${hover ? 'rgba(201,168,76,0.22)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hover
          ? '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)'
          : '0 12px 40px rgba(0,0,0,0.4)',
        transition: 'border-color 250ms ease, box-shadow 250ms ease',
        boxSizing: 'border-box',
        height: '100%',
      }}
    >
      <div style={{
        font: '400 22px/1 Georgia, serif',
        color: 'var(--ds-accent)',
        userSelect: 'none',
        letterSpacing: '0.05em',
        opacity: 0.85,
      }}>
        «
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
      background: '#141210',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Comilla decorativa de fondo */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '50%', right: '4%',
        transform: 'translateY(-55%)',
        font: '400 280px/1 Georgia, serif',
        color: 'var(--ds-accent)',
        opacity: 0.03,
        userSelect: 'none', pointerEvents: 'none',
        lineHeight: 1,
      }}>
        «
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
