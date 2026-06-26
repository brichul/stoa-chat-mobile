import { ActivityIndicator, View } from 'react-native';

import { LoginScreen } from '@/components/auth/login-screen';
import { Workspace } from '@/components/workspace/workspace';
import { useAuth } from '@/contexts/auth-context';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginScreen />;
  }

  return <Workspace />;
}
