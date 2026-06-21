// Frank Ruhl Libre carries both Hebrew and Latin glyphs (cohesive RTL),
// Newsreader is reserved for the large branding title.
export const fonts = {
  title: 'Newsreader_500Medium',
  display: 'FrankRuhlLibre_700Bold',
  semibold: 'FrankRuhlLibre_500Medium',
  body: 'FrankRuhlLibre_400Regular',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;
