import { CoinIcon, FrameIcon, LayersIcon, SparkIcon } from './numismaticIcons'
import { br, RevealWrapper } from '../utils/text'
import type { Content } from '../content/types'
import type { ComponentType, SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> { size?: number }
interface StepData { icon: ComponentType<IconProps>; title: string }

interface Props { content: Content }

function Step({ step }: { step: StepData }) {
  return (
    <div className="lg-workflow-step" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      padding: '4px 12px 0', position: 'relative',
    }}>
      {/* Medalla acuñada: metal oscuro con doble anillo dorado e icono grabado */}
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
          <step.icon size={24} />
        </div>
      </div>
      <h3 style={{
        font: '600 18px/1.25 var(--font-display)', letterSpacing: '-0.01em',
        color: 'var(--ds-text-high)', margin: 0, textAlign: 'center',
      }}>
        {br(step.title)}
      </h3>
    </div>
  )
}

export default function Workflow({ content: C }: Props) {
  const STEPS: StepData[] = [
    { icon: CoinIcon,   title: C.paso1_titulo },
    { icon: FrameIcon,  title: C.paso2_titulo },
    { icon: LayersIcon, title: C.paso3_titulo },
    { icon: SparkIcon,  title: C.paso4_titulo },
  ]

  return (
    <section id="workflow" style={{ padding: '125px 0 0', background: 'var(--ds-bg-0)' }}>
      <style>{`
        .lg-workflow-badge {
          transition: border-color 220ms ease, transform 260ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms ease;
        }
        .lg-workflow-step:hover .lg-workflow-badge {
          border-color: var(--ds-accent) !important;
          transform: scale(1.06);
          box-shadow: inset 0 1px 1px rgba(255,248,222,0.16), inset 0 -8px 14px rgba(0,0,0,0.55), 0 0 24px rgba(201,168,76,0.22) !important;
        }

        /* Gráfila: hilos de cuentas doradas que emanan del logo hacia los cuatro pasos */
        html.js .lg-workflow-lines path { opacity: 0; }
        [data-reveal].is-revealed .lg-workflow-lines path { animation: lgLineFade 0.8s ease forwards; }
        .lg-workflow-lines path:nth-child(2) { animation-delay: 150ms; }
        .lg-workflow-lines path:nth-child(3) { animation-delay: 300ms; }
        .lg-workflow-lines path:nth-child(4) { animation-delay: 450ms; }
        @keyframes lgLineFade { to { opacity: 1; } }
        @media (max-width: 1024px) {
          .lg-workflow-lines { display: none; }
          .lg-workflow-anchor { margin-bottom: 32px; }
        }
        @media (prefers-reduced-motion: reduce) {
          html.js .lg-workflow-lines path { opacity: 1; animation: none; }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <RevealWrapper>
          <h2 style={{ font: '600 clamp(28px, 3.5vw, 48px)/1.12 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-heading)', margin: '0 auto 36px', textAlign: 'center', maxWidth: 760 }}>
            {br(C.pasos_h2)}
          </h2>
        </RevealWrapper>
        <RevealWrapper delay={120}>
          <div className="lg-workflow-anchor" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src="/LogoConTituloHorizontalTrans.svg"
              alt="Legado"
              style={{
                height: 56, width: 'auto', display: 'block',
                filter: 'drop-shadow(0 0 18px rgba(201,168,76,0.25))',
              }}
            />
            <svg
              className="lg-workflow-lines"
              viewBox="0 0 1200 72"
              preserveAspectRatio="none"
              aria-hidden="true"
              fill="none"
              style={{ width: '100%', height: 72, display: 'block', overflow: 'visible' }}
            >
              <path d="M600 4 C 600 46, 150 28, 150 70"   stroke="rgba(201,168,76,0.5)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 8" />
              <path d="M600 4 C 600 46, 450 30, 450 70"   stroke="rgba(201,168,76,0.5)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 8" />
              <path d="M600 4 C 600 46, 750 30, 750 70"   stroke="rgba(201,168,76,0.5)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 8" />
              <path d="M600 4 C 600 46, 1050 28, 1050 70" stroke="rgba(201,168,76,0.5)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 8" />
            </svg>
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
