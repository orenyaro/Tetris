// "Ink & Amber" — dark, premium, with a warm light-orange accent.
export const colors = {
  background: '#0E0E11', // near-black ink
  surface: '#16171C', // cards
  surfaceAlt: '#1E2027', // pressed / subtle fills
  accent: '#FFA94D', // light orange
  accentDeep: '#F08A2E', // pressed accent
  accentSoft: 'rgba(255,169,77,0.15)', // orange tint
  text: '#F3F4F1', // near-white
  textMuted: '#888E99', // secondary
  done: '#565B66', // struck-through item text
  strike: '#FFA94D', // the strikethrough line
  danger: '#FF6B6B',
  border: '#272A31',
  shadow: '#000000',
  onAccent: '#0E0E11', // text/icon on top of orange
} as const;

export type Colors = typeof colors;
