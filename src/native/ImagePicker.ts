import { NativeModules } from 'react-native';

const { ImagePickerModule } = NativeModules;

export const pickImage = async (): Promise<string[] | null> => {
  try {
    const paths: string[] = await ImagePickerModule.pickImage();
    return paths;
  } catch (error) {
    console.log('Image picker cancelled or failed:', error);
    return null;
  }
};

export const pickVideo = async (): Promise<string[] | null> => {
  try {
    const paths: string[] = await ImagePickerModule.pickVideo();
    return paths;
  } catch (error) {
    console.log('Video picker cancelled or failed:', error);
    return null;
  }
};

export const pickDocument = async (): Promise<string[] | null> => {
  try {
    const paths: string[] = await ImagePickerModule.pickDocument();
    return paths;
  } catch (error) {
    console.log('Document picker cancelled or failed:', error);
    return null;
  }
};

export const openFile = async (path: string): Promise<boolean> => {
  try {
    const result: boolean = await ImagePickerModule.openFile(path);
    return result;
  } catch (error) {
    console.log('Failed to open file:', error);
    return false;
  }
};
