// Coastal Calm palette — sea-glass background, deep teal accent.
export const colors = {
  background: '#EFF3F2', // pale sea-glass
  surface: '#FFFFFF', // cards
  surfaceAlt: '#E4EBEA', // pressed / subtle fills
  accent: '#2A7F7E', // deep teal
  accentSoft: '#D7E6E4', // teal tint for chips / checkbox idle
  accentDeep: '#1F5F5E', // pressed accent
  text: '#1C2B2A', // primary ink
  textMuted: '#5B6B6A', // secondary
  done: '#9AA8A6', // struck-through item text
  strike: '#2A7F7E', // the strikethrough line
  danger: '#C0573B', // delete / destructive
  border: '#DDE6E4',
  shadow: '#1C2B2A',
} as const;

export type Colors = typeof colors;
