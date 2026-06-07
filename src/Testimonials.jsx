/* global React */
const { RevealWrapper } = window;
const C = window.C;

const TESTIMONIALS = [
  { quote: C.tm1_quote, name: C.tm1_name, role: C.tm1_role },
  { quote: C.tm2_quote, name: C.tm2_name, role: C.tm2_role },
];

function TestimonialCard({ quote, name, role }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 24,
        padding: '32px 28px',
        borderRadius: 14,
        background: '#181818',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'border-color 200ms ease, transform 200ms cubic-bezier(0.4,0,0.2,1)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        font: '500 clamp(28px,4vw,42px)/1 var(--font-display)',
        color: 'var(--ds-accent)',
        lineHeight: 1,
        marginBottom: -8,
        userSelect: 'none',
      }}>
        "
      </div>

      <p style={{
        font: '400 16px/1.7 var(--font-body)',
        color: '#ffffff',
        margin: 0,
        flexGrow: 1,
      }}>
        {quote}
      </p>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 20,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'var(--ds-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          font: '600 14px/1 var(--font-display)',
          color: '#1a1410',
        }}>
          {name.charAt(0)}
        </div>
        <div>
          <div style={{
            font: '600 14px/1.3 var(--font-display)',
            color: 'var(--ds-text-high)',
          }}>
            {name}
          </div>
          <div style={{
            font: '400 13px/1.4 var(--font-body)',
            color: 'var(--ds-text-mid)',
            marginTop: 2,
          }}>
            {role}
          </div>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: '125px 0 0', background: 'var(--ds-bg-0)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>

        <RevealWrapper>
          <h2 style={{
            font: '600 clamp(24px,3vw,42px)/1.12 var(--font-display)',
            letterSpacing: '-0.025em',
            color: 'var(--ds-text-high)',
            margin: '0 0 48px',
            textAlign: 'center',
          }}>
            {C.tm_h2}
          </h2>
        </RevealWrapper>

        <div
          className="tm-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}
        >
          {TESTIMONIALS.map((t, i) => (
            <RevealWrapper key={i} delay={i * 80}>
              <TestimonialCard {...t} />
            </RevealWrapper>
          ))}
        </div>

      </div>
    </section>
  );
}

window.Testimonials = Testimonials;
