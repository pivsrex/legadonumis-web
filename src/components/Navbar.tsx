import { useState, useEffect } from 'react'
import { AppleIcon, WindowsIcon } from './icons'
import { BUY_URL, MAC_URL, WIN_URL } from '../config'
import type { Content } from '../content/types'

interface Props {
  content: Content
  lang: 'es' | 'en'
  altUrl: string
}

const isMac = typeof navigator !== 'undefined' && (/Mac/.test(navigator.userAgent) || /Mac/.test((navigator as { platform?: string }).platform ?? ''))

export default function Navbar({ content: C, lang, altUrl }: Props) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const s = {
    nav: {
      position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 0,
      background: 'rgba(5,5,5,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--ds-border-low)',
      boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
      transition: 'padding 280ms ease, box-shadow 280ms ease',
    },
    logo: { height: 41, width: 'auto', display: 'block', objectFit: 'contain' as const },
    links: { display: 'flex', alignItems: 'center', gap: 32 },
    link: { font: '400 14px/1 var(--font-body)', color: 'var(--ds-text-high)', textDecoration: 'none', transition: 'color 150ms ease' },
    langBtn: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      font: '500 13px/1 var(--font-display)', color: 'var(--ds-text-high)',
      textDecoration: 'none', transition: 'background 150ms ease, border-color 150ms ease',
      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 20, padding: '6px 11px', cursor: 'pointer', letterSpacing: '0.02em',
    },
    btnPri: {
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '9px 18px', borderRadius: 10,
      background: 'var(--ds-accent)', color: '#0a0908',
      border: 'none', font: '600 14px/1 var(--font-display)',
      letterSpacing: '-0.01em', textDecoration: 'none', transition: 'opacity 200ms ease',
    },
  }

  return (
    <nav style={s.nav}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${scrolled ? 12 : 16}px 32px`, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href={lang === 'en' ? '/en/' : '/'}>
          <img src="/LogoConTituloHorizontalTrans.svg" alt="Legado" style={s.logo} />
        </a>

        <div style={s.links} className="lg-nav-links">
          <a href="#workflow"  style={s.link} onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>{C.nav_link_exp}</a>
          <a href="#versiones" style={s.link} onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>{C.nav_link_ver}</a>
          <a href="#faq"       style={s.link} onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>{C.nav_link_faq}</a>
          <a href="#novedades" style={s.link} onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>{C.nav_link_novedades}</a>
          <a href={`mailto:${C.footer_email}`} style={s.link} onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>{C.nav_link_contact}</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="lg-nav-btns">
          <a href={altUrl} style={s.langBtn}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.26)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
            </svg>
            {lang === 'es' ? 'EN' : 'ES'}
          </a>
          <a href={isMac ? MAC_URL : WIN_URL} style={s.btnPri}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            {isMac ? <AppleIcon size={15} /> : <WindowsIcon size={15} />}
            {isMac ? C.nav_btn_mac : C.nav_btn_win}
          </a>
        </div>
      </div>
    </nav>
  )
}
