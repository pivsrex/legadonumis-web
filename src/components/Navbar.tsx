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
      padding: scrolled ? '12px 32px' : '20px 32px',
      background: scrolled ? 'rgba(5,5,5,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--ds-border-low)' : '1px solid transparent',
      boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
      transition: 'padding 280ms ease, background 280ms ease, border-color 280ms ease, box-shadow 280ms ease',
    },
    logo: { height: 28, width: 'auto', display: 'block', objectFit: 'contain' as const },
    links: { display: 'flex', alignItems: 'center', gap: 32 },
    link: { font: '400 14px/1 var(--font-body)', color: 'var(--ds-text-mid)', textDecoration: 'none', transition: 'color 150ms ease' },
    langBtn: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      font: '400 13px/1 var(--font-body)', color: 'var(--ds-text-low)',
      textDecoration: 'none', transition: 'color 150ms ease',
      background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
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
      <a href={lang === 'en' ? '/en/' : '/'}>
        <img src="/LogoConTituloHorizontalTrans.svg" alt="Legado" style={s.logo} />
      </a>

      <div style={s.links} className="lg-nav-links">
        <a href="#workflow"  style={s.link} onMouseEnter={e => (e.currentTarget.style.color = 'var(--ds-text-high)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--ds-text-mid)')}>{C.nav_link_exp}</a>
        <a href="#versiones" style={s.link} onMouseEnter={e => (e.currentTarget.style.color = 'var(--ds-text-high)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--ds-text-mid)')}>{C.nav_link_ver}</a>
        <a href="#faq"       style={s.link} onMouseEnter={e => (e.currentTarget.style.color = 'var(--ds-text-high)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--ds-text-mid)')}>{C.nav_link_faq}</a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="lg-nav-btns">
        <a href={altUrl} style={s.langBtn}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ds-text-mid)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ds-text-low)')}>
          {lang === 'es' ? 'EN' : 'ES'}
        </a>
        <a href={isMac ? MAC_URL : WIN_URL} style={s.btnPri}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
          {isMac ? <AppleIcon size={15} /> : <WindowsIcon size={15} />}
          {isMac ? C.nav_btn_mac : C.nav_btn_win}
        </a>
      </div>
    </nav>
  )
}
