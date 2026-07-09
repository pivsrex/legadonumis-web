export function br(s: string, cls?: string): React.ReactNode[] {
  return s.split(/\n|<br\s*\/?>/i).reduce<React.ReactNode[]>((a, l, i) =>
    i === 0 ? [l] : [...a, <br key={i} className={cls} />, l], []
  )
}

export function RevealWrapper({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      data-reveal
      style={{ '--reveal-delay': `${delay}ms`, ...style } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
