import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColorScheme } from 'nativewind';

import { Colors } from '@/constants/theme';

/**
 * Material Symbols (STYLING.md: ICONS = Google Material Symbols), exposed via
 * @expo/vector-icons' MaterialIcons set. Defaults to the themed foreground color.
 */
export type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color }: IconProps) {
  const { colorScheme } = useColorScheme();
  const fallback = Colors[colorScheme === 'dark' ? 'dark' : 'light'].text;
  return <MaterialIcons name={name} size={size} color={color ?? fallback} />;
}
