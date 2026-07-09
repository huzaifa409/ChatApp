import { requireNativeComponent, ViewStyle } from 'react-native';

interface DocumentPreviewViewProps {
  filePath: string;
  style?: ViewStyle;
}

const DocumentPreviewView = requireNativeComponent<DocumentPreviewViewProps>('DocumentPreviewView');

export default DocumentPreviewView;