import * as DropdownMenuPrimitive from '@rn-primitives/dropdown-menu';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('bg-border mx-1 h-px', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    portalHost?: string;
  }
>(({ className, portalHost, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal hostName={portalHost}>
    <DropdownMenuPrimitive.Overlay style={StyleSheet.absoluteFill} closeOnPress>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'bg-background border-border z-50 min-w-[160px] overflow-hidden rounded-xl border shadow-md',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Overlay>
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, closeOnPress = true, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    closeOnPress={closeOnPress}
    className={cn(
      'active:bg-accent flex-row items-center gap-2 px-4 py-3',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

function DropdownMenuItemTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return <Text className={cn('text-foreground text-sm', className)} {...props} />;
}

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'text-muted-foreground px-4 py-2 text-xs font-semibold uppercase',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
