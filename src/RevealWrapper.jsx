/* global React */
const { useEffect, useRef, useState } = React;

/**
 * RevealWrapper — IntersectionObserver-driven scroll reveal.
 * Default state: opacity 0.001 + translateY(40px).
 * Visible state: opacity 1 + translateY(0). 550ms cubic-bezier(0.4,0,0.2,1).
 */
function RevealWrapper({ children, distance = 40, delay = 0, as: Tag = 'div', style, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(true); return; }

    // If already in viewport on mount, reveal immediately.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh && rect.bottom > 0) {
      setShown(true);
      return;
    }

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);

    // Safety net: if observer hasn't fired in 200ms, just show.
    const fallback = setTimeout(() => setShown(true), 200);
    return () => { obs.disconnect(); clearTimeout(fallback); };
  }, []);

  return (
    <Tag
      ref={ref}
      style={{
        opacity: shown ? 1 : 0.001,
        transform: shown ? 'translateY(0)' : `translateY(${distance}px)`,
        transition: `opacity 550ms cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 550ms cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * StaggerChildren — wraps siblings with incremental delay.
 */
function StaggerChildren({ children, step = 100, distance = 40, as: Tag = 'div', style, ...rest }) {
  const items = React.Children.toArray(children);
  return (
    <Tag style={style} {...rest}>
      {items.map((child, i) => (
        <RevealWrapper key={i} delay={i * step} distance={distance} style={{ display: 'contents' }}>
          {child}
        </RevealWrapper>
      ))}
    </Tag>
  );
}

window.RevealWrapper = RevealWrapper;
window.StaggerChildren = StaggerChildren;
