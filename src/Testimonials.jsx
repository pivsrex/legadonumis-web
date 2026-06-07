/* global React */
const C = window.C;

const QUOTES = [C.tm1_quote, C.tm2_quote, C.tm3_quote];
const CARD_W  = 420;
const CARD_MR = 24;

function TestimonialCard({ quote }) {
  return (
    <div style={{
      width: CARD_W,
      flexShrink: 0,
      marginRight: CARD_MR,
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
        font: '400 20px/1 Georgia, serif',
        color: 'var(--ds-accent)',
        userSelect: 'none',
        opacity: 0.85,
      }}>
        «
      </div>
      <p style={{
        font: '400 15px/1.8 var(--font-body)',
        color: 'rgba(255,255,255,0.85)',
        margin: 0,
      }}>
        {quote}
      </p>
    </div>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: '125px 0 0' }}>
      <style>{`
        @keyframes tmScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .tm-carousel {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
        }
        .tm-track {
          display: flex;
          width: max-content;
          animation: tmScroll 45s linear infinite;
        }
        .tm-carousel:hover .tm-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .tm-track { animation-play-state: paused !important; }
        }
      `}</style>

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
