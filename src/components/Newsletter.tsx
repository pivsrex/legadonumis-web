import { useState } from 'react'

interface Props { lang: 'es' | 'en' }

const copy = {
  es: {
    titulo:      'Descubre las últimas novedades',
    sub:         'Novedades, guías y actualizaciones de Legado. Sin spam.',
    placeholder: 'tu@email.com',
    consent:     'Acepto recibir comunicaciones de Legado. Puedo darme de baja en cualquier momento.',
    cta:         'Suscribirme',
    sending:     'Enviando...',
    ok:          '¡Suscrito! Gracias por unirte.',
    err:         'Algo fue mal. Inténtalo de nuevo.',
    errConsent:  'Acepta las condiciones para continuar.',
  },
  en: {
    titulo:      'Stay up to date',
    sub:         'News, guides, and Legado updates. No spam.',
    placeholder: 'your@email.com',
    consent:     'I agree to receive communications from Legado. I can unsubscribe at any time.',
    cta:         'Subscribe',
    sending:     'Sending...',
    ok:          'Subscribed! Thanks for joining.',
    err:         'Something went wrong. Please try again.',
    errConsent:  'Please accept the terms to continue.',
  },
}

export default function Newsletter({ lang }: Props) {
  const t = copy[lang]
  const [email, setEmail]       = useState('')
  const [consent, setConsent]   = useState(false)
  const [status, setStatus]     = useState<'idle' | 'sending' | 'ok' | 'err' | 'consent'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consent) { setStatus('consent'); return }
    setStatus('sending')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang }),
      })
      setStatus(res.ok ? 'ok' : 'err')
    } catch {
      setStatus('err')
    }
  }

  return (
    <section id="novedades" style={{ padding: '125px 32px 0', background: 'var(--ds-bg-0)' }}>
      <div style={{
        maxWidth: 640, margin: '0 auto',
        background: '#181818', border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 20,
        padding: '48px 40px',
      }}>
        <h2 style={{ font: '600 clamp(22px, 2.5vw, 32px)/1.15 var(--font-display)', letterSpacing: '-0.025em', color: 'var(--ds-text-high)', margin: '0 0 10px' }}>
          {t.titulo}
        </h2>
        <p style={{ font: '400 15px/1.65 var(--font-body)', color: 'var(--ds-text-mid)', margin: '0 0 28px' }}>
          {t.sub}
        </p>

        {status === 'ok' ? (
          <p style={{ font: '400 15px/1.6 var(--font-body)', color: 'var(--ds-accent)', margin: 0 }}>{t.ok}</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t.placeholder}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10,
                  background: 'var(--ds-bg-2)', border: '1px solid var(--ds-border-mid)',
                  color: 'var(--ds-text-high)', font: '400 14px/1 var(--font-body)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                style={{
                  padding: '11px 20px', borderRadius: 10,
                  background: 'var(--ds-accent)', color: '#0a0908', border: 'none',
                  font: '600 14px/1 var(--font-display)', cursor: 'pointer',
                  opacity: status === 'sending' ? 0.7 : 1,
                }}
              >
                {status === 'sending' ? t.sending : t.cta}
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                style={{ marginTop: 3, accentColor: 'var(--ds-accent)', flexShrink: 0 }}
              />
              <span style={{ font: '400 12px/1.6 var(--font-body)', color: 'var(--ds-text-low)' }}>
                {t.consent}
              </span>
            </label>

            {(status === 'err' || status === 'consent') && (
              <p style={{ font: '400 13px/1.5 var(--font-body)', color: '#e05c5c', margin: 0 }}>
                {status === 'consent' ? t.errConsent : t.err}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
