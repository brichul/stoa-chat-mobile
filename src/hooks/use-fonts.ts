import { useFonts } from 'expo-font';

/**
 * Loads the Stoa typefaces (see STYLING.md). The family names match the
 * fontFamily tokens declared in tailwind.config.js:
 *   sans  -> Inter_Stoa   serif -> Instrument_Serif   mono -> Fragment_Mono
 */
export function useAppFonts() {
  return useFonts({
    Inter_Stoa: require('@/assets/fonts/Inter_Stoa/Inter-Stoa-Regular.ttf'),
    Inter_Stoa_Bold: require('@/assets/fonts/Inter_Stoa/Inter-Stoa-Bold.ttf'),
    Instrument_Serif: require('@/assets/fonts/Instrument_Serif/InstrumentSerif-Regular.ttf'),
    Fragment_Mono: require('@/assets/fonts/Fragment_Mono/FragmentMono-Regular.ttf'),
  });
}
