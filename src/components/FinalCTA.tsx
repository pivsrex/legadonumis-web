import { useEffect, useRef, useState } from 'react'
import { RevealWrapper } from '../utils/text'
import { DISCOUNT_CODE } from '../config'
import type { Content } from '../content/types'

interface Props { content: Content }

/* Puzle de la moneda (solo escritorio):
   4 cuadrantes repartidos alrededor de la moneda fantasma; al arrastrarlos
   (o clicarlos) encajan en su sitio. Completarlo desbloquea la lupa y el
   código de descuento. En móvil se muestra la moneda con lupa, sin puzle. */

const COIN_W = 380
const COIN_H = Math.round(380 * 1600 / 1480) // 411

const PIECES = [
  '/assets/MonedaPuzzle_tl.webp',
  '/assets/MonedaPuzzle_tr.webp',
  '/assets/MonedaPuzzle_bl.webp',
  '/assets/MonedaPuzzle_br.webp',
]

// Geometría de las piezas con pestañas de puzle: cada recorte es un cuadrante
// de 740×800 (imagen original 1480×1600) más un margen M=150 para la pestaña.
const S = COIN_W / 1480
const PIECE_W = (740 + 150) * S
const HOMES = [
  { left: 0,               top: 0 },
  { left: (740 - 150) * S, top: 0 },
  { left: 0,               top: (800 - 150) * S },
  { left: (740 - 150) * S, top: (800 - 150) * S },
]

// Desplazamiento inicial de cada pieza respecto a su posición final, y rotación
const START = [
  { x: -168, y: -52, r: -8 },
  { x:  168, y: -52, r:  7 },
  { x: -168, y:  56, r: -5 },
  { x:  168, y:  56, r:  9 },
]
const SNAP = 48

type Mode = 'static' | 'lupa' | 'puzzle' | 'solved'

