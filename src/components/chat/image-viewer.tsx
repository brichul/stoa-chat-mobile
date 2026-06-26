import { Image } from 'expo-image';
import * as React from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fitContainer,
  Gallery,
  useImageResolution,
  type GalleryRefType,
} from 'react-native-zoom-toolkit';

import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';

export interface ViewerImage {
  uri: string;
  /** Intrinsic dimensions, when known — lets us size the page without a fetch. */
  width?: number;
  height?: number;
}

/**
 * A single page of the gallery, sized to fit the screen while preserving aspect
 * ratio. Falls back to fetching the resolution when the attachment didn't carry
 * its dimensions.
 */
function GalleryPage({ image }: { image: ViewerImage }) {
  const { width, height } = useWindowDimensions();
  const { resolution } = useImageResolution({ uri: image.uri });

  const aspect =
    image.width && image.height
      ? image.width / image.height
      : resolution
        ? resolution.width / resolution.height
        : undefined;

  // Until the aspect ratio is known, fill the screen so the gallery has a size
  // to work with; `contentFit="contain"" keeps the image undistorted meanwhile.
  const size = aspect ? fitContainer(aspect, { width, height }) : { width, height };

  return <Image source={{ uri: image.uri }} style={size} contentFit="contain" transition={150} />;
}

/**
 * The gallery surface itself. Lives in its own component so it only mounts while
 * the viewer is open — that way the current-index state is seeded fresh from
 * `initialIndex` on every open without an effect.
 */
function GalleryBody({
  images,
  initialIndex,
  onClose,
}: {
  images: ViewerImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const ref = React.useRef<GalleryRefType>(null);
  const [index, setIndex] = React.useState(initialIndex);

  const renderItem = React.useCallback((item: ViewerImage) => <GalleryPage image={item} />, []);
  const keyExtractor = React.useCallback((item: ViewerImage, i: number) => `${item.uri}-${i}`, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <Gallery
        ref={ref}
        data={images}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialIndex={initialIndex}
        onIndexChange={setIndex}
        onTap={onClose}
        onSwipe={(direction) => {
          if (direction === 'up' || direction === 'down') onClose();
        }}
      />

      {/* Close button */}
      <Pressable
        onPress={onClose}
        hitSlop={12}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 16,
          height: 36,
          width: 36,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 18,
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}>
        <Icon name="close" size={22} color="#fff" />
      </Pressable>

      {/* Index indicator (only meaningful with multiple images) */}
      {images.length > 1 && (
        <View style={{ position: 'absolute', top: insets.top + 14, alignSelf: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
            {index + 1} / {images.length}
          </Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

export interface ImageViewerProps {
  images: ViewerImage[];
  /** Which image to open on first show. */
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

/**
 * Full-screen, pinch-to-zoom image viewer. Swipe left/right to move between the
 * images in a message; pinch / double-tap to zoom; tap or swipe down to dismiss.
 *
 * The gallery lives inside a RN Modal, which renders in its own native view tree
 * outside the app's root GestureHandlerRootView — so it gets its own wrapper here.
 */
export function ImageViewer({ images, initialIndex = 0, visible, onClose }: ImageViewerProps) {
  if (!images.length) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      {visible && (
        <GalleryBody images={images} initialIndex={initialIndex} onClose={onClose} />
      )}
    </Modal>
  );
}
