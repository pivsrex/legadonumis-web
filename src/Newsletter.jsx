/* global React */
const { useState: nlUseState } = React;
const { RevealWrapper } = window;

function Newsletter() {
  const [email,      setEmail]      = nlUseState('');
  const [consent,    setConsent]    = nlUseState(false);
  const [status,     setStatus]     = nlUseState('idle');
  const [emailError, setEmailError] = nlUseState(false);

  const isEN = (window.LANG || 'es') === 'en';

  const t = {
    h2:    isEN ? 'Stay up to date'    : 'Descubre las últimas novedades',
    sub:   isEN
      ? 'Get notified about updates, improvements, and future features. No spam, no noise.'
      : 'Recibe información sobre actualizaciones, mejoras y futuras funciones de Legado. Sin spam, sin ruido.',
    placeholder: isEN ? 'you@email.com' : 'tu@correo.com',
    btn:   isEN ? 'Subscribe'           : 'Suscribirme',
    check: isEN
      ? 'I want to receive news and updates about Legado.'
      : 'Quiero recibir novedades y actualizaciones relacionadas con Legado.',
    legal: isEN
      ? 'We will use your email exclusively to send you news, improvements, and updates related to Legado. We will never share your information with third parties or send spam. You can unsubscribe at any time.'
      : 'Usaremos tu correo exclusivamente para enviarte novedades, mejoras y actualizaciones relacionadas con Legado. Nunca compartiremos tu información con terceros ni enviaremos spam. Puedes darte de baja en cualquier momento.',
    ok:  isEN ? "Subscribed. We'll keep you posted." : 'Suscripción confirmada. Te mantendremos al tanto.',
    err: isEN
      ? 'Something went wrong. Please check the email and try again.'
      : 'Algo no ha funcionado. Comprueba el correo e inténtalo de nuevo.',
  };

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(email)) { setEmailError(true); return; }
    if (!consent) return;
    setStatus('sending');
    fetch('/api/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim(), language: window.LANG || 'es' }),
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success || (data.message && /already exist/i.test(data.message))) {
          setStatus('ok');
        } else { throw new Error(data.message || 'error'); }
      })
      .catch(function() { setStatus('err'); });
  }

  const s = {
    section:   { padding: '125px 0 0', background: 'var(--ds-bg-0)' },
    container: { maxWidth: 1100, margin: '0 auto', padding: '0 32px' },
    head: {
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 64, alignItems: 'start', marginBottom: 48,
    },
    h2: {
      font: '600 clamp(24px, 3vw, 42px)/1.12 var(--font-display)',
      letterSpacing: '-0.025em', color: 'var(--ds-text-high)', margin: 0,
    },
    sub: {
      font: '400 17px/1.6 var(--font-body)', color: 'var(--ds-text-mid)',
      margin: 0, paddingTop: 8,
    },
    formWrap: { maxWidth: 540, margin: '0 auto' },
    formRow:  { display: 'flex', gap: 8, marginBottom: 12 },
    input: {
      flex: 1, minWidth: 0,
      background: 'var(--ds-bg-2)',
      border: emailError ? '1px solid var(--ds-error)' : '1px solid var(--ds-border-low)',
      borderRadius: 10,
      padding: '13px 16px',
      font: '400 14px/1 var(--font-body)',
      color: 'var(--ds-text-high)',
      outline: 'none',
    },
    btn: {
      flexShrink: 0,
      background: 'var(--ds-bg-2)',
      border: '1px solid var(--ds-border-mid)',
      borderRadius: 10,
      padding: '13px 20px',
      font: '600 14px/1 var(--font-display)',
      color: 'var(--ds-text-high)',
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      cursor: status === 'sending' ? 'default' : 'pointer',
      opacity: status === 'sending' ? 0.5 : 1,
    },
    checkWrap: { display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' },
    checkText: { font: '400 13px/1.55 var(--font-body)', color: 'var(--ds-text-mid)' },
    legal: {
      font: '400 14px/1.65 var(--font-body)', color: 'var(--ds-text-low)',
      margin: '16px 0 0',
    },
    msgOk: {
      font: '400 13px/1.5 var(--font-body)',
      padding: '12px 16px', borderRadius: 10,
      background: 'rgba(34,197,94,0.07)',
      border: '1px solid rgba(34,197,94,0.18)',
      color: '#4ade80',
    },
    msgErr: {
      font: '400 13px/1.5 var(--font-body)',
      padding: '12px 16px', borderRadius: 10,
      background: 'rgba(239,68,68,0.07)',
      border: '1px solid rgba(239,68,68,0.18)',
      color: '#f87171',
      marginTop: 12,
    },
  };

  return (
    <section id="novedades" style={s.section}>
      <div style={s.container}>

        <RevealWrapper>
          <div style={s.head} className="lg-section-head">
            <h2 style={s.h2}>{t.h2}</h2>
            <p style={s.sub}>{t.sub}</p>
          </div>
        </RevealWrapper>

        <RevealWrapper delay={100}>
          <div style={s.formWrap}>
            {status === 'ok' ? (
              <div style={s.msgOk}>{t.ok}</div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div style={s.formRow}>
                  <input
                    type="email"
                    style={s.input}
                    placeholder={t.placeholder}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                    autoComplete="email"
                    required
                  />
                  <button type="submit" style={s.btn} disabled={status === 'sending'}>
                    {status === 'sending' ? '…' : t.btn}
                  </button>
                </div>
                <label style={s.checkWrap}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, accentColor: 'var(--ds-accent)', cursor: 'pointer' }}
                  />
                  <span style={s.checkText}>{t.check}</span>
                </label>
                {status === 'err' && <div style={s.msgErr}>{t.err}</div>}
              </form>
            )}
            <p style={s.legal}>{t.legal}</p>
          </div>
        </RevealWrapper>

      </div>
    </section>
  );
}

window.Newsletter = Newsletter;
