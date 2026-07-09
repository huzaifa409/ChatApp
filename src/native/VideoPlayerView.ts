import { requireNativeComponent, ViewStyle } from 'react-native';

interface VideoPlayerViewProps {
  videoPath: string;
  style?: ViewStyle;
}

const VideoPlayerView = requireNativeComponent<VideoPlayerViewProps>('VideoPlayerView');

export default VideoPlayerView;