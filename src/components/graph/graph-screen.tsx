import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon } from '@/components/icons/custom-icon';
import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';

export interface GraphScreenProps {
  onClose: () => void;
}

/**
 * Placeholder for the tenant knowledge-graph visualizer. Revealed by the
 * left-to-right wipe in Workspace. Real graph rendering (nodes + links from
 * /v1/vaults/{id}/nodes) goes here later.
 */
export function GraphScreen({ onClose }: GraphScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-background flex-1">
      <View style={{ paddingTop: insets.top }}>
        <View className="h-12 flex-row items-center justify-between px-1.5">
          <Pressable onPress={onClose} hitSlop={8} className="h-10 w-10 items-center justify-center">
            <Icon name="arrow-back" size={24} />
          </Pressable>
          <Text className="text-foreground text-base font-semibold">Knowledge graph</Text>
          <View className="h-10 w-10" />
        </View>
      </View>

      <View className="flex-1 items-center justify-center gap-4 px-8">
        <CustomIcon name="data-organized" size={96} />
        <Text className="text-foreground text-center text-lg font-semibold">Graph visualizer</Text>
        <Text className="text-muted-foreground text-center text-sm">
          The tenant knowledge graph will render here — nodes and their links, pannable and zoomable.
          Placeholder for now.
        </Text>
      </View>
    </View>
  );
}
