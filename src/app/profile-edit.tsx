import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getUserProfile, updateMyProfile } from '@/api/profile';
import type { ProjectItem } from '@/api/types';
import { uploadFile } from '@/api/uploads';
import { AvatarCropModal } from '@/components/avatar-crop-modal';
import { avatarColor } from '@/components/chat/participant-avatar';
import { Icon } from '@/components/icons/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import { authImageSource } from '@/lib/auth-image';
import { useColorScheme } from 'nativewind';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="text-muted-foreground text-xs font-semibold uppercase">{label}</Text>
      {children}
    </View>
  );
}

export default function ProfileEdit() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const currentUserId = useCurrentUserId();

  const [username, setUsername] = React.useState<string | null>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [jobTitle, setJobTitle] = React.useState('');
  const [bio, setBio] = React.useState('');
  // Remote avatar URL (persisted) and a freshly-cropped local URI pending upload.
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [localAvatarUri, setLocalAvatarUri] = React.useState<string | null>(null);
  // URI of a freshly-picked image awaiting crop; null when the cropper is closed.
  const [cropUri, setCropUri] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<ProjectItem[]>([]);
  const [saving, setSaving] = React.useState(false);

  // Load the current profile from the backend.
  React.useEffect(() => {
    if (!currentUserId) return;
    let active = true;
    getUserProfile(currentUserId)
      .then(({ profile }) => {
        if (!active) return;
        setUsername(profile.username ?? null);
        setDisplayName(profile.display_name ?? '');
        setJobTitle(profile.job_title ?? '');
        setBio(profile.bio ?? '');
        setAvatarUrl(profile.avatar_url ?? null);
        setProjects(profile.current_projects ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [currentUserId]);

  // Username is assigned once and can't be changed — shown read-only below.
  const initialChar = (displayName || username || 'U').charAt(0).toUpperCase();
  const previewAvatar = localAvatarUri ?? avatarUrl;

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    // Crop in-app with AvatarCropModal rather than the OS editor, so the framing
    // experience matches the rest of the app's zoom UI.
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!res.canceled) {
      const uri = res.assets[0]?.uri;
      if (uri) setCropUri(uri);
    }
  };

  const updateProject = (index: number, patch: Partial<ProjectItem>) =>
    setProjects((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const addProject = () => setProjects((prev) => [...prev, { title: '', description: '' }]);
  const removeProject = (index: number) =>
    setProjects((prev) => prev.filter((_, i) => i !== index));

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Upload a freshly-cropped avatar first, then persist its durable URL.
      let nextAvatarUrl = avatarUrl;
      if (localAvatarUri) {
        const up = await uploadFile({
          uri: localAvatarUri,
          name: 'avatar.jpg',
          mimeType: 'image/jpeg',
        });
        nextAvatarUrl = up.url;
      }
      const cleanedProjects = projects
        .map((p) => ({ title: p.title.trim(), description: (p.description ?? '').trim() }))
        .filter((p) => p.title.length > 0);
      await updateMyProfile({
        display_name: displayName.trim() || null,
        avatar_url: nextAvatarUrl,
        job_title: jobTitle.trim() || null,
        bio: bio.trim() || null,
        current_projects: cleanedProjects,
      });
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-12 flex-row items-center justify-between px-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 px-2 justify-center">
          <Text className="text-muted-foreground text-base">Cancel</Text>
        </Pressable>
        <Text className="text-foreground text-base font-semibold">Edit profile</Text>
        <Pressable onPress={onSave} disabled={saving} hitSlop={8} className="h-10 px-2 justify-center">
          <Text className="text-primary text-base font-semibold">{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 48}>
        <ScrollView
          contentContainerClassName="px-4 pb-16 gap-5"
          keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <Pressable onPress={pickAvatar} className="items-center gap-2 py-4">
            <View>
              <Avatar alt={initialChar} style={{ width: 96, height: 96, borderRadius: 48 }}>
                {previewAvatar ? <AvatarImage source={authImageSource(previewAvatar)} /> : null}
                <AvatarFallback style={{ backgroundColor: avatarColor(currentUserId) }}>
                  <Text style={{ color: '#fff', fontSize: 40, fontWeight: '600' }}>{initialChar}</Text>
                </AvatarFallback>
              </Avatar>
              <View className="bg-secondary border-background absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2">
                <Icon name="photo-camera" size={16} />
              </View>
            </View>
            <Text className="text-primary text-sm font-medium">Change photo</Text>
          </Pressable>

          <Field label="Display name">
            <Input value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
          </Field>

          <Field label="Username">
            <View className="border-input bg-secondary/40 h-10 flex-row items-center rounded-md border px-3">
              <Text className="text-muted-foreground text-base">
                {username ? `@${username}` : '—'}
              </Text>
            </View>
            <Text className="text-muted-foreground text-xs">Your username can’t be changed.</Text>
          </Field>

          <Field label="Role">
            <Input value={jobTitle} onChangeText={setJobTitle} placeholder="e.g. Staff Engineer" />
          </Field>

          <Field label="Bio">
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="A short bio about yourself"
              placeholderTextColor={theme.textSecondary}
              multiline
              className="border-input bg-background text-foreground font-sans rounded-md border px-3 py-2 text-base"
              style={{ minHeight: 96, textAlignVertical: 'top', color: theme.text }}
            />
          </Field>

          {/* Current projects */}
          <View className="gap-2">
            <Text className="text-muted-foreground text-xs font-semibold uppercase">
              Current projects
            </Text>
            {projects.map((p, i) => (
              <View key={i} className="border-border gap-2 rounded-xl border p-3">
                <View className="flex-row items-center gap-2">
                  <Input
                    className="flex-1"
                    value={p.title}
                    onChangeText={(t) => updateProject(i, { title: t })}
                    placeholder="Project title"
                  />
                  <Pressable onPress={() => removeProject(i)} hitSlop={8} className="h-9 w-9 items-center justify-center">
                    <Icon name="delete-outline" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
                <TextInput
                  value={p.description}
                  onChangeText={(t) => updateProject(i, { description: t })}
                  placeholder="What it's about"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  className="border-input bg-background text-foreground font-sans rounded-md border px-3 py-2 text-sm"
                  style={{ minHeight: 60, textAlignVertical: 'top', color: theme.text }}
                />
              </View>
            ))}
            <Pressable
              onPress={addProject}
              className="border-border active:bg-secondary flex-row items-center justify-center gap-2 rounded-xl border border-dashed py-3">
              <Icon name="add" size={18} color={theme.textSecondary} />
              <Text className="text-muted-foreground text-sm font-medium">Add project</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AvatarCropModal
        uri={cropUri}
        onCancel={() => setCropUri(null)}
        onCropped={(uri) => {
          setLocalAvatarUri(uri);
          setCropUri(null);
        }}
      />
    </View>
  );
}
