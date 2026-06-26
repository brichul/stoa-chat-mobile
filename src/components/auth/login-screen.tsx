import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';

export function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = identifier.trim().length > 0 && password.length > 0 && !submitting;

  const onSubmit = React.useCallback(async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login({ identifier: identifier.trim().toLowerCase(), password }, remember);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in. Please try again.');
      setSubmitting(false);
    }
  }, [identifier, password, remember, login, submitting]);

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled">
        <View className="mb-10">
          <Text className="font-serif text-foreground text-4xl">Welcome back</Text>
          <Text className="text-muted-foreground mt-2 text-base">Sign in to your Stoa workspace.</Text>
        </View>

        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-foreground text-sm font-medium">Email or username</Text>
            <Input
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              returnKeyType="next"
              editable={!submitting}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-foreground text-sm font-medium">Password</Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              editable={!submitting}
            />
          </View>

          <Pressable
            className="flex-row items-center gap-2.5 py-1"
            onPress={() => setRemember((v) => !v)}
            disabled={submitting}>
            <Checkbox checked={remember} onCheckedChange={setRemember} disabled={submitting} />
            <Text className="text-foreground text-sm">Remember me</Text>
          </Pressable>

          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

          <Button className="mt-2" onPress={onSubmit} disabled={!canSubmit}>
            {submitting ? <ActivityIndicator color="#FEFDFC" /> : <Text>Sign in</Text>}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
