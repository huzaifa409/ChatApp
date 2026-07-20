import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, LayoutChangeEvent, ScrollView, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { AttachmentType } from './Header';
import VideoPlayerView from '../native/VideoPlayerView';
import DocumentPreviewView from '../native/DocumentPreviewView';

export type SelectedFile = {
  id: string;
  type: AttachmentType;
  path: string;
};

interface MediaViewerModalProps {
  visible: boolean;
  files: SelectedFile[];
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  onRemoveFile:(id:string)=>void;

}



const MediaViewerModal: React.FC<MediaViewerModalProps> = ({visible , files , currentIndex , onPrevious , onNext , onClose , onSelectIndex,  onRemoveFile,}) => {

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const currentFile = files[currentIndex];

  useEffect(() => {
    if (!currentFile || currentFile.type !== 'picture') {
      setNaturalSize(null);
      return;
    }

    let isCancelled = false;

    Image.getSize(
      `file://${currentFile.path}`,
      (width, height) => {
        if (!isCancelled) {
          setNaturalSize({ width, height });
        }
      },
      () => {
        if (!isCancelled) setNaturalSize(null);
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [currentFile]);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  if (!visible || files.length === 0) {
    return null;
  }

  const hasMultiple = files.length > 1;

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
          <Icon name="x" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {hasMultiple && (
        <TouchableOpacity style={styles.arrowLeft} onPress={onPrevious}>
          <Icon name="chevron-left" size={32} color="#ffffff" />
        </TouchableOpacity>
      )}

      <View style={styles.content} onLayout={handleContainerLayout}>
        {currentFile.type === 'picture' && containerSize.width > 0 && (
          <Image
            key={currentFile.path}
            source={{ uri: `file://${currentFile.path}` }}
            style={{ width: imageDisplaySize.width, height: imageDisplaySize.height }}
            resizeMode="contain"
          />
        )}

        {currentFile.type === 'video' && (
          <VideoPlayerView videoPath={currentFile.path} style={styles.video} />
        )}

        {currentFile.type === 'document' && (
          <DocumentPreviewView filePath={currentFile.path} style={styles.docPreview} />
        )}
      </View>

      {hasMultiple && (
        <TouchableOpacity style={styles.arrowRight} onPress={onNext}>
          <Icon name="chevron-right" size={32} color="#ffffff" />
        </TouchableOpacity>
      )}


      {hasMultiple && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailStrip}
          contentContainerStyle={styles.thumbnailStripContent}
        >
          {files.map((file, index) => {
            if (file.type === 'document') return null;

            const isActive = index === currentIndex;

            return (
              <View key={file.id} style={styles.thumbnailWrapper}>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.thumbnailDelete}
                  onPress={() => onRemoveFile(file.id)}
                >
                  <Icon name="x" size={11} color="#ffffff" />
                </TouchableOpacity>

                {/* Thumbnail */}
                <TouchableOpacity
                  onPress={() => onSelectIndex(index)}
                  style={[
                    styles.thumbnail,
                    isActive && styles.thumbnailActive,
                  ]}
                >
                  {file.type === 'picture' && (
                    <View style={styles.imageWrapper} pointerEvents="none">
                      <Image
                        source={{ uri: `file://${file.path}` }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {file.type === 'video' && (
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
    zIndex: 2000,
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
    zIndex: 2010,
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
    zIndex: 2010,
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
    zIndex: 2010,
  },
  content: {
    width: '82%',
    height: '78%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    marginBottom: 40,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  docCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c0c45',
    textAlign: 'center',
    marginTop: 20,
    maxWidth: 260,
  },
  docType: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
  },
  counterWrapper: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 2010,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  docPreview: {
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
    
    // overflow: 'hidden',
    marginHorizontal: 6,
    backgroundColor: 'transparent',
    
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
  },
  thumbnailWrapper: {
  position: 'relative',
  marginHorizontal: 4,
  paddingTop: 8,
},

thumbnailDelete: {
    position: 'absolute',
    top: 3,
    right: 3,

    width: 18,
    height: 18,
    borderRadius: 9,

    backgroundColor: '#EF4444',

    justifyContent: 'center',
    alignItems: 'center',

    zIndex: 999,
},
imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
},
});

export default MediaViewerModal;