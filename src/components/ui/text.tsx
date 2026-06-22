import * as React from 'react';
import { Text as RNText } from 'react-native';

import { cn } from '@/lib/utils';

/**
 * Lets a parent (e.g. Button) push text classes down to any <Text> it wraps,
 * matching the react-native-reusables pattern.
 */
const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  ...props
}: React.ComponentProps<typeof RNText> & React.RefAttributes<RNText>) {
  const textClass = React.useContext(TextClassContext);
  return (
    <RNText className={cn('text-foreground font-sans text-base leading-6', textClass, className)} {...props} />
  );
}

export { Text, TextClassContext };