export default function FinalCTA({ content: C }: Props) {
  const [mode, setMode] = useState<Mode>('static')
  const [pos, setPos] = useState(START.map(s => ({ ...s })))
  const [placed, setPlaced] = useState([false, false, false, false])
  const [copied, setCopied] = useState(false)
  const drag = useRef<{ i: number; px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let solved = false
    try { solved = localStorage.getItem('lg_puzzle_ok') === '1' } catch { /* sin storage */ }
    const desktop = window.matchMedia('(min-width: 1025px)').matches
    if (!desktop) setMode('lupa')
    else setMode(solved ? 'solved' : 'puzzle')
  }, [])

  function colocar(i: number) {
    setPos(p => p.map((v, j) => (j === i ? { x: 0, y: 0, r: 0 } : v)))
    setPlaced(p => {
      const next = p.map((v, j) => (j === i ? true : v))
      if (next.every(Boolean)) {
        try { localStorage.setItem('lg_puzzle_ok', '1') } catch { /* sin storage */ }
        setTimeout(() => setMode('solved'), 550)
      }
      return next
    })
  }

  function onPieceDown(i: number, e: React.PointerEvent<HTMLImageElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { i, px: e.clientX, py: e.clientY, ox: pos[i].x, oy: pos[i].y, moved: false }
  }

  function onPieceMove(e: React.PointerEvent<HTMLImageElement>) {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.px
    const dy = e.clientY - d.py
    if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true
    setPos(p => p.map((v, j) => (j === d.i ? { ...v, x: d.ox + dx, y: d.oy + dy } : v)))
  }

  function onPieceUp(e: React.PointerEvent<HTMLImageElement>) {
    const d = drag.current
    if (!d) return
    drag.current = null
    const v = pos[d.i]
    // Clic sin arrastre (accesibilidad) o soltada cerca de su sitio → encaja
    if (!d.moved || Math.hypot(v.x, v.y) < SNAP) colocar(d.i)
  }

  // ── Lupa: solo en escritorio tras resolver el puzle.
  //    En móvil no tiene sentido: el dedo tapa la zona ampliada. ──
  function lensMove(e: React.PointerEvent<HTMLDivElement>) {
    if (mode !== 'solved') return
    const wrap = wrapRef.current
    const lens = lensRef.current
    if (!wrap || !lens) return
    const r = wrap.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (x < 0 || y < 0 || x > r.width || y > r.height) return
    if (!lens.style.backgroundImage) {
      lens.style.backgroundImage = 'url("/assets/MonedaIconica.webp")'
    }
    const zoom = 2.8
    lens.style.left = `${x}px`
    lens.style.top = `${y}px`
    lens.style.backgroundSize = `${r.width * zoom}px auto`
    const half = lens.offsetWidth / 2
    lens.style.backgroundPosition = `${half - x * zoom}px ${half - y * zoom}px`
    wrap.classList.add('is-active')
  }

  function copiarCodigo() {
    try {
      navigator.clipboard.writeText(DISCOUNT_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch { /* clipboard no disponible */ }
  }

  const conLupa = mode === 'lupa' || mode === 'solved' || mode === 'static'

  return (
    <>
      <style>{`
        @keyframes ctaGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes lgPuzzleDone {
          0%   { filter: drop-shadow(0 0 0 rgba(201,168,76,0)); }
          40%  { filter: drop-shadow(0 0 34px rgba(201,168,76,0.55)); }
          100% { filter: drop-shadow(0 18px 40px rgba(0,0,0,0.55)); }
        }
        .lg-coin-solved { animation: lgPuzzleDone 1.6s ease forwards; }
        .lg-puzzle-piece { transition: transform 240ms cubic-bezier(0.3, 0, 0.2, 1); }
        .lg-puzzle-piece.dragging { transition: none; }
        .lg-code-chip:hover { border-color: var(--ds-accent); }
        @media (prefers-reduced-motion: reduce) {
          .lg-coin-solved { animation: none; }
        }
      `}</style>
      <section style={{ padding: '125px 32px 0', background: 'var(--ds-bg-0)', textAlign: 'center' }}>
        <RevealWrapper>
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
            background: '#181818', border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 20, padding: '64px 48px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div aria-hidden="true" style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '80%', height: 220,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.22) 0%, transparent 70%)',
              animation: 'ctaGlow 9s ease-in-out infinite', pointerEvents: 'none',
            }} />

            {mode === 'puzzle' ? (
              <div style={{ position: 'relative', width: COIN_W, height: COIN_H, marginBottom: 48, zIndex: 1 }}>
                {/* Moneda fantasma como guía */}
                <img
                  src="/assets/MonedaIconica.webp"
                  alt={C.cta_moneda_alt}
                  draggable={false}
                  style={{ width: '100%', display: 'block', opacity: 0.18, filter: 'grayscale(40%)' }}
                />
                {PIECES.map((src, i) => {
                  const home = HOMES[i]
                  const v = pos[i]
                  const dragging = drag.current?.i === i
                  return (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      draggable={false}
                      className={`lg-puzzle-piece${dragging ? ' dragging' : ''}`}
                      onPointerDown={placed[i] ? undefined : (e) => onPieceDown(i, e)}
                      onPointerMove={placed[i] ? undefined : onPieceMove}
                      onPointerUp={placed[i] ? undefined : onPieceUp}
                      style={{
                        position: 'absolute',
                        left: home.left, top: home.top,
                        width: PIECE_W, height: 'auto',
                        transform: `translate(${v.x}px, ${v.y}px) rotate(${v.r}deg)`,
                        cursor: placed[i] ? 'default' : 'grab',
                        touchAction: 'none',
                        zIndex: dragging ? 6 : placed[i] ? 2 : 4,
                        filter: placed[i] ? 'none' : 'drop-shadow(0 10px 22px rgba(0,0,0,0.55))',
                      }}
                    />
                  )
                })}
              </div>
            ) : (
              <div
                ref={wrapRef}
                className={`lg-coin-loupe${mode === 'solved' ? ' lg-coin-solved' : ''}`}
                style={{ position: 'relative', width: `min(${COIN_W}px, 64vw)`, zIndex: 1 }}
                onPointerMove={lensMove}
                onPointerDown={lensMove}
                onPointerLeave={() => wrapRef.current?.classList.remove('is-active')}
              >
                <img
                  src="/assets/MonedaIconica.webp"
                  alt={C.cta_moneda_alt}
                  draggable={false}
                  style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.55))' }}
                />
                {mode === 'solved' && <div ref={lensRef} className="lg-coin-lens" aria-hidden="true" />}
              </div>
            )}

            {mode === 'solved' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                <p style={{ font: '600 15px/1 var(--font-display)', color: 'var(--ds-accent)', margin: 0, letterSpacing: '0.02em' }}>
                  {C.cta_puzzle_done}
                </p>
                <p style={{ font: '400 13px/1.5 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0 }}>
                  {C.cta_discount_label}
                </p>
                <button
                  type="button"
                  className="lg-code-chip"
                  onClick={copiarCodigo}
                  title={copied ? C.cta_code_copied : DISCOUNT_CODE}
                  style={{
                    font: '600 15px/1 var(--font-mono)', letterSpacing: '0.18em',
                    color: 'var(--ds-accent)', background: 'rgba(201,168,76,0.08)',
                    border: '1px dashed rgba(201,168,76,0.5)', borderRadius: 8,
                    padding: '10px 18px', cursor: 'pointer',
                    transition: 'border-color 180ms ease',
                  }}
                >
                  {copied ? C.cta_code_copied : DISCOUNT_CODE}
                </button>
                <p className="lg-coin-hint" style={{ font: '400 12px/1 var(--font-body)', letterSpacing: '0.06em', color: 'var(--ds-text-mid)', margin: '6px 0 0' }}>
                  {C.cta_lupa_hint}
                </p>
              </div>
            ) : mode === 'puzzle' ? (
              <p className="lg-coin-hint" style={{
                font: '400 13px/1 var(--font-body)', letterSpacing: '0.06em',
                color: 'var(--ds-text-mid)', margin: 0, position: 'relative', zIndex: 1,
              }}>
                {C.cta_puzzle_hint}
              </p>
            ) : null}

            <h2 style={{
              font: '700 clamp(32px, 4.5vw, 60px)/1.05 var(--font-display)',
              letterSpacing: '-0.035em', color: 'var(--ds-text-high)', margin: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3em',
              position: 'relative', zIndex: 1,
            }}>
              {C.cta_titulo.split('\n').map((line, i, lines) => {
                // La última palabra ("legado" / "legacy") en dorado: guiño a la marca
                if (i < lines.length - 1) {
                  return <span key={i} style={{ whiteSpace: 'nowrap' }}>{line}</span>
                }
                const corte = line.lastIndexOf(' ')
                return (
                  <span key={i} style={{ whiteSpace: 'nowrap' }}>
                    {line.slice(0, corte + 1)}
                    <span style={{ color: 'var(--ds-accent)' }}>{line.slice(corte + 1)}</span>
                  </span>
                )
              })}
            </h2>
          </div>
        </RevealWrapper>
      </section>
    </>
  )
}
