import { CoinIcon, HistoryIcon, LayersIcon, SparkIcon } from './numismaticIcons'
import { br, RevealWrapper } from '../utils/text'
import type { Content } from '../content/types'
import type { ComponentType, SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> { size?: number }
interface StepData { n: string; icon: ComponentType<IconProps>; title: string; body: string }

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
        <span style={{
          position: 'absolute', top: -8, right: -8,
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--ds-bg-1)', border: '1px solid var(--ds-border-mid)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: '600 10px/1 var(--font-mono)', color: 'var(--ds-text-mid)',
        }}>
          {step.n}
        </span>
      </div>
      <h3 style={{
        font: '600 18px/1.25 var(--font-display)', letterSpacing: '-0.01em',
        color: 'var(--ds-text-high)', margin: 0, textAlign: 'center',
      }}>
        {step.title}
      </h3>
      <p style={{
        font: '400 14px/1.65 var(--font-body)', color: 'var(--ds-text-mid)',
        margin: 0, textAlign: 'center', whiteSpace: 'pre-line',
      }}>
        {step.body}
      </p>
    </div>
  )
}

export default function Workflow({ content: C }: Props) {
  const STEPS: StepData[] = [
    { n: '01', icon: CoinIcon,    title: C.paso1_titulo, body: C.paso1_body },
    { n: '02', icon: HistoryIcon, title: C.paso2_titulo, body: C.paso2_body },
    { n: '03', icon: LayersIcon,  title: C.paso3_titulo, body: C.paso3_body },
    { n: '04', icon: SparkIcon,   title: C.paso4_titulo, body: C.paso4_body },
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start', marginBottom: 56 }} className="lg-section-head">
            <h2 style={{ font: '600 clamp(24px, 3vw, 42px)/1.12 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-text-high)', margin: 0 }}>
              {br(C.pasos_h2)}
            </h2>
            <p style={{ font: '400 17px/1.6 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0, paddingTop: 8 }}>
              {br(C.pasos_sub)}
            </p>
          </div>
        </RevealWrapper>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }} className="lg-workflow-track">
          <div style={{ position: 'absolute', top: 36, left: '12.5%', right: '12.5%', height: 1, background: 'var(--ds-border-low)', pointerEvents: 'none' }} />
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
