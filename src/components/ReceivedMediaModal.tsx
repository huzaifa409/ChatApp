import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  LayoutChangeEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import VideoPlayerView from '../native/VideoPlayerView';
import DocumentPreviewView from '../native/DocumentPreviewView';

interface ReceivedMediaModalProps {
  visible: boolean;
  type: 'image' | 'video' | 'document';
  localPath: string;
  onClose: () => void;
}

const ReceivedMediaModal: React.FC<ReceivedMediaModalProps> = ({
  visible,
  type,
  localPath,
  onClose,
}) => {
  const [naturalSize, setNaturalSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  const [containerSize, setContainerSize] = React.useState({
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    if (type !== 'image') {
      setNaturalSize(null);
      return;
    }

    let cancelled = false;

    Image.getSize(
      `file://${localPath}`,
      (width, height) => {
        if (!cancelled) {
          setNaturalSize({ width, height });
        }
      },
      () => {
        if (!cancelled) {
          setNaturalSize(null);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [type, localPath]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  let imageDisplaySize = { width: 300, height: 300 };

  if (naturalSize && containerSize.width > 0 && containerSize.height > 0) {
    const widthScale = containerSize.width / naturalSize.width;
    const heightScale = containerSize.height / naturalSize.height;
    const scale = Math.min(widthScale, heightScale, 1);

    imageDisplaySize = {
      width: naturalSize.width * scale,
      height: naturalSize.height * scale,
    };
  }

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="x" size={24} color="#ffffff" />
      </TouchableOpacity>

      <View style={styles.content} onLayout={handleContainerLayout}>
        {type === 'image' && containerSize.width > 0 && (
          <Image
            source={{ uri: `file://${localPath}` }}
            resizeMode="contain"
            style={{
              width: imageDisplaySize.width,
              height: imageDisplaySize.height,
            }}
          />
        )}

        {type === 'video' && (
          <VideoPlayerView
            videoPath={localPath}
            style={styles.mediaView}
          />
        )}

        {type === 'document' && (
          <DocumentPreviewView
            filePath={localPath}
            style={styles.mediaView}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4000,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    zIndex: 10,
  },
  content: {
    width: '90%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaView: {
    width: '90%',
    height: '80%',
  },
});

export default ReceivedMediaModal;