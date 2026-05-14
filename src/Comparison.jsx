/* global React */
const br = (s) => s.split(/\n|<br\s*\/?>/i).reduce((a,l,i) => i===0?[l]:[...a,React.createElement('br',{key:i}),l],[]);
const { CheckIcon, AppleIcon, WindowsIcon } = window.LegadoIcons;
const { RevealWrapper } = window;
const C = window.C;

const isMac = /Mac/.test(navigator.userAgent) || /Mac/.test(navigator.platform || '');
const isEU = Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith('Europe/');
const MAC_URL = 'https://github.com/pivsrex/Legado-releases/releases/download/v0.8.2/Legado-0.8.2-arm64.dmg';
const WIN_URL = 'https://github.com/pivsrex/Legado-releases/releases/download/v0.8.1/Legado.Setup.0.8.1.exe';
const BUY_URL = 'https://legadonumis.lemonsqueezy.com/checkout/buy/fbc0bc5f-e323-44a6-b007-9fe0cb707efa';

const GROUPS = [
  {
    label: 'Colección',
    rows: [
      { feat: 'Ejemplares registrados',                  basico: 'Hasta 20', pro: 'Ilimitado'  },
      { feat: 'Imágenes, vídeos y documentos adjuntos',  basico: true,       pro: true         },
      { feat: 'Métricas personalizadas',                 basico: true,       pro: true         },
      { feat: 'Post-Its',                                basico: '1',        pro: 'Ilimitados' },
    ],
  },
  {
    label: 'Visualización',
    rows: [
      { feat: 'Galería de imágenes (5 modos)',                  basico: true,      pro: true         },
      { feat: 'Visor comparativo de ejemplares',                basico: true,      pro: true         },
      { feat: 'Cecas sobre mapa actual',                        basico: 'Hasta 5', pro: 'Ilimitadas' },
      { feat: 'Cecas sobre mapa del Imperio Romano (125 d.C.)', basico: false,     pro: true         },
    ],
  },
  {
    label: 'Organización y exportación',
    rows: [
      { feat: 'Importación desde Excel y CSV', basico: true,  pro: true },
      { feat: 'Exportación a Excel y CSV',     basico: false, pro: true },
      { feat: 'Exportación de fichas en PDF',  basico: false, pro: true },
      { feat: 'Diseñador de etiquetas',        basico: false, pro: true },
    ],
  },
  {
    label: 'Funciones avanzadas',
    rows: [
      { feat: 'Anotaciones sobre imágenes',    basico: false,          pro: true         },
      { feat: 'Consultas automáticas a Numista *', basico: 'Hasta 5',   pro: 'Ilimitadas' },
      { feat: 'Contexto histórico con IA **',  basico: 'Hasta 5 usos', pro: 'Ilimitado'  },
    ],
  },
  {
    label: 'Soporte y actualizaciones',
    rows: [
      { feat: 'Actualizaciones', basico: false, pro: true },
      { feat: 'Soporte técnico', basico: false, pro: true },
    ],
  },
];

function Cell({ value }) {
  if (value === true)  return <CheckIcon size={15} style={{ color: 'var(--ds-accent)', display: 'block', margin: '0 auto' }} />;
  if (value === false) return <span style={{ font: '400 13px/1 var(--font-mono)', color: 'var(--ds-text-low)' }}>—</span>;
  return <span style={{ font: '500 13px/1.4 var(--font-body)', color: 'var(--ds-text-high)' }}>{value}</span>;
}

