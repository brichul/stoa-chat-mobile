import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

import { type MentionDirectory, type MentionRef } from '@/lib/mentions';
import { MentionGlyph } from './mention-views';

const SECTIONS: { key: keyof MentionDirectory; label: string }[] = [
  { key: 'users', label: 'People' },
  { key: 'nodes', label: 'Nodes' },
  { key: 'vaults', label: 'Vaults' },
];

/**
 * The `@` autocomplete card that floats above the composer. Each row shows the
 * avatar/icon, the display name, and — underneath — the exact text that gets
 * inserted (a username or node/vault id).
 */
export function MentionSuggestions({
  directory,
  onSelect,
}: {
  directory: MentionDirectory;
  onSelect: (ref: MentionRef) => void;
}) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const isEmpty = SECTIONS.every((s) => directory[s.key].length === 0);
  if (isEmpty) return null;

  return (
    <View
      style={{
        marginBottom: 8,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: '#131211',
        maxHeight: 260,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }}>
      <ScrollView keyboardShouldPersistTaps="handled">
        {SECTIONS.map((section) => {
          const items = directory[section.key];
          if (!items.length) return null;
          return (
            <View key={section.key}>
              <Text
                className="text-muted-foreground px-3 pb-1 pt-2 text-[11px] font-semibold uppercase"
                style={{ letterSpacing: 0.5 }}>
                {section.label}
              </Text>
              {items.map((item) => (
                <Pressable
                  key={`${item.kind}_${item.id}`}
                  onPress={() => onSelect(item)}
                  android_ripple={{ color: theme.backgroundElement }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: pressed ? theme.backgroundElement : 'transparent',
                  })}>
                  <MentionGlyph mention={item} size={30} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text }} className="text-[15px]" numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                      {item.kind === 'user' ? `@${item.inserted}` : item.inserted}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
