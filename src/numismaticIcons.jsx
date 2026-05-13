/* global React */
const { Icon } = window.LegadoIcons;

const CoinIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.5" /><path d="M12 6.5v11M9 9.5h6" /></Icon>;
const StackIcon = (p) => <Icon {...p}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 12l9 4 9-4" /><path d="M3 17l9 4 9-4" /></Icon>;
const SearchIcon = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>;
const FilterIcon = (p) => <Icon {...p}><path d="M3 5h18M6 12h12M10 19h4" /></Icon>;
const FrameIcon = (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /></Icon>;
const TagIcon = (p) => <Icon {...p}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z" /><circle cx="7.5" cy="7.5" r="1" fill="currentColor" /></Icon>;
const GridIcon = (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>;
const ChartIcon = (p) => <Icon {...p}><path d="M3 21h18M6 17V10M11 17V6M16 17v-7M21 17V13" /></Icon>;
const ShieldIcon = (p) => <Icon {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" /></Icon>;
const BookmarkIcon = (p) => <Icon {...p}><path d="M6 3h12v18l-6-4-6 4V3z" /></Icon>;
const ArrowRightIcon = (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Icon>;
const CalendarIcon = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>;
const StarIcon = (p) => <Icon {...p}><path d="M12 3l2.6 5.5 6 .9-4.3 4.3 1 6-5.3-2.9L6.7 19.7l1-6L3.4 9.4l6-.9L12 3z" /></Icon>;
const QuoteIcon = (p) => <Icon {...p}><path d="M7 8h3v3a4 4 0 0 1-4 4M14 8h3v3a4 4 0 0 1-4 4" fill="currentColor" stroke="currentColor"/></Icon>;
const SparkIcon = (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></Icon>;
const LayersIcon = (p) => <Icon {...p}><path d="M12 3 3 8l9 5 9-5-9-5z" /><path d="M3 13l9 5 9-5M3 18l9 5 9-5" /></Icon>;
const HistoryIcon = (p) => <Icon {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></Icon>;

window.NumIcons = {
  CoinIcon, StackIcon, SearchIcon, FilterIcon, FrameIcon, TagIcon, GridIcon,
  ChartIcon, ShieldIcon, BookmarkIcon, ArrowRightIcon, CalendarIcon,
  StarIcon, QuoteIcon, SparkIcon, LayersIcon, HistoryIcon,
};
