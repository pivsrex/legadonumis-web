import { TwitterIcon, InstagramIcon } from './icons'
import type { Content } from '../content/types'

interface Props { content: Content }

export default function Footer({ content: C }: Props) {
  const s = {
    foot: { padding: '125px 0 40px', background: 'var(--ds-bg-0)' },
    container: { maxWidth: 1200, margin: '0 auto', padding: '0 32px' },
    colLabel: { font: '500 11px/1 var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--ds-text-low)', marginBottom: 18, display: 'block' },
    link: { font: '400 14px/2.2 var(--font-body)', color: 'var(--ds-text-mid)', textDecoration: 'none', display: 'block' },
    bottom: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--ds-border-low)', gap: 24, flexWrap: 'wrap' as const },
  }

  return (
    <footer id="contacto" style={s.foot}>
      <style>{`
        .lg-footer-link:hover { color: var(--ds-text-high) !important; }
        .lg-footer-social:hover { color: var(--ds-text-high) !important; }
      `}</style>
      <div style={s.container}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }} className="lg-footer-grid">

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center', textAlign: 'center' }}>
            <img src="/LogoConTituloHorizontalTrans.svg" alt="Legado" style={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block' }} />
            <p style={{ font: '400 14px/1.5 var(--font-body)', color: 'var(--ds-text-mid)', margin: '3px 0 0' }}>{C.footer_tagline}</p>
            <a href={`mailto:${C.footer_email}`} style={{ font: '400 14px/1 var(--font-mono)', color: 'var(--ds-accent)', textDecoration: 'none', display: 'block', marginTop: 12 }}>
              {C.footer_email}
            </a>
            <div style={{ display: 'flex', gap: 16, marginTop: 14, justifyContent: 'center' }}>
              <a href="https://x.com/LegadoNumis" target="_blank" rel="noopener noreferrer"
                className="lg-footer-social" style={{ color: 'var(--ds-text-mid)', transition: 'color 150ms ease' }}>
                <TwitterIcon size={17} />
              </a>
              <a href="https://www.instagram.com/legadonumis/" target="_blank" rel="noopener noreferrer"
                className="lg-footer-social" style={{ color: 'var(--ds-text-mid)', transition: 'color 150ms ease' }}>
                <InstagramIcon size={17} />
              </a>
            </div>
          </div>

          <div>
            <span style={s.colLabel}>{C.footer_col_product}</span>
            <a href="#showcase"  className="lg-footer-link" style={s.link}>{C.nav_link_exp}</a>
            <a href="#versiones" className="lg-footer-link" style={s.link}>{C.nav_link_ver}</a>
            <a href="#novedades" className="lg-footer-link" style={s.link}>{C.nav_link_novedades}</a>
          </div>

          <div>
            <span style={s.colLabel}>{C.footer_col_support}</span>
            <a href="#faq"                       className="lg-footer-link" style={s.link}>{C.nav_link_faq}</a>
            <a href={`mailto:${C.footer_email}`} className="lg-footer-link" style={s.link}>{C.nav_link_contact}</a>
          </div>

          <div>
            <span style={s.colLabel}>{C.footer_col_legal}</span>
            <a href={C.url_privacy} className="lg-footer-link" style={s.link}>{C.legal_privacidad}</a>
            <a href={C.url_terms}   className="lg-footer-link" style={s.link}>{C.legal_terminos}</a>
            <a href={C.url_refund}  className="lg-footer-link" style={s.link}>{C.legal_reembolso}</a>
          </div>

        </div>
        <div style={s.bottom}>
          <div style={{ font: '400 12px/1.5 var(--font-mono)', color: 'var(--ds-text-low)' }}>{C.footer_copy}</div>
        </div>
      </div>
    </footer>
  )
}
