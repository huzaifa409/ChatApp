import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  LayoutChangeEvent,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import VideoPlayerView from '../native/VideoPlayerView';
import DocumentPreviewView from '../native/DocumentPreviewView';
import { ChatMessage } from './ChatPanel';
import BASE_URL from '../url/BaseUrl';
import { downloadFile } from '../native/FileDownloader';

interface ReceivedMediaModalProps {
  visible: boolean;
  messages: ChatMessage[];
  initialMessageId: number | null;
  onClose: () => void;
}

// Resolves any media_data value to a renderable URI/path.
// - 'file://...'  -> already local (background-downloaded or sender's own original), strip prefix for native Image.getSize/VideoPlayerView/DocumentPreviewView which expect a raw path
// - 'http...'     -> remote URL, used as-is (fallback only, shouldn't normally be hit for a message we're viewing)
// - otherwise     -> relative server path, prefix with BASE_URL
const resolveLocalPath = (mediaData: string): string | null => {
  if (mediaData.startsWith('file://')) return mediaData.replace('file://', '');
  return null; // not local — caller should download it
};

const resolveDisplayUri = (mediaData: string): string => {
  if (mediaData.startsWith('http')) return mediaData;
  if (mediaData.startsWith('file://')) return mediaData;
  return `${BASE_URL}${mediaData}`;
};

const ReceivedMediaModal: React.FC<ReceivedMediaModalProps> = ({
  visible,
  messages,
  initialMessageId,
  onClose,
}) => {
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  });

  const [mediaMessages, setMediaMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [downloading, setDownloading] = useState(false);
  const [currentLocalPath, setCurrentLocalPath] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || initialMessageId === null) {
      setCurrentLocalPath(null);
      setCurrentIndex(-1);
      setMediaMessages([]);
      return;
    }

    const initialMsg = messages.find((m) => m.id === initialMessageId);
    if (!initialMsg) return;

    if (initialMsg.message_type === 'document') {
      setMediaMessages([initialMsg]);
      if (currentIndex === -1) setCurrentIndex(0);
    } else {
      const media = messages.filter(
        (m) =>
          m.media_data &&
          (m.message_type === 'image' || m.message_type === 'video')
      );
      setMediaMessages(media);

      if (currentIndex === -1) {
        const idx = media.findIndex((m) => m.id === initialMessageId);
        setCurrentIndex(idx !== -1 ? idx : 0);
      }
    }
  }, [visible, initialMessageId, messages]);

  const currentMsg =
    currentIndex >= 0 && currentIndex < mediaMessages.length
      ? mediaMessages[currentIndex]
      : null;

  useEffect(() => {
    if (!currentMsg || !currentMsg.media_data) return;

    let isCancelled = false;
    const fetchMedia = async () => {
      // Already local (background-downloaded on receive, or sender's own original) — use directly, no re-download.
      const localPath = resolveLocalPath(currentMsg.media_data!);
      if (localPath) {
        setCurrentLocalPath(localPath);
        setDownloading(false);
        return;
      }

      setDownloading(true);
      setCurrentLocalPath(null);
      const remoteUrl = resolveDisplayUri(currentMsg.media_data!);
      try {
        const downloadedPath = await downloadFile(remoteUrl);
        if (!isCancelled) {
          setCurrentLocalPath(downloadedPath);
        }
      } catch (err) {
        console.error('Failed to download media', err);
      } finally {
        if (!isCancelled) {
          setDownloading(false);
        }
      }
    };

    fetchMedia();

    return () => {
      isCancelled = true;
    };
  }, [currentMsg]);

  useEffect(() => {
    if (!currentMsg || currentMsg.message_type !== 'image' || !currentLocalPath) {
      setNaturalSize(null);
      return;
    }

    let cancelled = false;

    Image.getSize(
      `file://${currentLocalPath}`,
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
  }, [currentMsg, currentLocalPath]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaMessages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaMessages.length - 1 ? 0 : prev + 1));
  };

  if (!visible || !currentMsg) return null;

  const hasMultiple = mediaMessages.length > 1;

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

  return (
    <Pressable style={styles.overlay}>
      {/* Top toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View pointerEvents="none">
            <Icon name="x" size={20} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>

      {hasMultiple && (
        <TouchableOpacity style={styles.arrowLeft} onPress={handlePrevious}>
          <View pointerEvents="none">
            <Icon name="chevron-left" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.content} onLayout={handleContainerLayout}>
        {downloading && (
          <ActivityIndicator size="large" color="#ffffff" />
        )}

        {!downloading && currentLocalPath && currentMsg.message_type === 'image' && containerSize.width > 0 && (
          <Image
            source={{ uri: `file://${currentLocalPath}` }}
            resizeMode="contain"
            style={{
              width: imageDisplaySize.width,
              height: imageDisplaySize.height,
            }}
          />
        )}

        {!downloading && currentLocalPath && currentMsg.message_type === 'video' && (
          <VideoPlayerView
            videoPath={currentLocalPath}
            style={styles.mediaView}
          />
        )}

        {!downloading && currentLocalPath && currentMsg.message_type === 'document' && (
          <DocumentPreviewView
            filePath={currentLocalPath}
            style={styles.mediaView}
          />
        )}
      </View>

      {hasMultiple && (
        <TouchableOpacity style={styles.arrowRight} onPress={handleNext}>
          <View pointerEvents="none">
            <Icon name="chevron-right" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>
      )}

      {hasMultiple && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailStrip}
          contentContainerStyle={styles.thumbnailStripContent}
        >
          {mediaMessages.map((msg, index) => {
            const isActive = index === currentIndex;
            const thumbUri = msg.media_data ? resolveDisplayUri(msg.media_data) : undefined;

            return (
              <View key={msg.id} style={styles.thumbnailWrapper}>
                <TouchableOpacity
                  onPress={() => setCurrentIndex(index)}
                  style={[
                    styles.thumbnail,
                    isActive && styles.thumbnailActive,
                  ]}
                >
                  {msg.message_type === 'image' && thumbUri && (
                    <View style={styles.imageWrapper} pointerEvents="none">
                      <Image
                        source={{ uri: thumbUri }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {msg.message_type === 'video' && (
                    <View style={styles.thumbnailVideoPlaceholder} pointerEvents="none">
                      <Icon name="play" size={16} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgb(10, 8, 16)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4000,
    cursor: 'default',
  } as any,
  toolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 4010,
    backgroundColor: 'transparent',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4010,
  },
  arrowRight: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4010,
  },
  content: {
    width: '82%',
    height: '78%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    marginBottom: 40,
  },
  mediaView: {
    width: '100%',
    height: '100%',
  },
  thumbnailStrip: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    height: 82,
  },
  thumbnailStripContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  thumbnail: {
    width: 62,
    height: 62,
    borderRadius: 8,
    marginHorizontal: 6,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#ffffff',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailVideoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginHorizontal: 4,
    paddingTop: 0,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
});

export default ReceivedMediaModal;