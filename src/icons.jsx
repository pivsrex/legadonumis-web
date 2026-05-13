/* global React */
const { forwardRef } = React;

const Icon = forwardRef(({ children, size = 20, style, ...rest }, ref) => (
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
));

const RecordDotIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" fill="currentColor" /></Icon>;
const PlayIcon      = (p) => <Icon {...p}><polygon points="6 4 20 12 6 20 6 4" /></Icon>;
const StopIcon      = (p) => <Icon {...p}><rect x="6" y="6" width="12" height="12" rx="1" /></Icon>;
const DownloadIcon  = (p) => <Icon {...p}><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></Icon>;
const ShareIcon     = (p) => <Icon {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></Icon>;
const ScissorsIcon  = (p) => <Icon {...p}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" /></Icon>;
const KeyboardIcon  = (p) => <Icon {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></Icon>;
const LockIcon      = (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>;
const CloudIcon     = (p) => <Icon {...p}><path d="M17 18a4 4 0 0 0 .9-7.9 6 6 0 0 0-11.7 1A4.5 4.5 0 0 0 7 19h10z" /></Icon>;
const SparklesIcon  = (p) => <Icon {...p}><path d="m12 3-1.9 4.6L5.5 9.5l4.6 1.9L12 16l1.9-4.6 4.6-1.9-4.6-1.9zM19 14l-.7 1.7-1.7.7 1.7.7.7 1.7.7-1.7 1.7-.7-1.7-.7zM5 18l-.5 1.2-1.2.5 1.2.5.5 1.2.5-1.2 1.2-.5-1.2-.5z" /></Icon>;
const CheckIcon     = (p) => <Icon {...p}><polyline points="20 6 9 17 4 12" /></Icon>;
const PlusIcon      = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
const MinusIcon     = (p) => <Icon {...p}><path d="M5 12h14" /></Icon>;
const ChevronRight  = (p) => <Icon {...p}><polyline points="9 18 15 12 9 6" /></Icon>;
const AppleIcon     = (p) => <Icon {...p}><path d="M16 8a4 4 0 0 0-1.7 3.3 4 4 0 0 0 2.5 3.7c-.4 1.2-1 2.4-1.7 3.3-1 1.3-2 2.7-3.6 2.7s-2-1-3.7-1-2.2 1-3.7 1-2.7-1.3-3.6-2.6C-.5 16-1 11.7.5 8.6a5 5 0 0 1 4.3-2.6c1.5 0 2.7 1 3.7 1s3-1.2 5-1c.7 0 3 .3 4.5 2zM12 5a4 4 0 0 0 1-3 4 4 0 0 0-2.7 1.4 4 4 0 0 0-1 3A3.5 3.5 0 0 0 12 5z" fill="currentColor" stroke="none" /></Icon>;
const WindowsIcon   = (p) => <Icon {...p}><path d="M3 5.5 11 4.4v7.1H3zM12 4.3 21 3v8.5h-9zM3 12.5h8v7.1L3 18.5zM12 12.5h9V21l-9-1.3z" fill="currentColor" stroke="none" /></Icon>;
const LinuxIcon     = (p) => <Icon {...p}><path d="M9 4a2 2 0 0 0-2 2c0 1 .3 1.7.5 2.3.3.7.5 1.4.5 2.7s-.5 1.5-1 2-1.5 1-2 2 0 2 0 3 1 1.5 2 1.5h10c1 0 2-.5 2-1.5s.5-2 0-3-1.5-1.5-2-2-1-.7-1-2 .2-2 .5-2.7c.2-.6.5-1.3.5-2.3a2 2 0 0 0-2-2 4 4 0 0 0-4 4 4 4 0 0 0-4-4z" /><circle cx="9" cy="9" r=".7" fill="currentColor" /><circle cx="13" cy="9" r=".7" fill="currentColor" /></Icon>;
const GitHubIcon    = (p) => <Icon {...p}><path d="M9 19c-4 1.3-4-2-6-2.5M15 22v-4a3.4 3.4 0 0 0-1-2.6c3-.3 6.3-1.5 6.3-7 0-1.4-.5-2.6-1.4-3.5.1-.4.6-1.8-.1-3.7 0 0-1.2-.4-3.8 1.4a13 13 0 0 0-7 0C5.4 1.3 4.2 1.7 4.2 1.7c-.7 1.9-.3 3.3-.2 3.7-.9 1-1.4 2.1-1.4 3.5 0 5.5 3.3 6.7 6.3 7-.4.3-.7.9-.9 1.7-.7.4-2.6 1-3.7-1.2 0 0-.7-1.2-1.9-1.3 0 0-1.2 0-.1.7 0 0 .8.4 1.4 1.8 0 0 .7 2 4.1 1.3v3.5" /></Icon>;
const TwitterIcon   = (p) => <Icon {...p}><path d="M22 4s-.7 2.1-2 3.4c1.6 9.4-9.7 16.3-18 8.6 2.2.1 4.4-.6 6-2-3-1-4.5-4.4-3.5-7 1 1 2.2 1.6 3.5 1.7C5 7 4.5 4.4 6 3c2 2.3 4.7 3.7 7.7 3.9-.6-2.6 2.3-4.6 4.5-3.4 1 .1 1.9-.5 2.8-.5z" /></Icon>;
const DiscordIcon   = (p) => <Icon {...p}><path d="M9 16c4 2 6 2 10 0M8 13.5h.01M16 13.5h.01M5 7s2-1 7-1 7 1 7 1c1 1 1.5 5 1.5 7s-1 3-3 4l-1-2c-2 1-7 1-9 0l-1 2c-2-1-3-2-3-4S4 8 5 7z" /></Icon>;

window.LegadoIcons = {
  Icon, RecordDotIcon, PlayIcon, StopIcon, DownloadIcon, ShareIcon,
  ScissorsIcon, KeyboardIcon, LockIcon, CloudIcon, SparklesIcon,
  CheckIcon, PlusIcon, MinusIcon, ChevronRight,
  AppleIcon, WindowsIcon, LinuxIcon,
  GitHubIcon, TwitterIcon, DiscordIcon,
};
