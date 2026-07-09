import React, { forwardRef } from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

const Icon = forwardRef<SVGSVGElement, IconProps>(({ children, size = 20, style, ...rest }, ref) => (
  <svg
    ref={ref}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', ...style }}
    {...rest}
  >
    {children}
  </svg>
))
Icon.displayName = 'Icon'

export const CoinIcon     = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.5" /><path d="M12 6.5v11M9 9.5h6" /></Icon>
export const FrameIcon    = (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /></Icon>
export const TagIcon      = (p: IconProps) => <Icon {...p}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z" /><circle cx="7.5" cy="7.5" r="1" fill="currentColor" /></Icon>
export const GridIcon     = (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>
export const ChartIcon    = (p: IconProps) => <Icon {...p}><path d="M3 21h18M6 17V10M11 17V6M16 17v-7M21 17V13" /></Icon>
export const BookmarkIcon = (p: IconProps) => <Icon {...p}><path d="M6 3h12v18l-6-4-6 4V3z" /></Icon>
export const SparkIcon    = (p: IconProps) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></Icon>
export const LayersIcon   = (p: IconProps) => <Icon {...p}><path d="M12 3 3 8l9 5 9-5-9-5z" /><path d="M3 13l9 5 9-5M3 18l9 5 9-5" /></Icon>
export const HistoryIcon  = (p: IconProps) => <Icon {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></Icon>
export const ImportIcon   = (p: IconProps) => <Icon {...p}><path d="M8 12l4 4 4-4M12 3v13" /><path d="M3 19h18" /></Icon>
