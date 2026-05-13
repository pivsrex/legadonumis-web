/* global React */
const { useState: navUseState, useEffect: navUseEffect } = React;
const { AppleIcon, WindowsIcon } = window.LegadoIcons;
const C = window.C;

const isMac = /Mac/.test(navigator.userAgent) || /Mac/.test(navigator.platform || '');

const BUY_URL = 'https://legadonumis.lemonsqueezy.com/checkout/buy/fbc0bc5f-e323-44a6-b007-9fe0cb707efa';

function Navbar() {
  const [scrolled, setScrolled] = navUseState(false);
  navUseEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const s = {
    nav: {
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64,
      background: scrolled ? 'rgba(10,9,8,0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px) saturate(140%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(140%)' : 'none',
      borderBottom: scrolled ? '1px solid var(--ds-border-low)' : '1px solid transparent',
      transition: 'background 300ms ease, border-color 300ms ease',
    },
    inner: {
      maxWidth: 1200, margin: '0 auto', height: '100%',
      padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    brand: { display: 'flex', alignItems: 'center', textDecoration: 'none' },
    logo: { height: 39, width: 'auto', objectFit: 'contain', display: 'block' },
    links: { display: 'flex', gap: 28 },
    link: {
      font: '400 14px/1 var(--font-body)',
      color: 'var(--ds-text-high)',
      textDecoration: 'none',
      transition: 'opacity 150ms ease',
    },
    btn: {
      background: 'var(--ds-accent)', color: '#0a0908',
      border: 'none', borderRadius: 10,
      padding: '10px 18px',
      font: '600 14px/1 var(--font-display)', letterSpacing: '-0.01em',
      display: 'inline-flex', alignItems: 'center', gap: 8,
      transition: 'transform 200ms ease, background 200ms ease',
      textDecoration: 'none', height: 38, boxSizing: 'border-box',
    },
  };

  const hoverLink  = (e) => e.currentTarget.style.opacity = '0.65';
  const leaveLink  = (e) => e.currentTarget.style.opacity = '1';
  const hoverBtn   = (e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'var(--ds-accent-hi)'; };
  const leaveBtn   = (e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--ds-accent)'; };

  return (
    <nav style={s.nav}>
      <div style={s.inner}>

        <a href="#" style={s.brand}>
          <img src="LogoConTituloHorizontalTrans.svg" alt="Legado" style={s.logo} />
        </a>

        <div style={s.links} className="lg-nav-links">
          <a href="#workflow"  style={s.link} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Experiencia</a>
          <a href="#versiones" style={s.link} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Versiones</a>
          <a href="#faq"       style={s.link} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Preguntas</a>
          <a href="mailto:contacto@legadonumis.com" style={s.link} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Contacto</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ font: '400 13px/1 var(--font-body)', color: 'var(--ds-text-high)', letterSpacing: '0.04em' }}>ES</span>
            <span style={{ font: '400 13px/1 var(--font-body)', color: 'var(--ds-text-low)', padding: '0 5px' }}>·</span>
            <span style={{ font: '400 13px/1 var(--font-body)', color: 'var(--ds-text-low)', letterSpacing: '0.04em' }}>EN</span>
          </div>
          <div className="lg-nav-btns">
            <a
              href={BUY_URL}
              style={s.btn}
              onMouseEnter={hoverBtn} onMouseLeave={leaveBtn}
            >
              {isMac ? <AppleIcon size={14} /> : <WindowsIcon size={14} />}
              {isMac ? C.nav_btn_mac : C.nav_btn_win}
            </a>
          </div>
        </div>

      </div>
    </nav>
  );
}

window.Navbar = Navbar;
