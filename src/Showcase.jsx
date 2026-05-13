/* global React */
const C = window.C;
const br = (s) => s.split(/\n|<br\s*\/?>/i).reduce((a,l,i) => i===0?[l]:[...a,React.createElement('br',{key:i}),l],[]);

/*
 * Cada card vive en su propia sección (position: sticky, top fijo).
 * Las secciones 2-4 tienen margin-top negativo, de modo que empiezan
 * dentro del espacio visual de la anterior. Card N cubre completamente
 * a card N-1 al llegar a la posición sticky, porque ambas comparten
 * el mismo top y la inferior tiene z-index mayor.
 * CSS sticky nativo, sin JS ni transforms.
 *
 * reverse: false → media izquierda, texto derecha
 * reverse: true  → texto izquierda, media derecha
 */

const TOP     = 80;
const CARD_H  = 580;
const OVERLAP = CARD_H;

const CARDS = [
  { title: C.sc1_titulo, desc: C.sc1_desc, type: 'video', src: 'assets/FichaNumista.mp4',   reverse: false },
  { title: C.sc2_titulo, desc: C.sc2_desc, type: 'video', src: 'assets/FichaCompara.mp4',   reverse: true  },
  { title: C.sc3_titulo, desc: C.sc3_desc, type: 'video', src: 'assets/FichaEtiqueta.mp4',  reverse: false },
  { title: C.sc4_titulo, desc: C.sc4_desc, type: 'video', src: 'assets/FichaCecas.mp4',     reverse: true  },
];

const N = CARDS.length;

function Showcase() {
  const { RevealWrapper } = window;

  return (
    <section id="showcase" style={{ background: 'var(--ds-bg-0)' }}>

      {/* ── Cabecera ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '125px 32px 48px' }}>
        <RevealWrapper>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
            <h2 style={{
              font: '600 clamp(24px, 3vw, 42px)/1.12 var(--font-display)',
              letterSpacing: '-0.025em', color: 'var(--ds-text-high)', margin: 0,
            }}>
              {br(C.sc_h2)}
            </h2>
            <p style={{ font: '400 17px/1.6 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0, paddingTop: 8 }}>
              {br(C.sc_sub)}
            </p>
          </div>
        </RevealWrapper>
      </div>

      {/* ── Cards ── */}
      {CARDS.map((card, i) => (
        <div
          key={i}
          className="lg-showcase-section"
          style={{
            position: 'relative',
            minHeight: i < N - 1 ? '160vh' : '100vh',
            marginTop: i > 0 ? -OVERLAP : 0,
          }}
        >
          <div
            className="lg-showcase-sticky"
            style={{
              position: 'sticky',
              top: TOP,
              zIndex: i + 1,
              padding: '0 32px',
              boxSizing: 'border-box',
            }}
          >
            <div
              className="lg-showcase-card"
              style={{
                maxWidth: 1200,
                margin: '0 auto',
                height: CARD_H,
                borderRadius: 18,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: card.reverse ? '320px 1fr' : '1fr 320px',
                background: '#181818',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
              }}
            >
              {card.reverse ? (
                <>
                  {/* ── Panel de texto (izquierda) ── */}
                  <div style={{
                    background: '#181818',
                    padding: '48px 32px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20,
                  }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {CARDS.map((_, di) => (
                        <div key={di} style={{
                          height: 2, borderRadius: 1,
                          width: di === i ? 20 : 5,
                          background: di === i
                            ? 'var(--ds-accent)'
                            : di < i
                              ? 'rgba(201,168,76,0.22)'
                              : 'rgba(255,255,255,0.12)',
                        }} />
                      ))}
                    </div>
                    <h3 style={{
                      font: '600 clamp(20px, 1.8vw, 26px)/1.25 var(--font-display)',
                      letterSpacing: '-0.02em', color: 'var(--ds-text-high)', margin: 0,
                    }}>
                      {card.title}
                    </h3>
                    <p style={{
                      font: '400 16px/1.75 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0,
                    }}>
                      {card.desc}
                    </p>
                  </div>

                  {/* ── Media (derecha) ── */}
                  <div
                    className="lg-showcase-media"
                    style={{
                      position: 'relative', overflow: 'hidden',
                      background: '#181818',
                      padding: '20px',
                      display: 'flex', alignItems: 'stretch',
                    }}
                  >
                    <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden' }}>
                      <video
                        autoPlay muted loop playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', display: 'block' }}
                      >
                        <source src={card.src} type="video/mp4" />
                      </video>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* ── Media (izquierda) ── */}
                  <div
                    className="lg-showcase-media"
                    style={{
                      position: 'relative', overflow: 'hidden',
                      background: '#181818',
                      padding: '20px',
                      display: 'flex', alignItems: 'stretch',
                    }}
                  >
                    <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden' }}>
                      <video
                        autoPlay muted loop playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left', display: 'block' }}
                      >
                        <source src={card.src} type="video/mp4" />
                      </video>
                    </div>
                  </div>

                  {/* ── Panel de texto (derecha) ── */}
                  <div style={{
                    background: '#181818',
                    padding: '48px 32px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20,
                  }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {CARDS.map((_, di) => (
                        <div key={di} style={{
                          height: 2, borderRadius: 1,
                          width: di === i ? 20 : 5,
                          background: di === i
                            ? 'var(--ds-accent)'
                            : di < i
                              ? 'rgba(201,168,76,0.22)'
                              : 'rgba(255,255,255,0.12)',
                        }} />
                      ))}
                    </div>
                    <h3 style={{
                      font: '600 clamp(20px, 1.8vw, 26px)/1.25 var(--font-display)',
                      letterSpacing: '-0.02em', color: 'var(--ds-text-high)', margin: 0,
                    }}>
                      {card.title}
                    </h3>
                    <p style={{
                      font: '400 16px/1.75 var(--font-body)', color: 'var(--ds-text-mid)', margin: 0,
                    }}>
                      {card.desc}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      <div style={{ height: 0 }} />
    </section>
  );
}

window.Showcase = Showcase;
