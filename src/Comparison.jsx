/* global React */
const br = (s) => s.split(/\n|<br\s*\/?>/i).reduce((a,l,i) => i===0?[l]:[...a,React.createElement('br',{key:i}),l],[]);
const { CheckIcon, AppleIcon, WindowsIcon } = window.LegadoIcons;
const { RevealWrapper } = window;
const { useState: compUseState } = React;
const C = window.C;

const isMac = /Mac/.test(navigator.userAgent) || /Mac/.test(navigator.platform || '');
const isEU = Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith('Europe/');
const BUY_URL = 'https://legadonumis.lemonsqueezy.com/checkout/buy/fbc0bc5f-e323-44a6-b007-9fe0cb707efa';
const MAC_URL = 'https://github.com/pivsrex/Legado-releases/releases/download/v1.1.7/Legado-1.1.7-arm64.dmg';
const WIN_URL = 'https://github.com/pivsrex/Legado-releases/releases/download/v1.1.7/Legado-Setup-1.1.7.exe';

const GROUPS = C.comp_groups;

function Cell({ value }) {
  if (value === true)  return <CheckIcon size={15} style={{ color: 'var(--ds-accent)', display: 'block', margin: '0 auto' }} />;
  if (value === false) return <span style={{ font: '400 13px/1 var(--font-mono)', color: 'var(--ds-text-low)' }}>—</span>;
  return <span style={{ font: '500 13px/1.4 var(--font-body)', color: 'var(--ds-text-high)' }}>{value}</span>;
}

