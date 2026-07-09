import { GridIcon, FrameIcon, ImportIcon, BookmarkIcon, ChartIcon, TagIcon } from './numismaticIcons'
import { br, RevealWrapper } from '../utils/text'
import type { Content } from '../content/types'
import type { ComponentType, SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> { size?: number }
interface FeatureData { icon: ComponentType<IconProps>; title: string; desc: string }
interface Props { content: Content }

function FeatureCard({ icon: Icon, title, desc }: FeatureData) {
  return (
    <div className="lg-feature-card" style={{
      display: 'flex', flexDirection: 'column', gap: 20,
      padding: '28px 24px 32px', borderRadius: 14,
      background: '#181818', border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
      height: '100%', boxSizing: 'border-box', minHeight: 280,
      transition: 'border-color 200ms ease, transform 200ms cubic-bezier(0.4,0,0.2,1)',
    }}>
      <div className="lg-feature-icon" style={{ flexShrink: 0, color: 'var(--ds-text-mid)', transition: 'color 200ms ease' }}>
        <Icon size={22} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
        <h3 style={{ font: '600 15px/1.25 var(--font-display)', letterSpacing: '-0.01em', color: 'var(--ds-accent)', margin: 0 }}>
          {title}
        </h3>
        <p style={{ font: '400 15px/1.7 var(--font-body)', color: '#ffffff', margin: 0 }}>
          {desc}
        </p>
      </div>
    </div>
  )
}

export default function Features({ content: C }: Props) {
  const FEATURES: FeatureData[] = [
    { icon: GridIcon,     title: C.f1_titulo, desc: C.f1_desc },
    { icon: ImportIcon,   title: C.f2_titulo, desc: C.f2_desc },
    { icon: FrameIcon,    title: C.f3_titulo, desc: C.f3_desc },
    { icon: BookmarkIcon, title: C.f4_titulo, desc: C.f4_desc },
    { icon: ChartIcon,    title: C.f5_titulo, desc: C.f5_desc },
    { icon: TagIcon,      title: C.f6_titulo, desc: C.f6_desc },
  ]

  return (
    <section id="features" style={{ padding: '125px 0 0', background: 'var(--ds-bg-0)' }}>
      <style>{`
        .lg-feature-card:hover {
          border-color: rgba(255,255,255,0.12) !important;
          transform: translateY(-2px) !important;
        }
        .lg-feature-card:hover .lg-feature-icon { color: var(--ds-accent) !important; }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <RevealWrapper>
          <h2 style={{ font: '600 clamp(28px, 3.5vw, 48px)/1.12 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-heading)', margin: '0 auto 56px', textAlign: 'center', maxWidth: 760 }}>
            {br(C.feat_h2)}
          </h2>
        </RevealWrapper>
        <div className="lg-feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch' }}>
          {FEATURES.map((f, i) => (
            <RevealWrapper key={i} delay={i * 60}>
              <FeatureCard {...f} />
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
