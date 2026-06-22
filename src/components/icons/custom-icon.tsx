import { useColorScheme } from 'nativewind';
import type { SvgProps } from 'react-native-svg';

import DataOrganized from '@/assets/custom-icons/data-organized.svg';
import DataUnorganized from '@/assets/custom-icons/data-unorganized.svg';
import LogoSvg from '@/assets/custom-icons/logo.svg';
import StoaAgent from '@/assets/custom-icons/stoa-agent.svg';
import { Colors } from '@/constants/theme';

/**
 * SVGs shipped in assets/custom-icons, rendered via react-native-svg-transformer.
 * Their fills/strokes were normalized to `currentColor`, so they tint to the
 * `color` prop (defaults to the themed foreground).
 */
const REGISTRY = {
  logo: LogoSvg,
  'data-organized': DataOrganized,
  'data-unorganized': DataUnorganized,
  'stoa-agent': StoaAgent,
} as const;

export type CustomIconName = keyof typeof REGISTRY;

export interface CustomIconProps extends SvgProps {
  name: CustomIconName;
  size?: number;
  color?: string;
}

export function CustomIcon({ name, size = 24, color, ...props }: CustomIconProps) {
  const { colorScheme } = useColorScheme();
  const fallback = Colors[colorScheme === 'dark' ? 'dark' : 'light'].text;
  const SvgComponent = REGISTRY[name];
  return <SvgComponent width={size} height={size} color={color ?? fallback} {...props} />;
}

/** Convenience wrapper for the Stoa logo (assets/custom-icons/logo.svg). */
export function Logo({ size = 28, ...props }: Omit<CustomIconProps, 'name'>) {
  return <CustomIcon name="logo" size={size} {...props} />;
}
