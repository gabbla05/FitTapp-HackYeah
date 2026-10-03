import { Platform } from 'react-native';

export const COLORS = {
  // Rich Obsidian Charcoal (Boutique Dark Mode)
  background: '#0B0C10',
  backgroundOverlay: 'rgba(11, 12, 16, 0.88)',
  
  // Surfaces & Containers (Cards)
  surface: '#14161F',
  surfaceCard: '#1A1C25',
  surfaceElevated: '#222532',
  surfaceSubtle: 'rgba(255, 255, 255, 0.04)',
  
  // High-precision Hairline Borders
  border: 'rgba(255, 255, 255, 0.07)',
  borderActive: 'rgba(52, 211, 153, 0.4)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  
  // Human-crafted Accents (No harsh neon, soothing saturation)
  primaryMint: '#34D399',          // Serene emerald/mint
  primaryMintMuted: 'rgba(52, 211, 153, 0.12)',
  primaryMintGlow: 'rgba(52, 211, 153, 0.25)',
  accentLime: '#C8FF2E',           // Kinetic energy touch
  
  // Contextual Accents
  amberWarm: '#F59E0B',
  skyBlue: '#38BDF8',
  softCoral: '#FB7185',
  
  // Editorial Typography Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',         // Slate tone for natural human warmth
  textMuted: '#64748B',            // Subtle micro-copy
  textDark: '#0B0C10',
  
  // Buttons & Controls
  buttonDark: '#20232F',
  buttonDarkHover: '#2A2E3D',
  buttonTextLight: '#F1F5F9',
} as const;

export const RADII = {
  xs: 6,
  sm: 10,
  md: 16,
  card: 24,       // Apple & Scandinavian hardware standard
  pill: 9999,     // Full pill geometry
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const FONTS = {
  sans: Platform.select({
    web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    default: undefined,
  }),
  mono: Platform.select({
    web: "'JetBrains Mono', 'SF Mono', Menlo, Monaco, Consolas, monospace",
    default: 'monospace',
  }),
};
