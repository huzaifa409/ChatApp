import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, ImageBackground } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import Header, { AttachmentType } from '../components/Header';
import MediaViewerModal, { SelectedFile } from '../components/MediaViewerModal';
import { pickImage, pickVideo, pickDocument } from '../native/ImagePicker';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

let idCounter = 0;
const generateId = () => `file-${Date.now()}-${idCounter++}`;

function HomeScreen({ route }: HomeScreenProps): React.JSX.Element {
  const { user } = route.params;

  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSelectOption = async (type: AttachmentType) => {
    let paths: string[] | null = null;

    if (type === 'picture') {
      paths = await pickImage();
    } else if (type === 'video') {
      paths = await pickVideo();
    } else if (type === 'document') {
      paths = await pickDocument();
    }

    if (paths && paths.length > 0) {
      const newFiles: SelectedFile[] = paths.map(path => ({
        id: generateId(),
        type,
        path,
      }));

      setFiles(newFiles);
      setCurrentIndex(0);
      setViewerVisible(true);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? files.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === files.length - 1 ? 0 : prev + 1));
  };

  const handleClose = () => {
    setViewerVisible(false);
  };

  return (
    <ImageBackground
      source={require('../../Assets/Splash-Background.webp')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <Header title={`Welcome, ${user.name}`} onSelectOption={handleSelectOption} />

        <MediaViewerModal
          visible={viewerVisible}
          files={files}
          currentIndex={currentIndex}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onClose={handleClose}
          onSelectIndex={setCurrentIndex}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    color: '#ffffff',
    fontSize: 14,
  },
});

export default HomeScreen;