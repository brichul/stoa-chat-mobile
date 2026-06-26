import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { Platform } from 'react-native';

import { Icon } from '@/components/icons/icon';
import { Palette } from '@/constants/theme';
import { cn } from '@/lib/utils';

const DEFAULT_HIT_SLOP = 24;

/**
 * react-native-reusables Checkbox, adapted to the project's Material Symbols
 * `Icon` (the upstream component renders a lucide icon).
 */
function Checkbox({
  className,
  checkedClassName,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  checkedClassName?: string;
  indicatorClassName?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'border-input dark:bg-input/30 size-5 shrink-0 rounded-[4px] border shadow-sm shadow-black/5',
        Platform.select({
          web: 'peer cursor-default outline-none transition-shadow focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed',
          native: 'overflow-hidden',
        }),
        props.checked && cn('border-primary bg-primary', checkedClassName),
        props.disabled && 'opacity-50',
        className
      )}
      hitSlop={DEFAULT_HIT_SLOP}
      {...props}>
      <CheckboxPrimitive.Indicator
        className={cn('h-full w-full items-center justify-center', indicatorClassName)}>
        <Icon name="check" size={14} color={Palette.white} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
