import { CoinIcon, FrameIcon, LayersIcon, SparkIcon } from './numismaticIcons'
import { br, RevealWrapper } from '../utils/text'
import type { Content } from '../content/types'
import type { ComponentType, SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> { size?: number }
interface StepData { icon: ComponentType<IconProps>; title: string }

interface Props { content: Content }

/* Medalla acuñada: metal oscuro con doble anillo dorado e icono grabado */
function Badge({ icon: Icon }: { icon: ComponentType<IconProps> }) {
  return (
    <div className="lg-workflow-badge" style={{
      width: 76, height: 76, borderRadius: '50%',
      background: 'radial-gradient(circle at 32% 26%, #2e2818 0%, #1c1810 48%, #141210 100%)',
      border: '1px solid rgba(201,168,76,0.45)',
      boxShadow: 'inset 0 1px 1px rgba(255,248,222,0.16), inset 0 -8px 14px rgba(0,0,0,0.55), 0 6px 18px rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--ds-accent)', position: 'relative', zIndex: 1,
    }}>
      <div style={{
        position: 'absolute', inset: 6, borderRadius: '50%',
        border: '1px solid rgba(201,168,76,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} />
      </div>
    </div>
  )
}

/* Versión móvil/tablet: pila de medallas con título */
function Step({ step }: { step: StepData }) {
  return (
    <div className="lg-workflow-step" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      padding: '4px 12px 0', position: 'relative',
    }}>
      <Badge icon={step.icon} />
      <h3 style={{
        font: '600 18px/1.25 var(--font-display)', letterSpacing: '-0.01em',
        color: 'var(--ds-text-high)', margin: 0, textAlign: 'center',
      }}>
        {br(step.title)}
      </h3>
    </div>
  )
}

const titleStyle = {
  font: '600 18px/1.3 var(--font-display)', letterSpacing: '-0.01em',
  color: 'var(--ds-text-high)', margin: 0,
} as const

export default function Workflow({ content: C }: Props) {
  const STEPS: StepData[] = [
    { icon: CoinIcon,   title: C.paso1_titulo },
    { icon: FrameIcon,  title: C.paso2_titulo },
    { icon: LayersIcon, title: C.paso3_titulo },
    { icon: SparkIcon,  title: C.paso4_titulo },
  ]

  // Geometría de la moneda: caja 620, centro 310, gráfila r=250,
  // medallas sobre la gráfila en las diagonales (offset = 250/√2 ≈ 177)
  const OFF = 177
  const medalPos = [
    { left: `calc(50% - ${OFF + 38}px)`, top: 310 - OFF - 38 }, // NO → paso 1
    { left: `calc(50% + ${OFF - 38}px)`, top: 310 - OFF - 38 }, // NE → paso 2
    { left: `calc(50% - ${OFF + 38}px)`, top: 310 + OFF - 38 }, // SO → paso 3
    { left: `calc(50% + ${OFF - 38}px)`, top: 310 + OFF - 38 }, // SE → paso 4
  ]
  const labelPos = [
    { right: `calc(50% + ${OFF + 58}px)`, top: 310 - OFF - 38, textAlign: 'right' as const },  // NO
    { left:  `calc(50% + ${OFF + 58}px)`, top: 310 - OFF - 38, textAlign: 'left' as const },   // NE
    { right: `calc(50% + ${OFF + 58}px)`, top: 310 + OFF - 38, textAlign: 'right' as const },  // SO
    { left:  `calc(50% + ${OFF + 58}px)`, top: 310 + OFF - 38, textAlign: 'left' as const },   // SE
  ]

  return (
    <section id="workflow" style={{ padding: '125px 0 0', background: 'var(--ds-bg-0)' }}>
      <style>{`
        .lg-workflow-badge {
          transition: border-color 220ms ease, transform 260ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease;
        }
        .lg-workflow-step:hover .lg-workflow-badge,
        .lg-workflow-medal:hover .lg-workflow-badge {
          border-color: var(--ds-accent) !important;
          transform: scale(1.06);
          box-shadow: inset 0 1px 1px rgba(255,248,222,0.16), inset 0 -8px 14px rgba(0,0,0,0.55), 0 0 24px rgba(201,168,76,0.22) !important;
        }

        /* Deriva lenta de las monedas de la vitrina */
        .lg-coin-float {
          animation: lgCoinFloat var(--dur, 11s) ease-in-out var(--delay, 0s) infinite alternate;
        }
        @keyframes lgCoinFloat {
          from { transform: translateY(-6px) rotate(var(--rot, 0deg)); }
          to   { transform: translateY(8px)  rotate(calc(var(--rot, 0deg) + 3deg)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lg-coin-float { animation: none; }
        }

        /* Moneda solo en escritorio; en móvil/tablet, pila de medallas */
        @media (min-width: 1025px) {
          .lg-workflow-track  { display: none !important; }
          .lg-workflow-anchor { display: none !important; }
        }
        @media (max-width: 1024px) {
          .lg-workflow-coin-wrap { display: none; }
          .lg-workflow-anchor { margin-bottom: 32px; }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <RevealWrapper>
          <h2 style={{ font: '600 clamp(28px, 3.5vw, 48px)/1.12 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-heading)', margin: '0 auto 36px', textAlign: 'center', maxWidth: 760 }}>
            {br(C.pasos_h2)}
          </h2>
        </RevealWrapper>

        {/* ESCRITORIO: gran moneda con gráfila, logo como motivo central y medallas engarzadas */}
        <RevealWrapper delay={120}>
          <div className="lg-workflow-coin-wrap" style={{
            position: 'relative', width: 'min(1100px, 100%)', height: 620, margin: '0 auto',
          }}>
            <svg
              viewBox="0 0 620 620"
              aria-hidden="true"
              fill="none"
              style={{
                position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
                width: 620, height: 620,
              }}
            >
              {/* Gráfila exterior */}
              <circle cx="310" cy="310" r="250" stroke="rgba(201,168,76,0.5)" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 10" />
              {/* Anillo interior fino */}
              <circle cx="310" cy="310" r="232" stroke="rgba(201,168,76,0.18)" strokeWidth="1" />
            </svg>

            {/* Motivo central */}
            <img
              src="/LogoConTituloHorizontalTrans.svg"
              alt="Legado"
              style={{
                position: 'absolute', left: '50%', top: 310, transform: 'translate(-50%, -50%)',
                height: 68, width: 'auto', display: 'block',
                filter: 'drop-shadow(0 0 18px rgba(201,168,76,0.25))',
              }}
            />

            {/* Monedas reales suspendidas dentro del círculo, como en una vitrina.
                Posiciones calculadas para no solaparse con medallas (diagonales ±139..±215,
                y 95-171 / 449-525) ni con el logo central (y 276-344, x ±115). */}
            {/* Tamaños proporcionales al diámetro real de cada pieza (3 px/mm):
                denario 19mm, trióbolo Ptolomeo III 43,5mm, rupia 21mm, 4 escudos Carlos III 30mm,
                cobre carlista 30mm, dracma parto 20mm, dinar al-Hakam II 22mm, 8 reales 39mm */}
            {[
              // Anillo homogéneo: 8 posiciones equiespaciadas (N/S/E/O a r≈160, diagonales a r≈113)
              { src: '/assets/Moneda2.webp', size: 130, left: 'calc(50% - 65px)',  top: 90,  opacity: 0.30, dur: '12s',   delay: '0.8s', rot: '-10deg', blur: 0 },   // N  trióbolo
              { src: '/assets/Moneda7.webp', size: 66,  left: 'calc(50% + 80px)',  top: 164, opacity: 0.33, dur: '13s',   delay: '1.6s', rot: '14deg',  blur: 0 },   // NE dinar
              { src: '/assets/Moneda4.webp', size: 90,  left: 'calc(50% + 125px)', top: 265, opacity: 0.33, dur: '13.5s', delay: '1.2s', rot: '10deg',  blur: 0 },   // E  4 escudos
              { src: '/assets/Moneda3.webp', size: 63,  left: 'calc(50% + 82px)',  top: 392, opacity: 0.27, dur: '12.5s', delay: '2s',   rot: '8deg',   blur: 0 },   // SE rupia
              { src: '/assets/Moneda8.webp', size: 117, left: 'calc(50% - 58px)',  top: 414, opacity: 0.33, dur: '14s',   delay: '0.4s', rot: '-5deg',  blur: 0 },   // S  8 reales
              { src: '/assets/Moneda6.webp', size: 60,  left: 'calc(50% - 143px)', top: 393, opacity: 0.28, dur: '9.5s',  delay: '0.6s', rot: '-16deg', blur: 0.5 }, // SO dracma
              { src: '/assets/Moneda5.webp', size: 90,  left: 'calc(50% - 215px)', top: 265, opacity: 0.22, dur: '10.5s', delay: '2.4s', rot: '18deg',  blur: 0.7 }, // O  carlista
              { src: '/assets/Moneda1.webp', size: 57,  left: 'calc(50% - 142px)', top: 169, opacity: 0.34, dur: '11s',   delay: '0s',   rot: '-6deg',  blur: 0 },   // NO denario
            ].map((c, i) => (
              <img
                key={i}
                className="lg-coin-float"
                src={c.src}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute', left: c.left, top: c.top,
                  width: c.size, height: 'auto',
                  opacity: c.opacity,
                  filter: `${c.blur ? `blur(${c.blur}px) ` : ''}contrast(1.18) brightness(1.08)`,
                  pointerEvents: 'none',
                  ['--dur' as string]: c.dur,
                  ['--delay' as string]: c.delay,
                  ['--rot' as string]: c.rot,
                }}
              />
            ))}

            {/* Medallas engarzadas en la gráfila */}
            {STEPS.map((step, i) => (
              <div key={i} className="lg-workflow-medal" style={{ position: 'absolute', ...medalPos[i] }}>
                <Badge icon={step.icon} />
              </div>
            ))}

            {/* Leyendas a los lados */}
            {STEPS.map((step, i) => (
              <div key={i} style={{
                position: 'absolute', ...labelPos[i],
                width: 260, height: 76,
                display: 'flex', alignItems: 'center',
                justifyContent: labelPos[i].textAlign === 'right' ? 'flex-end' : 'flex-start',
              }}>
                <h3 style={{ ...titleStyle, textAlign: labelPos[i].textAlign, whiteSpace: 'nowrap' }}>{br(step.title)}</h3>
              </div>
            ))}
          </div>
        </RevealWrapper>

        {/* MÓVIL/TABLET: logo + pila de medallas */}
        <RevealWrapper delay={120}>
          <div className="lg-workflow-anchor" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src="/LogoConTituloHorizontalTrans.svg"
              alt="Legado"
              style={{
                height: 48, width: 'auto', display: 'block',
                filter: 'drop-shadow(0 0 18px rgba(201,168,76,0.25))',
              }}
            />
          </div>
        </RevealWrapper>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }} className="lg-workflow-track">
          {STEPS.map((step, i) => (
            <RevealWrapper key={i} delay={i * 100}>
              <Step step={step} />
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
