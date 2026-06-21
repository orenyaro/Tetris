// "Ink & Citron" — dark, premium, with a glowing lime accent.
export const colors = {
  background: '#0E0E11', // near-black ink
  surface: '#16171C', // cards
  surfaceAlt: '#1E2027', // pressed / subtle fills
  accent: '#CDFF4F', // glowing lime
  accentDeep: '#B4E63C', // pressed accent
  accentSoft: 'rgba(205,255,79,0.14)', // lime tint
  text: '#F3F4F1', // near-white
  textMuted: '#888E99', // secondary
  done: '#565B66', // struck-through item text
  strike: '#CDFF4F', // the strikethrough line
  danger: '#FF6B6B',
  border: '#272A31',
  shadow: '#000000',
  onAccent: '#0E0E11', // text/icon on top of lime
} as const;

export type Colors = typeof colors;