function Comparison() {
  const [tab, setTab] = compUseState('pro');

  const s = {
    section: {
      padding: '125px 0 0',
      background: 'var(--ds-bg-0)',
    },
    container: { maxWidth: 1200, margin: '0 auto', padding: '0 32px' },
    head: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start', marginBottom: 48 },
    h2:   { font: '600 clamp(24px, 3vw, 42px)/1.12 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-text-high)', margin: 0 },
    sub:  { font: '400 17px/1.6 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0, paddingTop: 8 },

    table:  { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
    thFeat: {
      padding: '20px 24px 24px', textAlign: 'left',
      font: '400 13px/1.2 var(--font-body)', color: 'var(--ds-text-low)',
      borderBottom: '1px solid var(--ds-border-low)',
      verticalAlign: 'bottom', width: '44%',
    },
    thPlan: {
      padding: '24px 24px 24px', textAlign: 'center',
      borderBottom: '1px solid var(--ds-border-low)',
      verticalAlign: 'top', width: '28%',
    },
    planName: {
      font: '600 16px/1 var(--font-display)', letterSpacing: '-0.01em',
      display: 'block', marginBottom: 6,
    },
    planSub: {
      font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-text-mid)',
      display: 'block', marginBottom: 14, minHeight: 34,
    },
    priceBlock: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      marginBottom: 16, minHeight: 88,
    },
    priceMain: {
      font: '700 22px/1 var(--font-display)', letterSpacing: '-0.03em',
      color: 'var(--ds-text-high)',
    },
    priceCrossed: {
      font: '400 14px/1 var(--font-body)', color: 'var(--ds-text-mid)',
      textDecoration: 'line-through',
    },
    noteAccent: {
      font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-accent)', whiteSpace: 'pre-line',
    },
    noteSec: {
      font: '400 11px/1.4 var(--font-body)', color: 'var(--ds-text-mid)',
    },
    groupLabel: {
      padding: '24px 24px 8px',
      font: '500 11px/1 var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--ds-accent)',
    },
    tr:     { borderBottom: '1px solid var(--ds-border-low)' },
    tdFeat: {
      padding: '9px 24px',
      font: '400 14px/1.4 var(--font-body)', color: 'var(--ds-text-mid)',
      verticalAlign: 'middle',
    },
    tdVal: { padding: '9px 24px', textAlign: 'center', verticalAlign: 'middle' },
    btnPri: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '11px 16px', borderRadius: 10,
      background: 'var(--ds-accent)', color: '#0a0908',
      border: '1px solid transparent', font: '600 14px/1.3 var(--font-display)', letterSpacing: '-0.01em',
      textDecoration: 'none', transition: 'opacity 200ms ease', whiteSpace: 'pre-line', textAlign: 'center',
    },
    btnSec: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '11px 16px', borderRadius: 10,
      background: 'transparent', color: 'var(--ds-text-high)',
      border: '1px solid var(--ds-border-mid)', font: '600 14px/1.3 var(--font-display)', letterSpacing: '-0.01em',
      textDecoration: 'none', transition: 'border-color 200ms ease', whiteSpace: 'pre-line', textAlign: 'center',
    },
  };

  const tabBtn = (plan) => ({
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: 'none',
    background: tab === plan ? 'rgba(201,168,76,0.14)' : 'transparent',
    color: tab === plan ? 'var(--ds-accent)' : 'var(--ds-text-mid)',
    font: '600 14px/1 var(--font-display)',
    letterSpacing: '-0.01em',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  });

  return (
    <section id="versiones" style={s.section}>
      <style>{`
        .comp-mobile { display: none; }
        @media (max-width: 700px) {
          .comp-desktop { display: none; }
          .comp-mobile  { display: block; }
        }
      `}</style>
      <div style={s.container}>

        <RevealWrapper>
          <div style={s.head} className="lg-section-head">
            <h2 style={s.h2}>{br(C.comp_h2)}</h2>
            <p style={s.sub}>{br(C.comp_sub)}</p>
          </div>
        </RevealWrapper>

        <RevealWrapper delay={100}>

          {/* ── DESKTOP TABLE ── */}
          <div className="comp-desktop lg-comparison-wrapper" style={{ maxWidth: 900, margin: '0 auto', background: '#181818', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={s.table} className="lg-comparison">
              <thead>
                <tr>
                  <th style={s.thFeat}></th>
                  <th style={s.thPlan}>
                    <span style={{ ...s.planName, color: 'var(--ds-text-mid)' }}>{C.comp_plan_basic}</span>
                    <span style={s.planSub}>{C.comp_plan_basic_sub}</span>
                    <div style={s.priceBlock}>
                      <span style={s.priceMain}>{C.comp_plan_basic_price}</span>
                      <span style={{ ...s.noteAccent, visibility: 'hidden' }}>—</span>
                      <span style={{ ...s.noteSec, visibility: 'hidden' }}>—</span>
                    </div>
                    <a href={isMac ? MAC_URL : WIN_URL} style={s.btnSec}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ds-border-high)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--ds-border-mid)'}>
                      {isMac ? <AppleIcon size={15} /> : <WindowsIcon size={15} />}
                      {isMac ? C.comp_plan_basic_cta_mac : C.comp_plan_basic_cta_win}
                    </a>
                  </th>
                  <th style={s.thPlan}>
                    <span style={{ ...s.planName, color: 'var(--ds-accent)' }}>{C.comp_plan_pro}</span>
                    <span style={s.planSub}>{C.comp_plan_pro_sub}</span>
                    <div style={s.priceBlock}>
                      {isEU ? <span style={s.priceMain}>79 €</span> : <span style={s.priceMain}>79 US$</span>}
                      <span style={s.noteAccent}>{C.comp_price_launch}</span>
                      <span style={s.noteSec}>{C.comp_payment_note}</span>
                    </div>
                    <a href={BUY_URL} style={s.btnPri}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                      {isMac ? <AppleIcon size={15} /> : <WindowsIcon size={15} />}
                      {C.comp_plan_pro_cta}
                    </a>
                  </th>
                </tr>
              </thead>
              <tbody>
                {GROUPS.map((group, gi) => (
                  <React.Fragment key={gi}>
                    <tr><td colSpan={3} style={s.groupLabel}>{group.label}</td></tr>
                    {group.rows.map((row, ri) => (
                      <tr key={ri} style={s.tr}>
                        <td style={s.tdFeat}>{row.feat}</td>
                        <td style={s.tdVal}><Cell value={row.basico} /></td>
                        <td style={s.tdVal}>
                          <Cell value={row.pro} />
                          {row.cta && (
                            <a href={row.cta.url} style={{ display: 'inline-block', marginTop: 6, font: '500 11px/1 var(--font-body)', color: 'var(--ds-accent)', textDecoration: 'none', opacity: 0.85 }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}>
                              {row.cta.label} →
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE TABS ── */}
          <div className="comp-mobile" style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 16, overflow: 'hidden' }}>

            {/* Tab switcher */}
            <div style={{ display: 'flex', margin: '20px 16px 0', background: 'var(--ds-bg-2)', borderRadius: 10, padding: 3, gap: 3 }}>
              <button onClick={() => setTab('basico')} style={tabBtn('basico')}>{C.comp_plan_basic}</button>
              <button onClick={() => setTab('pro')}    style={tabBtn('pro')}>{C.comp_plan_pro}</button>
            </div>

            {/* Plan header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--ds-border-low)' }}>
              <span style={{ display: 'block', font: '600 16px/1 var(--font-display)', letterSpacing: '-0.01em', color: tab === 'pro' ? 'var(--ds-accent)' : 'var(--ds-text-mid)', marginBottom: 4 }}>
                {tab === 'basico' ? C.comp_plan_basic : C.comp_plan_pro}
              </span>
              <span style={{ display: 'block', font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-text-mid)', marginBottom: 16 }}>
                {tab === 'basico' ? C.comp_plan_basic_sub : C.comp_plan_pro_sub}
              </span>
              {tab === 'basico' ? (
                <span style={{ display: 'block', font: '700 22px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--ds-text-high)', marginBottom: 16 }}>
                  {C.comp_plan_basic_price}
                </span>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ display: 'block', font: '700 22px/1 var(--font-display)', letterSpacing: '-0.03em', color: 'var(--ds-text-high)' }}>
                    {isEU ? '79 €' : '79 US$'}
                  </span>
                  <span style={{ display: 'block', font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-accent)', marginTop: 4, whiteSpace: 'pre-line' }}>
                    {C.comp_price_launch}
                  </span>
                  <span style={{ display: 'block', font: '400 11px/1.4 var(--font-body)', color: 'var(--ds-text-mid)', marginTop: 2 }}>
                    {C.comp_payment_note}
                  </span>
                </div>
              )}
              {tab === 'pro' && (
                <a
                  href={BUY_URL}
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '12px 16px', borderRadius: 10,
                    background: 'var(--ds-accent)',
                    color: '#0a0908',
                    border: '1px solid transparent',
                    font: '600 14px/1.3 var(--font-display)', letterSpacing: '-0.01em',
                    textDecoration: 'none', whiteSpace: 'pre-line',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {isMac ? <AppleIcon size={15} /> : <WindowsIcon size={15} />}
                  {C.comp_plan_pro_cta}
                </a>
              )}
            </div>

            {/* Feature rows */}
            {GROUPS.map((group, gi) => (
              <React.Fragment key={gi}>
                <div style={{ padding: '16px 20px 6px', font: '500 11px/1 var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ds-accent)' }}>
                  {group.label}
                </div>
                {group.rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--ds-border-low)' }}>
                    <span style={{ font: '400 14px/1.4 var(--font-body)', color: 'var(--ds-text-mid)', flex: 1, paddingRight: 16 }}>
                      {row.feat}
                    </span>
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
              </React.Fragment>
            ))}

          </div>

        </RevealWrapper>

        <RevealWrapper delay={200}>
          <div style={{ maxWidth: 900, margin: '16px auto 0', padding: '0 4px' }}>
            <p style={{ font: '400 13px/1.7 var(--font-body)', color: 'var(--ds-text-low)', margin: 0 }}>
              {C.comp_footnote1}
            </p>
            {C.comp_footnote2 && (
              <p style={{ font: '400 13px/1.7 var(--font-body)', color: 'var(--ds-text-low)', margin: '2px 0 0' }}>
                {C.comp_footnote2}
              </p>
            )}
          </div>
        </RevealWrapper>

      </div>
    </section>
  );
}

window.Comparison = Comparison;
