/* global React */
const { AppleIcon, WindowsIcon } = window.LegadoIcons;
const { RevealWrapper } = window;
const C = window.C;
const br = (s, cls) => s.split(/\n|<br\s*\/?>/i).reduce((a,l,i) => i===0?[l]:[...a,React.createElement('br',{key:i, ...(cls?{className:cls}:{})}),l],[]);

const isMac = /Mac/.test(navigator.userAgent) || /Mac/.test(navigator.platform || '');

const MAC_URL = 'https://github.com/pivsrex/Legado-releases/releases/download/v1.1.7/Legado-1.1.7-arm64.dmg';
const WIN_URL = 'https://github.com/pivsrex/Legado-releases/releases/download/v1.1.7/Legado-Setup-1.1.7.exe';
const BUY_URL = 'https://legadonumis.lemonsqueezy.com/checkout/buy/fbc0bc5f-e323-44a6-b007-9fe0cb707efa';


function Hero() {
  const s = {
    section: {
      position: 'relative',
      paddingTop: 140,
      paddingBottom: 0,
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      top: -80, left: '50%', transform: 'translateX(-50%)',
      width: 1400, height: 700,
      background: 'radial-gradient(ellipse 55% 55% at 50% 25%, rgba(201,168,76,0.16), rgba(201,168,76,0.04) 45%, transparent 70%)',
      pointerEvents: 'none', zIndex: 0,
    },
    container: {
      maxWidth: 1200, margin: '0 auto', padding: '0 32px',
      position: 'relative', zIndex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
    },
    h1: {
      font: '700 clamp(32px, 5vw, 68px)/1.06 var(--font-display)',
      letterSpacing: '-0.035em',
      color: 'var(--ds-text-high)',
      textAlign: 'center',
      margin: 0,
    },
    sub: {
      font: '400 clamp(16px, 1.6vw, 20px)/1.65 var(--font-body)',
      color: 'var(--ds-text-mid)',
      maxWidth: 920, textAlign: 'center', margin: 0,
    },
    ctaWrap: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      marginTop: 4,
    },
    btnPri: {
      background: 'var(--ds-accent)', color: '#0a0908',
      border: 'none', borderRadius: 12,
      padding: '14px 32px',
      font: '600 16px/1 var(--font-display)', letterSpacing: '-0.01em',
      display: 'inline-flex', alignItems: 'center', gap: 10,
      transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1), background 200ms ease',
      boxShadow: '0 6px 28px rgba(201,168,76,0.22)',
      textDecoration: 'none',
    },
    otherOs: {
      display: 'inline-flex', alignItems: 'center', gap: 7,
      font: '400 13px/1 var(--font-body)',
      color: 'var(--ds-text-low)',
      textDecoration: 'none',
      transition: 'color 150ms ease',
    },
    videoWrap: {
      width: '100%', marginTop: 40,
      borderRadius: '18px 18px 0 0',
      overflow: 'hidden',
      border: '1px solid var(--ds-border-low)',
      borderBottom: 'none',
      boxShadow: '0 -4px 60px rgba(201,168,76,0.06), 0 40px 80px rgba(0,0,0,0.5)',
      background: 'var(--ds-bg-1)',
      position: 'relative',
    },
    videoGradient: {
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
      background: 'linear-gradient(to top, var(--ds-bg-0), transparent)',
      pointerEvents: 'none', zIndex: 1,
    },
  };

  const hoverPri  = (e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'var(--ds-accent-hi)'; };
  const leavePri  = (e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--ds-accent)'; };
  const hoverOther = (e) => e.currentTarget.style.color = 'var(--ds-text-mid)';
  const leaveOther = (e) => e.currentTarget.style.color = 'var(--ds-text-low)';

  return (
    <section style={s.section}>
      <style>{`
        @media (min-width: 820px) {
          .hero-h1  { white-space: nowrap; }
          .hero-sub { white-space: nowrap; }
        }
        .hero-br { display: none; }
        @media (max-width: 819px) {
          .hero-br { display: initial; }
        }
        .hero-mobile-notice { display: none; }
        @media (max-width: 819px) {
          .hero-mobile-notice { display: flex; }
          .hero-other-os { display: none; }
        }
      `}</style>
      <div style={s.glow} />
      <div style={s.container}>

        <RevealWrapper delay={80}>
          <h1 style={s.h1} className="hero-h1">{br(C.hero_h1, 'hero-br')}</h1>
        </RevealWrapper>

        <RevealWrapper delay={180}>
          <p style={s.sub} className="hero-sub">{br(C.hero_sub, 'hero-br')}</p>
        </RevealWrapper>

        <div className="hero-mobile-notice" style={{
          alignItems: 'center', gap: 10,
          background: 'rgba(201,168,76,0.07)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 12, padding: '12px 16px',
          maxWidth: 380,
        }}>
          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>💻</span>
          <p style={{ font: '400 13px/1.6 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0, textAlign: 'center' }}>
            {(window.LANG || 'es') === 'en' ? (
              <>Legado is a desktop app.<br />Visit this page from your Mac or PC<br />to download it.</>
            ) : (
              <>Legado es una aplicación de escritorio.<br />Visita esta web desde tu Mac o PC<br />para descargarla.</>
            )}
          </p>
        </div>

        <RevealWrapper delay={280}>
          <div style={s.ctaWrap}>
            <a
              href={BUY_URL}
              style={s.btnPri}
              onMouseEnter={hoverPri} onMouseLeave={leavePri}
            >
              {isMac ? <AppleIcon size={20} /> : <WindowsIcon size={20} />}
              {C.hero_btn_mac}
            </a>
          </div>
        </RevealWrapper>

        <RevealWrapper delay={440} style={{ width: '100%' }}>
          <div style={s.videoWrap}>
            <div style={s.videoGradient} />
            <video autoPlay muted loop playsInline style={{ width: '100%', display: 'block' }}>
              <source src={C.asset_hero} type="video/mp4" />
            </video>
          </div>
        </RevealWrapper>

      </div>
    </section>
  );
}

window.Hero = Hero;
