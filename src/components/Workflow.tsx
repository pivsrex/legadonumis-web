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
      <div className="lg-workflow-badge" style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--ds-bg-2)', border: '1px solid var(--ds-border-mid)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ds-accent)', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%',
          background: 'var(--ds-accent-ghost)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <step.icon size={22} />
        </div>
      </div>
      <h3 style={{
        font: '600 18px/1.25 var(--font-display)', letterSpacing: '-0.01em',
        color: 'var(--ds-text-high)', margin: 0, textAlign: 'center',
      }}>
        {step.title}
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
        .lg-workflow-badge:hover {
          background: var(--ds-bg-3) !important;
          border-color: var(--ds-accent) !important;
          transform: scale(1.08);
          transition: background 220ms ease, border-color 220ms ease, transform 260ms cubic-bezier(0.34,1.56,0.64,1);
        }
        .lg-workflow-step:hover .lg-workflow-badge { background: var(--ds-bg-3); border-color: var(--ds-accent); transform: scale(1.08); }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <RevealWrapper>
          <h2 style={{ font: '600 clamp(28px, 3.5vw, 48px)/1.12 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-heading)', margin: '0 auto 56px', textAlign: 'center', maxWidth: 760 }}>
            {br(C.pasos_h2)}
          </h2>
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
