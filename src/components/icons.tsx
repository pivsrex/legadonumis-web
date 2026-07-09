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

export const CheckIcon     = (p: IconProps) => <Icon {...p}><polyline points="20 6 9 17 4 12" /></Icon>
export const PlusIcon      = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const MinusIcon     = (p: IconProps) => <Icon {...p}><path d="M5 12h14" /></Icon>
export const AppleIcon     = (p: IconProps) => <Icon {...p}><path d="M16 8a4 4 0 0 0-1.7 3.3 4 4 0 0 0 2.5 3.7c-.4 1.2-1 2.4-1.7 3.3-1 1.3-2 2.7-3.6 2.7s-2-1-3.7-1-2.2 1-3.7 1-2.7-1.3-3.6-2.6C-.5 16-1 11.7.5 8.6a5 5 0 0 1 4.3-2.6c1.5 0 2.7 1 3.7 1s3-1.2 5-1c.7 0 3 .3 4.5 2zM12 5a4 4 0 0 0 1-3 4 4 0 0 0-2.7 1.4 4 4 0 0 0-1 3A3.5 3.5 0 0 0 12 5z" fill="currentColor" stroke="none" /></Icon>
export const WindowsIcon   = (p: IconProps) => <Icon {...p}><path d="M3 5.5 11 4.4v7.1H3zM12 4.3 21 3v8.5h-9zM3 12.5h8v7.1L3 18.5zM12 12.5h9V21l-9-1.3z" fill="currentColor" stroke="none" /></Icon>
export const TwitterIcon   = (p: IconProps) => <Icon {...p}><path d="M22 4s-.7 2.1-2 3.4c1.6 9.4-9.7 16.3-18 8.6 2.2.1 4.4-.6 6-2-3-1-4.5-4.4-3.5-7 1 1 2.2 1.6 3.5 1.7C5 7 4.5 4.4 6 3c2 2.3 4.7 3.7 7.7 3.9-.6-2.6 2.3-4.6 4.5-3.4 1 .1 1.9-.5 2.8-.5z" /></Icon>
export const InstagramIcon = (p: IconProps) => <Icon {...p}><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4.5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></Icon>
