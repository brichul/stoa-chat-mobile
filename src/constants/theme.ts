/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * The Stoa typefaces, loaded via expo-font in src/hooks/use-fonts.ts. These
 * family names match the loaded fonts and the `fontFamily` tokens in
 * tailwind.config.js, so `Fonts.sans` is the same Inter_Stoa face the themed
 * `Text` component renders. There is no dedicated rounded face — it falls back
 * to the sans face rather than the system default.
 */
export const Fonts = {
  sans: 'Inter_Stoa',
  serif: 'Instrument_Serif',
  rounded: 'Inter_Stoa',
  mono: 'Fragment_Mono',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** STYLING.md palette. */
export const Palette = {
  black: '#131211',
  white: '#FEFDFC',
  accentStart: '#98514B',
  accentEnd: '#F9B764',
} as const;

/** Accent gradient (STYLING.md: #98514B -> #F9B764), for LinearGradient `colors`. */
export const AccentGradient = [Palette.accentStart, Palette.accentEnd] as const;