function Comparison() {
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
      verticalAlign: 'bottom', width: '40%',
    },
    thPlan: {
      padding: '24px 24px 24px', textAlign: 'center',
      borderBottom: '1px solid var(--ds-border-low)',
      verticalAlign: 'top', width: '30%',
    },
    planName: {
      font: '600 16px/1 var(--font-display)', letterSpacing: '-0.01em',
      display: 'block', marginBottom: 6,
    },
    planSub: {
      font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-text-mid)',
      display: 'block', marginBottom: 14,
    },
    priceBlock: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      marginBottom: 16,
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
      font: '400 12px/1.4 var(--font-body)', color: 'var(--ds-accent)',
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
      border: 'none', font: '600 13px/1 var(--font-display)', letterSpacing: '-0.01em',
      textDecoration: 'none', transition: 'opacity 200ms ease', whiteSpace: 'nowrap',
    },
    btnSec: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '11px 16px', borderRadius: 10,
      background: 'transparent', color: 'var(--ds-text-high)',
      border: '1px solid var(--ds-border-mid)', font: '500 13px/1 var(--font-display)', letterSpacing: '-0.01em',
      textDecoration: 'none', transition: 'border-color 200ms ease', whiteSpace: 'nowrap',
    },
  };

  return (
    <section id="versiones" style={s.section}>
      <div style={s.container}>

        <RevealWrapper>
          <div style={s.head}>
            <h2 style={s.h2}>{br(C.comp_h2)}</h2>
            <p style={s.sub}>{br(C.comp_sub)}</p>
          </div>
        </RevealWrapper>

        <RevealWrapper delay={100}>
          <div style={{ maxWidth: 900, margin: '0 auto', background: '#181818', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={s.table} className="lg-comparison">
              <thead>
                <tr>
                  <th style={s.thFeat}></th>

                  {/* Legado Básico */}
                  <th style={s.thPlan}>
                    <span style={{ ...s.planName, color: 'var(--ds-text-mid)' }}>Legado Básico</span>
                    <span style={s.planSub}>El inicio de tu museo digital</span>
                    {/* Mismo layout vertical que Pro para alinear precios */}
                    <div style={s.priceBlock}>
                      <span style={{ ...s.priceCrossed, visibility: 'hidden' }}>—</span>
                      <span style={s.priceMain}>Gratis</span>
                      <span style={{ ...s.noteAccent, visibility: 'hidden' }}>—</span>
                      <span style={{ ...s.noteSec, visibility: 'hidden' }}>—</span>
                    </div>
                    <a
                      href={isMac ? MAC_URL : WIN_URL}
                      style={s.btnSec}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ds-border-high)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--ds-border-mid)'}
                    >
                      {isMac ? <AppleIcon size={13} /> : <WindowsIcon size={13} />}
                      {isMac ? 'Descargar para Mac' : 'Descargar para Windows'}
                    </a>
                  </th>

                  {/* Legado Pro */}
                  <th style={s.thPlan}>
                    <span style={{ ...s.planName, color: 'var(--ds-accent)' }}>Legado Pro</span>
                    <span style={s.planSub}>Tu museo digital sin límites</span>
                    <div style={s.priceBlock}>
                      {isEU ? (
                        <>
                          <span style={s.priceCrossed}>79 €</span>
                          <span style={s.priceMain}>59 €</span>
                        </>
                      ) : (
                        <>
                          <span style={s.priceCrossed}>79 US$</span>
                          <span style={s.priceMain}>59 US$</span>
                        </>
                      )}
                      <span style={s.noteAccent}>Precio especial de lanzamiento</span>
                      <span style={s.noteSec}>Pago seguro vía LemonSqueezy</span>
                    </div>
                    <a
                      href={BUY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={s.btnPri}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <AppleIcon size={13} />
                      Descargar para Mac
                    </a>
                  </th>
                </tr>
              </thead>
              <tbody>
                {GROUPS.map((group, gi) => (
                  <React.Fragment key={gi}>
                    <tr>
                      <td colSpan={3} style={s.groupLabel}>{group.label}</td>
                    </tr>
                    {group.rows.map((row, ri) => (
                      <tr key={ri} style={s.tr}>
                        <td style={s.tdFeat}>{row.feat}</td>
                        <td style={s.tdVal}><Cell value={row.basico} /></td>
                        <td style={s.tdVal}><Cell value={row.pro} /></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </RevealWrapper>

        <RevealWrapper delay={200}>
          <div style={{ maxWidth: 900, margin: '16px auto 0', padding: '0 4px' }}>
            <p style={{ font: '400 13px/1.7 var(--font-body)', color: 'var(--ds-text-low)', margin: '0 0 2px' }}>
              * Requiere una clave API gratuita de Numista.
            </p>
            <p style={{ font: '400 13px/1.7 var(--font-body)', color: 'var(--ds-text-low)', margin: 0 }}>
              ** Requiere claves API de OpenAI o Anthropic, sujetas a costes adicionales según cada proveedor.
            </p>
          </div>
        </RevealWrapper>

      </div>
    </section>
  );
}

window.Comparison = Comparison;
