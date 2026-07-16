import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import VideoPlayerView from '../native/VideoPlayerView';
import DocumentPreviewView from '../native/DocumentPreviewView';

interface ReceivedMediaModalProps {
  visible: boolean;
  type: 'video' | 'document';
  localPath: string;
  onClose: () => void;
}

const ReceivedMediaModal: React.FC<ReceivedMediaModalProps> = ({ visible, type, localPath, onClose }) => {
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

      {type === 'video' ? (
        <VideoPlayerView videoPath={localPath} style={styles.mediaView} />
      ) : (
        <DocumentPreviewView filePath={localPath} style={styles.mediaView} />
      )}
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
  mediaView: {
    width: '90%',
    height: '80%',
  },
});

export default ReceivedMediaModal;