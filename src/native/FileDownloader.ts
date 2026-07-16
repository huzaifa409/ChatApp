import { NativeModules } from 'react-native';

const { FileDownloader } = NativeModules;

export async function downloadFile(remoteUrl: string): Promise<string> {
  return FileDownloader.downloadFile(remoteUrl);
}