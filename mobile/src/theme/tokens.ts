/**
 * AgriSaarthi design tokens.
 * Earthy, premium, mobile-first. Color is semantic — never the only
 * carrier of state (see Badge: always icon + text).
 */

// ── Brand palette ──────────────────────────────────────────────
export const palette = {
  agriGreen: '#1B4332', // primary deep agricultural green
  agriGreenDeep: '#10281E', // green pressed / dark surfaces
  agriGreenSoft: '#2D6A4F', // lighter green for dark theme
  olive: '#6B7F59', // secondary muted green
  oliveSoft: '#A3B18A',
  gold: '#D4A017', // warm agricultural gold accent
  goldSoft: '#E9C46A',
  offWhite: '#FAF7F0', // warm off-white background
  beige: '#F0EAD6', // soft beige surfaces
  charcoal: '#1A1A1A', // primary text
  inkSoft: '#3A3833',
  muted: '#7A736A',
  line: '#E2DCCB', // hairlines / borders
  success: '#2A9D48', // natural green
  riskOrange: '#E76F51', // warnings only
  riskRed: '#C1121F', // severe risk only
  infoBlue: '#2F6F8F',
  cardDark: '#1E1C15',
  bgDark: '#141310',
} as const;

export interface Theme {
  mode: 'light' | 'dark';
  bg: string; // screen background
  surface: string; // cards, sheets
  surfaceAlt: string; // inset / grouped rows
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string; // text on primary
  accent: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  skeleton: string;
  tabBar: string;
  overlay: string;
}

export const lightTheme: Theme = {
  mode: 'light',
  bg: palette.offWhite,
  surface: '#FFFFFF',
  surfaceAlt: palette.beige,
  text: palette.charcoal,
  textMuted: palette.muted,
  primary: palette.agriGreen,
  primaryText: '#FFFFFF',
  accent: palette.gold,
  border: palette.line,
  success: palette.success,
  warning: palette.riskOrange,
  danger: palette.riskRed,
  info: palette.infoBlue,
  skeleton: '#EAE4D3',
  tabBar: '#FFFFFF',
  overlay: 'rgba(26,26,26,0.45)',
};

export const darkTheme: Theme = {
  mode: 'dark',
  bg: palette.bgDark,
  surface: palette.cardDark,
  surfaceAlt: '#26231B',
  text: palette.offWhite,
  textMuted: '#A8A093',
  primary: palette.agriGreenSoft,
  primaryText: '#FFFFFF',
  accent: palette.goldSoft,
  border: '#333026',
  success: '#52B788',
  warning: '#F4A261',
  danger: '#E76F51',
  info: '#7FB6D5',
  skeleton: '#26231B',
  tabBar: '#1A1812',
  overlay: 'rgba(0,0,0,0.6)',
};

// ── Typography (compact for small mobile screens) ──────────────
export const type = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  h3: { fontSize: 17, lineHeight: 23, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  smallStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  overline: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  button: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  // Tabular numerals for prices, weather values, risk scores.
  numeric: { fontVariant: ['tabular-nums'] as const },
};

// ── Spacing / radius / shadow ──────────────────────────────────
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const;

/** Minimum accessible touch target (dp). */
export const MIN_TOUCH = 48;

export const shadow = {
  card: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
};
