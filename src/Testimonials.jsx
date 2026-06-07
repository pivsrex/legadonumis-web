/* global React */
const { QuoteIcon, CoinIcon } = window.NumIcons;
const C = window.C;

const QUOTES = [C.tm1_quote, C.tm2_quote, C.tm3_quote, C.tm4_quote, C.tm5_quote];

function TestimonialCard({ quote }) {
  return (
    <div style={{
      width: 420,
      flexShrink: 0,
      marginRight: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      padding: '36px 32px',
      borderRadius: 14,
      background: '#1a1816',
      border: '1px solid rgba(255,255,255,0.07)',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <span style={{
          font: '400 20px/1 Georgia, serif',
          color: 'var(--ds-accent)',
          userSelect: 'none',
          opacity: 0.85,
        }}>
          «
        </span>
        <span style={{ color: 'var(--ds-accent)', opacity: 0.18, lineHeight: 0 }}>
          <CoinIcon size={18} />
        </span>
      </div>
      <p style={{
        font: '400 15px/1.8 var(--font-body)',
        color: 'rgba(255,255,255,0.85)',
        margin: 0,
        flexGrow: 1,
      }}>
        {quote}
      </p>
    </div>
  );
}

function Testimonials() {
  const isEN = (window.LANG || 'es') === 'en';
  return (
    <section id="testimonials" style={{ padding: '125px 0 0' }}>
      <style>{`
        @keyframes tmScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .tm-carousel {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
        }
        .tm-track {
          display: flex;
          width: max-content;
          animation: tmScroll 55s linear infinite;
        }
        .tm-carousel:hover .tm-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .tm-track { animation-play-state: paused !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: 'var(--ds-accent)',
          opacity: 0.7,
        }}>
          <QuoteIcon size={14} />
          <span style={{
            font: '500 11px/1 var(--font-display)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            {isEN ? 'Testimonials' : 'Testimonios'}
          </span>
        </div>
      </div>

      <div className="tm-carousel">
        <div className="tm-track">
          {[...QUOTES, ...QUOTES].map((quote, i) => (
            <TestimonialCard key={i} quote={quote} />
          ))}
        </div>
      </div>
    </section>
  );
}

window.Testimonials = Testimonials;
