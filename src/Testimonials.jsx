/* global React */
const { RevealWrapper } = window;
const C = window.C;

const TESTIMONIALS = [C.tm1_quote, C.tm2_quote, C.tm3_quote];

function QuoteStrip({ quote }) {
  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '52px 0',
      display: 'grid',
      gridTemplateColumns: '28px 1fr',
      gap: '28px',
      alignItems: 'start',
    }}>
      <div style={{
        font: '400 20px/1 Georgia, serif',
        color: 'var(--ds-accent)',
        paddingTop: 3,
        userSelect: 'none',
        opacity: 0.9,
      }}>
        «
      </div>
      <p style={{
        font: '400 17px/1.85 var(--font-body)',
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
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>
        {TESTIMONIALS.map((quote, i) => (
          <RevealWrapper key={i} delay={i * 100}>
            <QuoteStrip quote={quote} />
          </RevealWrapper>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
      </div>
    </section>
  );
}

window.Testimonials = Testimonials;
