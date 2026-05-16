/* global React */
const { CheckIcon, AppleIcon, WindowsIcon } = window.LegadoIcons;
const { RevealWrapper } = window;
const C = window.C;

const TRIAL_ITEMS = [
  'Hasta 15 ejemplares catalogados',
  '5 usos del asistente IA',
  'Galería fotográfica completa',
  'Mapa de cecas interactivo',
  'Sin límite de tiempo',
];

const FULL_ITEMS = [
  'Ejemplares ilimitados',
  'Asistente IA ilimitado',
  'Exportar a Excel, CSV y PDF',
  'Etiquetador de bandejas',
  'Actualizaciones durante dos años',
  'Soporte técnico por correo',
];

function PricingCard({ badge, price, sub, note, items, isPrimary, cta, href, secondBtn, secondHref }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: isPrimary ? 'var(--ds-bg-2)' : 'var(--ds-bg-1)',
        border: `1px solid ${isPrimary ? (hover ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.2)') : (hover ? 'var(--ds-border-mid)' : 'var(--ds-border-low)')}`,
        borderRadius: 20,
        padding: '36px 32px',
        display: 'flex', flexDirection: 'column', gap: 0,
        position: 'relative',
        transition: 'border-color 250ms ease',
        boxShadow: isPrimary ? '0 8px 48px rgba(201,168,76,0.08)' : 'none',
      }}
    >
      {isPrimary && (
        <div style={{
          position: 'absolute', top: -1, left: 24,
          padding: '5px 14px',
          background: 'var(--ds-accent)',
          borderRadius: '0 0 10px 10px',
          font: '600 11px/1 var(--font-display)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: '#0a0908',
        }}>
          {C.full_badge}
        </div>
      )}

      {/* Badge */}
      <div style={{
        font: '500 12px/1 var(--font-body)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: isPrimary ? 'var(--ds-accent)' : 'var(--ds-text-low)',
        marginBottom: 20,
        marginTop: isPrimary ? 20 : 0,
      }}>
        {badge}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 6 }}>
        <span style={{
          font: '700 clamp(40px, 4vw, 56px)/1 var(--font-display)',
          letterSpacing: '-0.04em',
          color: 'var(--ds-text-high)',
        }}>
          {price}
        </span>
        {sub && (
          <span style={{
            font: '400 16px/1 var(--font-body)',
            color: 'var(--ds-text-mid)',
            marginLeft: 8,
          }}>
            {sub}
          </span>
        )}
      </div>

      {/* Note */}
      <p style={{
        font: '400 13px/1.5 var(--font-body)',
        color: 'var(--ds-text-low)',
        margin: '0 0 28px',
      }}>
        {note}
      </p>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--ds-border-low)', marginBottom: 24 }} />

      {/* Items */}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flexShrink: 0, marginTop: 1, color: isPrimary ? 'var(--ds-accent)' : 'var(--ds-text-mid)' }}>
              <CheckIcon size={15} />
            </div>
            <span style={{ font: '400 14px/1.5 var(--font-body)', color: 'var(--ds-text-mid)' }}>
              {item}
            </span>
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        <a href={href} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '13px 20px',
          borderRadius: 12,
          background: isPrimary ? 'var(--ds-accent)' : 'transparent',
          color: isPrimary ? '#0a0908' : 'var(--ds-text-high)',
          border: isPrimary ? 'none' : '1px solid var(--ds-border-mid)',
          font: `${isPrimary ? '600' : '500'} 15px/1 var(--font-display)`,
          letterSpacing: '-0.01em',
          textDecoration: 'none',
          transition: 'opacity 200ms ease',
        }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <AppleIcon size={16} /> {cta}
        </a>
        {secondBtn && (
          <a href={secondHref || '#'} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '13px 20px',
            borderRadius: 12,
            background: 'transparent',
            color: 'var(--ds-text-mid)',
            border: '1px solid var(--ds-border-low)',
            font: '500 15px/1 var(--font-display)',
            letterSpacing: '-0.01em',
            textDecoration: 'none',
            transition: 'border-color 200ms ease, color 200ms ease',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ds-border-mid)'; e.currentTarget.style.color = 'var(--ds-text-high)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ds-border-low)'; e.currentTarget.style.color = 'var(--ds-text-mid)'; }}
          >
            <WindowsIcon size={16} /> {secondBtn}
          </a>
        )}
      </div>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" style={{
      padding: '120px 0',
      background: 'var(--ds-bg-1)',
      borderTop: '1px solid var(--ds-border-low)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>

        <RevealWrapper>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', marginBottom: 64 }}>
            <div style={{ font: '500 11px/1 var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ds-accent)' }}>
              {C.valor_label}
            </div>
            <h2 style={{
              font: '600 clamp(28px, 3.5vw, 48px)/1.1 var(--font-display)',
              letterSpacing: '-0.025em', color: 'var(--ds-text-high)',
              margin: 0, maxWidth: 560,
            }}>
              {C.valor_titulo}
            </h2>
            <p style={{ font: '400 17px/1.6 var(--font-body)', color: 'var(--ds-text-mid)', maxWidth: 440, margin: 0 }}>
              {C.valor_desc}
            </p>
          </div>
        </RevealWrapper>

        <RevealWrapper delay={100}>
          <div
            className="lg-pricing-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 840, margin: '0 auto' }}
          >
            <PricingCard
              badge={C.trial_badge}
              price={C.trial_precio}
              note={C.trial_nota}
              items={TRIAL_ITEMS}
              isPrimary={false}
              cta="Descargar gratis"
              href="descarga.html"
            />
            <PricingCard
              badge={C.full_tag}
              price={C.full_precio}
              sub={C.full_divisa}
              note={C.full_nota}
              items={FULL_ITEMS}
              isPrimary={true}
              cta={C.full_btn}
              href="https://legadonumis.lemonsqueezy.com/checkout/buy/fbc0bc5f-e323-44a6-b007-9fe0cb707efa"
            />
          </div>
        </RevealWrapper>

        <RevealWrapper delay={200}>
          <p style={{
            textAlign: 'center', marginTop: 40,
            font: '400 15px/1.5 var(--font-body)',
            color: 'var(--ds-text-low)',
          }}>
            {C.precio_frase}
          </p>
        </RevealWrapper>

      </div>
    </section>
  );
}

window.Pricing = Pricing;
