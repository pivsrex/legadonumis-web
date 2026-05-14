/* global React */
const { CoinIcon, HistoryIcon, LayersIcon, SparkIcon } = window.NumIcons;
const { RevealWrapper } = window;
const C = window.C;
const br = (s) => s.split(/\n|<br\s*\/?>/i).reduce((a,l,i) => i===0?[l]:[...a,React.createElement('br',{key:i}),l],[]);

const STEPS = [
  { n: '01', icon: CoinIcon,    title: C.paso1_titulo, body: C.paso1_body },
  { n: '02', icon: HistoryIcon, title: C.paso2_titulo, body: C.paso2_body },
  { n: '03', icon: LayersIcon,  title: C.paso3_titulo, body: C.paso3_body },
  { n: '04', icon: SparkIcon,   title: C.paso4_titulo, body: C.paso4_body },
];

function Step({ step }) {
  const [hover, setHover] = React.useState(false);

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        padding: '4px 12px 0', position: 'relative',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Badge */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: hover ? 'var(--ds-bg-3)' : 'var(--ds-bg-2)',
        border: `1px solid ${hover ? 'var(--ds-accent)' : 'var(--ds-border-mid)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ds-accent)', position: 'relative', zIndex: 1,
        transform: hover ? 'scale(1.08)' : 'scale(1)',
        transition: 'background 220ms ease, border-color 220ms ease, transform 260ms cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'default',
      }}>
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%',
          background: hover ? 'rgba(201,168,76,0.28)' : 'var(--ds-accent-ghost)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 220ms ease',
        }}>
          <step.icon size={22} />
        </div>
        <span style={{
          position: 'absolute', top: -8, right: -8,
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--ds-bg-1)', border: '1px solid var(--ds-border-mid)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: '600 10px/1 var(--font-mono)', color: 'var(--ds-text-mid)',
        }}>
          {step.n}
        </span>
      </div>

      <h3 style={{
        font: '600 18px/1.25 var(--font-display)', letterSpacing: '-0.01em',
        color: 'var(--ds-text-high)', margin: 0, textAlign: 'center',
      }}>
        {step.title}
      </h3>

      <p style={{
        font: '400 14px/1.65 var(--font-body)',
        color: 'var(--ds-text-mid)', margin: 0, textAlign: 'center', whiteSpace: 'pre-line',
      }}>
        {step.body}
      </p>
    </div>
  );
}

function Workflow() {
  const s = {
    section: {
      padding: '125px 0 0',
      background: 'var(--ds-bg-0)',
    },
    container: { maxWidth: 1200, margin: '0 auto', padding: '0 32px' },
    head: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start', marginBottom: 56 },
    h2: {
      font: '600 clamp(24px, 3vw, 42px)/1.12 var(--font-display)',
      letterSpacing: '-0.025em', color: 'var(--ds-text-high)', margin: 0,
    },
    sub: { font: '400 17px/1.6 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0, paddingTop: 8 },
    track: {
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16, position: 'relative',
    },
    line: {
      position: 'absolute', top: 36, left: '12.5%', right: '12.5%', height: 1,
      background: 'var(--ds-border-low)',
      pointerEvents: 'none',
    },
  };

  return (
    <section id="workflow" style={s.section}>
      <div style={s.container}>

        <RevealWrapper>
          <div style={s.head}>
            <h2 style={s.h2}>
              Tu colección merece más que un simple inventario
            </h2>
            <p style={s.sub}>{br(C.pasos_sub)}</p>
          </div>
        </RevealWrapper>

        <div style={s.track} className="lg-workflow-track">
          <div style={s.line} />
          {STEPS.map((step, i) => (
            <RevealWrapper key={i} delay={i * 100}>
              <Step step={step} />
            </RevealWrapper>
          ))}
        </div>

      </div>
    </section>
  );
}

window.Workflow = Workflow;
