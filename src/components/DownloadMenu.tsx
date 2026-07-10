import { BUY_URL, MAC_URL, WIN_URL } from '../config'
import type { CSSProperties, ReactNode } from 'react'

/* Botón de descarga con menú desplegable Básico/Pro.
   Sin estado React: el toggle lo maneja el script global de Layout.astro
   (delegación de eventos), de modo que funciona igual en islas y en SSR.
   Sin JavaScript, el botón lleva a la tabla comparativa (#versiones). */

interface Props {
  labels: { pro: string; proSub: string; basic: string; basicSub: string }
  btnStyle: CSSProperties
  center?: boolean
  children: ReactNode
}

export default function DownloadMenu({ labels, btnStyle, center, children }: Props) {
  return (
    <div className="lg-dl" style={{ position: 'relative', display: 'inline-block' }}>
      <a
        href="#versiones"
        data-dl-toggle
        aria-haspopup="true"
        aria-expanded="false"
        className="lg-btn-shine"
        style={btnStyle}
      >
        {children}
        <svg
          className="lg-dl-caret"
          width="11" height="11" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
      <div className={`lg-dl-menu${center ? ' center' : ''}`} role="menu">
        <a className="lg-dl-item pro" href={BUY_URL} role="menuitem">
          <strong>{labels.pro}</strong>
          <span>{labels.proSub}</span>
        </a>
        <a className="lg-dl-item" href={MAC_URL} data-mac={MAC_URL} data-win={WIN_URL} role="menuitem">
          <strong>{labels.basic}</strong>
          <span>{labels.basicSub}</span>
        </a>
      </div>
    </div>
  )
}
