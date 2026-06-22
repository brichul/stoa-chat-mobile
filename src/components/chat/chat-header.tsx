import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';

export interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onPressMenu: () => void;
  onPressTitle?: () => void;
  /** Optional trailing action (e.g. a graph shortcut). */
  trailing?: React.ReactNode;
}

export function ChatHeader({ title, subtitle, onPressMenu, onPressTitle, trailing }: ChatHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="border-border bg-background border-b-hairline"
      style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center px-1.5">
        {/* Sidebar indicator / toggle (top-left). */}
        <Pressable onPress={onPressMenu} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Icon name="menu" size={24} />
        </Pressable>

        <Pressable onPress={onPressTitle} className="flex-1 items-center justify-center" hitSlop={4}>
          <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text className="text-muted-foreground text-xs">{subtitle}</Text> : null}
        </Pressable>

        <View className="h-10 w-10 items-center justify-center">{trailing}</View>
      </View>
    </View>
  );
}
