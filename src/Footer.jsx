/* global React */
const C = window.C;

function Footer() {
  const s = {
    foot: { padding: '125px 0 40px', background: 'var(--ds-bg-0)' },
    container: { maxWidth: 1200, margin: '0 auto', padding: '0 32px' },
    grid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 },
    brand: { display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center', textAlign: 'center' },
    logo: { height: 40, width: 'auto', objectFit: 'contain', display: 'block' },
    tagline: { font: '400 14px/1.5 var(--font-body)', color: 'var(--ds-text-mid)', margin: '3px 0 0' },
    email: { font: '400 14px/1 var(--font-mono)', color: 'var(--ds-accent)', textDecoration: 'none', display: 'block', marginTop: 12 },
    colLabel: { font: '500 11px/1 var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ds-text-low)', marginBottom: 18, display: 'block' },
    link: { font: '400 14px/2.2 var(--font-body)', color: 'var(--ds-text-mid)', textDecoration: 'none', display: 'block', transition: 'color 150ms ease' },
    bottom: {
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--ds-border-low)',
      gap: 24, flexWrap: 'wrap',
    },
    copy: { font: '400 12px/1.5 var(--font-mono)', color: 'var(--ds-text-low)' },
    legalRow: { display: 'flex', gap: 24 },
    legalLink: { font: '400 12px/1 var(--font-body)', color: 'var(--ds-text-mid)', textDecoration: 'none', transition: 'color 150ms ease' },
  };

  const hl = (e) => e.currentTarget.style.color = 'var(--ds-text-high)';
  const ll = (e) => e.currentTarget.style.color = 'var(--ds-text-mid)';

  return (
    <footer style={s.foot}>
      <div style={s.container}>
        <div style={s.grid} className="lg-footer-grid">

          <div style={s.brand}>
            <img src="LogoConTituloHorizontalTrans.svg" alt="Legado" style={s.logo} />
            <p style={s.tagline}>{C.footer_tagline}</p>
            <a href={`mailto:${C.footer_email}`} style={s.email}
               onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
               onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              {C.footer_email}
            </a>
          </div>

          <div>
            <span style={s.colLabel}>Producto</span>
            <a href="#workflow"  style={s.link} onMouseEnter={hl} onMouseLeave={ll}>Experiencia</a>
            <a href="#versiones" style={s.link} onMouseEnter={hl} onMouseLeave={ll}>Versiones</a>
          </div>

          <div>
            <span style={s.colLabel}>Soporte</span>
            <a href="#faq"                       style={s.link} onMouseEnter={hl} onMouseLeave={ll}>Preguntas</a>
            <a href={`mailto:${C.footer_email}`} style={s.link} onMouseEnter={hl} onMouseLeave={ll}>Contacto</a>
          </div>

          <div>
            <span style={s.colLabel}>Legal</span>
            <a href="privacidad.html" style={s.link} onMouseEnter={hl} onMouseLeave={ll}>{C.legal_privacidad}</a>
            <a href="terminos.html"   style={s.link} onMouseEnter={hl} onMouseLeave={ll}>{C.legal_terminos}</a>
            <a href="reembolso.html"  style={s.link} onMouseEnter={hl} onMouseLeave={ll}>{C.legal_reembolso}</a>
          </div>

        </div>

        <div style={s.bottom}>
          <div style={s.copy}>{C.footer_copy}</div>
        </div>

      </div>
    </footer>
  );
}

window.Footer = Footer;
