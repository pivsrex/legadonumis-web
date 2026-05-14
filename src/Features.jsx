/* global React */
const {
  GridIcon, FrameIcon, ImportIcon,
  BookmarkIcon, ChartIcon, TagIcon,
} = window.NumIcons;
const { RevealWrapper } = window;
const C = window.C;
const br = (s) => s.split(/\n|<br\s*\/?>/i).reduce((a,l,i) => i===0?[l]:[...a,React.createElement('br',{key:i}),l],[]);

const FEATURES = [
  { icon: GridIcon,     title: C.f1_titulo, desc: C.f1_desc },
  { icon: ImportIcon,   title: C.f2_titulo, desc: C.f2_desc },
  { icon: FrameIcon,    title: C.f3_titulo, desc: C.f3_desc },
  { icon: BookmarkIcon, title: C.f4_titulo, desc: C.f4_desc },
  { icon: ChartIcon,    title: C.f5_titulo, desc: C.f5_desc },
  { icon: TagIcon,      title: C.f6_titulo, desc: C.f6_desc },
];

function FeatureCard({ icon: Icon, title, desc }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 20,
        padding: '28px 24px 32px',
        borderRadius: 14,
        background: '#181818',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'border-color 200ms ease, transform 200ms cubic-bezier(0.4,0,0.2,1)',
        height: '100%', boxSizing: 'border-box', minHeight: 280,
      }}
    >
      <div style={{
        flexShrink: 0,
        color: hover ? 'var(--ds-accent)' : 'var(--ds-text-mid)',
        transition: 'color 200ms ease',
      }}>
        <Icon size={22} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
        <h3 style={{
          font: '600 15px/1.25 var(--font-display)',
          letterSpacing: '-0.01em',
          color: 'var(--ds-accent)', margin: 0,
        }}>
          {title}
        </h3>
        <p style={{
          font: '400 15px/1.7 var(--font-body)',
          color: '#ffffff', margin: 0,
        }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" style={{ padding: '125px 0 0', background: 'var(--ds-bg-0)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>

        <RevealWrapper>
          <div className="lg-section-head" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 64, alignItems: 'start', marginBottom: 56,
          }}>
            <h2 style={{
              font: '600 clamp(24px, 3vw, 42px)/1.12 var(--font-display)',
              letterSpacing: '-0.025em', color: 'var(--ds-text-high)', margin: 0,
            }}>
              {C.feat_h2}
            </h2>
            <p style={{
              font: '400 17px/1.6 var(--font-body)', color: 'var(--ds-text-mid)',
              margin: 0, paddingTop: 8,
            }}>
              {br(C.feat_sub)}
            </p>
          </div>
        </RevealWrapper>

        <div
          className="lg-feature-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch' }}
        >
          {FEATURES.map((f, i) => (
            <RevealWrapper key={i} delay={i * 60}>
              <FeatureCard {...f} />
            </RevealWrapper>
          ))}
        </div>

      </div>
    </section>
  );
}

window.Features = Features;
