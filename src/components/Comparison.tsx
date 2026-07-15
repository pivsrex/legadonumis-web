import { useState } from 'react'
import { CheckIcon, AppleIcon, WindowsIcon } from './icons'
import { br, RevealWrapper } from '../utils/text'
import { BUY_URL, MAC_URL, WIN_URL } from '../config'
import type { Content, CompRow } from '../content/types'

interface Props { content: Content }

const isEU  = typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith('Europe/')

function Cell({ value }: { value: CompRow['basico'] }) {
  if (value === true)  return <CheckIcon size={15} style={{ color: 'var(--ds-accent)', display: 'block', margin: '0 auto' }} />
  if (value === false) return <span style={{ font: '400 13px/1 var(--font-mono)', color: 'var(--ds-text-low)' }}>—</span>
  return <span style={{ font: '500 13px/1.4 var(--font-body)', color: 'var(--ds-text-high)', whiteSpace: 'nowrap' }}>{value}</span>
}

export default function Comparison({ content: C }: Props) {
  const [tab, setTab] = useState<'basico' | 'pro'>('pro')

  const s = {
    section: { padding: '125px 0 0', background: 'var(--ds-bg-0)' },
    container: { maxWidth: 1200, margin: '0 auto', padding: '0 32px' },
    thFeat: { padding: '20px 24px 24px', textAlign: 'left' as const, font: '400 13px/1.2 var(--font-body)', color: 'var(--ds-text-low)', borderBottom: '1px solid var(--ds-border-low)', verticalAlign: 'bottom' as const, width: '44%' },
    thPlan: { padding: '24px 24px 24px', textAlign: 'center' as const, borderBottom: '1px solid var(--ds-border-low)', verticalAlign: 'top' as const, width: '28%' },
    tr:     { borderBottom: '1px solid var(--ds-border-low)' },
    tdFeat: { padding: '9px 24px', font: '400 14px/1.4 var(--font-body)', color: 'var(--ds-text-mid)', verticalAlign: 'middle' as const },
    tdVal:  { padding: '9px 24px', textAlign: 'center' as const, verticalAlign: 'middle' as const },
    groupLabel: { padding: '24px 24px 8px', font: '500 11px/1 var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--ds-accent)' },
    btnPri: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', borderRadius: 10, background: 'var(--ds-accent)', color: '#0a0908', border: '1px solid transparent', font: '600 14px/1.3 var(--font-display)', letterSpacing: '-0.01em', textDecoration: 'none', whiteSpace: 'pre-line' as const, textAlign: 'center' as const },
    btnSec: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', borderRadius: 10, background: 'transparent', color: 'var(--ds-text-high)', border: '1px solid var(--ds-border-mid)', font: '600 14px/1.3 var(--font-display)', letterSpacing: '-0.01em', textDecoration: 'none', whiteSpace: 'pre-line' as const, textAlign: 'center' as const },
  }

  const priceMain = isEU ? `${C.full_precio} €` : `${C.full_precio} US$`

  return (
    <section id="versiones" style={s.section}>
      <style>{`
        .comp-mobile { display: none; }
        @media (max-width: 700px) { .comp-desktop { display: none; } .comp-mobile { display: block; } }
        html.is-mac .comp-icon-win, html.is-win .comp-icon-mac { display: none; }
        html.is-mac .comp-btn-win, html.is-win .comp-btn-mac { display: none !important; }
      `}</style>
      <div style={s.container}>
        <RevealWrapper>
          <h2 style={{ font: '600 clamp(28px, 3.5vw, 48px)/1.12 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-heading)', margin: '0 auto 48px', textAlign: 'center', maxWidth: 760 }}>{br(C.comp_h2)}</h2>
        </RevealWrapper>

        <RevealWrapper delay={100}>
          {/* DESKTOP TABLE */}
          <div className="comp-desktop lg-comparison-wrapper" style={{ maxWidth: 1060, margin: '0 auto', background: '#181818', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }} className="lg-comparison">
              <thead>
                <tr>
                  <th style={s.thFeat}></th>
                  <th style={s.thPlan}>
                    <span style={{ font: '600 16px/1 var(--font-display)', letterSpacing: '-0.01em', color: 'var(--ds-text-mid)', display: 'block', marginBottom: 6 }}>{C.comp_plan_basic}</span>
                    <span style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-text-mid)', display: 'block', marginBottom: 14, minHeight: 34 }}>{C.comp_plan_basic_sub}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 16, minHeight: 88 }}>
                      <span style={{ font: '700 22px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--ds-text-high)' }}>{C.comp_plan_basic_price}</span>
                      <span style={{ visibility: 'hidden', font: '400 12px/1.4 var(--font-body)' }}>—</span>
                    </div>
                    <a href={MAC_URL} className="comp-btn-mac lg-btn-shine" style={s.btnSec}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ds-border-high)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ds-border-mid)')}>
                      <AppleIcon size={15} />
                      {C.comp_plan_basic_cta_mac}
                    </a>
                    <a href={WIN_URL} className="comp-btn-win lg-btn-shine" style={s.btnSec}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ds-border-high)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ds-border-mid)')}>
                      <WindowsIcon size={15} />
                      {C.comp_plan_basic_cta_win}
                    </a>
                  </th>
                  <th style={s.thPlan}>
                    <span style={{ font: '600 16px/1 var(--font-display)', letterSpacing: '-0.01em', color: 'var(--ds-accent)', display: 'block', marginBottom: 6 }}>{C.comp_plan_pro}</span>
                    <span style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-text-mid)', display: 'block', marginBottom: 14, minHeight: 34 }}>{C.comp_plan_pro_sub}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 16, minHeight: 88 }}>
                      <span style={{ font: '700 22px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--ds-text-high)' }}>{priceMain}</span>
                      <span style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-accent)', whiteSpace: 'pre-line' }}>{C.comp_price_launch}</span>
                      <span style={{ font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-accent)' }}>{C.comp_license_devices}</span>
                      <span style={{ font: '400 11px/1.4 var(--font-body)', color: 'var(--ds-text-mid)' }}>{C.comp_payment_note}</span>
                    </div>
                    <a href={BUY_URL} className="lg-btn-shine" style={s.btnPri}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                      <span className="comp-icon-mac"><AppleIcon size={15} /></span>
                      <span className="comp-icon-win"><WindowsIcon size={15} /></span>
                      {C.comp_plan_pro_cta}
                    </a>
                  </th>
                </tr>
              </thead>
              <tbody>
                {C.comp_groups.map((group, gi) => (
                  <tr key={gi}>
                    <td colSpan={3} style={{ padding: 0 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr><td colSpan={3} style={s.groupLabel}>{group.label}</td></tr>
                          {group.rows.map((row, ri) => (
                            <tr key={ri} style={s.tr}>
                              <td style={{ ...s.tdFeat, width: '44%' }}>{row.feat}</td>
                              <td style={{ ...s.tdVal, width: '28%' }}><Cell value={row.basico} /></td>
                              <td style={{ ...s.tdVal, width: '28%' }}>
                                <Cell value={row.pro} />
                                {row.cta && (
                                  <a href={row.cta.url} style={{ display: 'inline-block', marginTop: 6, font: '500 11px/1 var(--font-body)', color: 'var(--ds-accent)', textDecoration: 'none', opacity: 0.85 }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}>
                                    {row.cta.label} →
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE TABS */}
          <div className="comp-mobile" style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', margin: '20px 16px 0', background: 'var(--ds-bg-2)', borderRadius: 10, padding: 3, gap: 3 }}>
              {(['basico', 'pro'] as const).map(plan => (
                <button key={plan} onClick={() => setTab(plan)} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none',
                  background: tab === plan ? 'rgba(201,168,76,0.14)' : 'transparent',
                  color: tab === plan ? 'var(--ds-accent)' : 'var(--ds-text-mid)',
                  font: '600 14px/1 var(--font-display)', letterSpacing: '-0.01em', cursor: 'pointer',
                }}>
                  {plan === 'basico' ? C.comp_plan_basic : C.comp_plan_pro}
                </button>
              ))}
            </div>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--ds-border-low)' }}>
              <span style={{ display: 'block', font: '600 16px/1 var(--font-display)', letterSpacing: '-0.01em', color: tab === 'pro' ? 'var(--ds-accent)' : 'var(--ds-text-mid)', marginBottom: 4 }}>
                {tab === 'basico' ? C.comp_plan_basic : C.comp_plan_pro}
              </span>
              <span style={{ display: 'block', font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-text-mid)', marginBottom: 16 }}>
                {tab === 'basico' ? C.comp_plan_basic_sub : C.comp_plan_pro_sub}
              </span>
              {tab === 'basico' ? (
                <span style={{ display: 'block', font: '700 22px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--ds-text-high)', marginBottom: 16 }}>{C.comp_plan_basic_price}</span>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ display: 'block', font: '700 22px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--ds-text-high)' }}>{priceMain}</span>
                  <span style={{ display: 'block', font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-accent)', marginTop: 4, whiteSpace: 'pre-line' }}>{C.comp_price_launch}</span>
                  <span style={{ display: 'block', font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-accent)', marginTop: 2 }}>{C.comp_license_devices}</span>
                  <span style={{ display: 'block', font: '400 11px/1.4 var(--font-body)', color: 'var(--ds-text-mid)', marginTop: 2 }}>{C.comp_payment_note}</span>
                </div>
              )}
              {tab === 'pro' && (
                <a href={BUY_URL} className="lg-btn-shine" style={{ ...s.btnPri, display: 'flex' }}>
                  <span className="comp-icon-mac"><AppleIcon size={15} /></span>
                  <span className="comp-icon-win"><WindowsIcon size={15} /></span>
                  {C.comp_plan_pro_cta}
                </a>
              )}
            </div>
            {C.comp_groups.map((group, gi) => (
              <div key={gi}>
                <div style={{ padding: '16px 20px 6px', font: '500 11px/1 var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ds-accent)' }}>{group.label}</div>
                {group.rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--ds-border-low)' }}>
                    <span style={{ font: '400 14px/1.4 var(--font-body)', color: 'var(--ds-text-mid)', flex: 1, paddingRight: 16 }}>{row.feat}</span>
                    <span style={{ textAlign: 'right', flexShrink: 0 }}>
                      <Cell value={row[tab]} />
                      {row.cta && tab === 'pro' && (
                        <a href={row.cta.url} style={{ display: 'block', marginTop: 4, font: '500 11px/1 var(--font-body)', color: 'var(--ds-accent)', textDecoration: 'none' }}>
                          {row.cta.label} →
                        </a>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </RevealWrapper>

        <RevealWrapper delay={200}>
          <div style={{ maxWidth: 900, margin: '16px auto 0', padding: '0 4px' }}>
            <p style={{ font: '400 13px/1.7 var(--font-body)', color: 'var(--ds-text-low)', margin: 0 }}>{C.comp_footnote1}</p>
            {C.comp_footnote2 && <p style={{ font: '400 13px/1.7 var(--font-body)', color: 'var(--ds-text-low)', margin: '2px 0 0' }}>{C.comp_footnote2}</p>}
          </div>
        </RevealWrapper>
      </div>
    </section>
  )
}
