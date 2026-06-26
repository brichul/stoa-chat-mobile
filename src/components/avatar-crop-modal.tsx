import { Image } from 'expo-image';
import {
  ImageManipulator,
  SaveFormat,
  type ImageResult,
} from 'expo-image-manipulator';
import * as React from 'react';
import { ActivityIndicator, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CropZoom,
  useImageResolution,
  type CropContextResult,
  type CropZoomRefType,
} from 'react-native-zoom-toolkit';

import { Text } from '@/components/ui/text';
import { Palette } from '@/constants/theme';

/** Run the crop/rotation/flip described by CropZoom through expo-image-manipulator. */
async function renderCrop(uri: string, result: CropContextResult): Promise<ImageResult> {
  const { crop, context, resize } = result;
  let ctx = ImageManipulator.manipulate(uri).crop(crop);
  if (context.rotationAngle) ctx = ctx.rotate(context.rotationAngle);
  if (context.flipHorizontal) ctx = ctx.flip('horizontal');
  if (context.flipVertical) ctx = ctx.flip('vertical');
  if (resize) ctx = ctx.resize(resize);
  const image = await ctx.renderAsync();
  return image.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
}

export interface AvatarCropModalProps {
  /** Source image URI to crop; `null` keeps the modal closed. */
  uri: string | null;
  onCancel: () => void;
  onCropped: (uri: string) => void;
}

/**
 * Full-screen circular cropper for the profile photo. Pinch / drag to frame the
 * face inside the circle, then "Done" renders the cropped square via
 * expo-image-manipulator. Replaces the OS `allowsEditing` crop UI so it matches
 * the in-app zoom behaviour used elsewhere.
 */
export function AvatarCropModal({ uri, onCancel, onCropped }: AvatarCropModalProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ref = React.useRef<CropZoomRefType>(null);
  const [busy, setBusy] = React.useState(false);

  const { resolution } = useImageResolution(uri ? { uri } : { uri: '' });

  const cropSize = Math.min(width - 48, 320);

  const handleDone = async () => {
    if (!ref.current || !uri || busy) return;
    setBusy(true);
    try {
      const result = await renderCrop(uri, ref.current.crop());
      onCropped(result.uri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={uri !== null}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {uri && resolution ? (
            <CropZoom
              ref={ref}
              cropSize={{ width: cropSize, height: cropSize }}
              resolution={resolution}
              OverlayComponent={() => (
                <View
                  pointerEvents="none"
                  style={{
                    flex: 1,
                    borderRadius: cropSize / 2,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.85)',
                  }}
                />
              )}>
              <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            </CropZoom>
          ) : (
            <ActivityIndicator color="#fff" />
          )}

          <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 24, fontSize: 13 }}>
            Pinch and drag to frame your photo
          </Text>
        </View>

        {/* Action bar */}
        <View
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 16,
            right: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Pressable onPress={onCancel} hitSlop={8} disabled={busy}>
            <Text style={{ color: '#fff', fontSize: 16 }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={handleDone} hitSlop={8} disabled={busy || !resolution}>
            {busy ? (
              <ActivityIndicator color={Palette.accentStart} />
            ) : (
              <Text style={{ color: Palette.accentStart, fontSize: 16, fontWeight: '600' }}>
                Done
              </Text>
            )}
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
