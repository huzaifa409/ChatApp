import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, ImageBackground, Alert, TouchableOpacity, Text } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import Header, { AttachmentType } from '../components/Header';
import ChatPanel from '../components/ChatPanel';
import ChatSidebar from '../components/ChatSidebar';
import WelcomeCard from '../components/WelcomeCard';
import { SelectedFile } from '../components/MediaViewerModal';
import { pickImage, pickVideo, pickDocument } from '../native/ImagePicker';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../socket/SocketContext';
import { useChat } from '../hooks/useChat';
import { closeLocalDB } from '../database/LocalDatabase';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

let idCounter = 0;
const generateId = () => `file-${Date.now()}-${idCounter++}`;

const formatXid = (digits: string) => digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();

function HomeScreen({ route, navigation }: HomeScreenProps): React.JSX.Element {
  const { user } = route.params;
  const { socket } = useSocket();

  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    searchQuery, setSearchQuery, searchResults, searchLoading,
    conversations, selectedUser, messages, messageInput, setMessageInput,
    selectSearchResult, openConversation, sendMessage, sendFiles,
    backFromChat, isSendingImage,
    deleteForEveryone, deleteForMe,
  } = useChat(user.xid, socket);

  const showWelcomeContent = !viewerVisible && files.length === 0 && !selectedUser;

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      if (updated.length === 0) setViewerVisible(false);
      else if (currentIndex >= updated.length) setCurrentIndex(updated.length - 1);
      return updated;
    });
  };

  const handleSendMessage = () => {
    if (files.length > 0) {
      sendFiles(files);
      setFiles([]);
    }
    if (messageInput.trim().length > 0) sendMessage();
  };

  const handleCopyXid = () => Clipboard.setString(user.xid);

  const handleSelectOption = async (type: AttachmentType) => {
    let paths: string[] | null = null;
    if (type === 'picture') paths = await pickImage();
    else if (type === 'video') paths = await pickVideo();
    else if (type === 'document') paths = await pickDocument();

    if (paths && paths.length > 0) {
      const newFiles: SelectedFile[] = paths.map((path) => ({ id: generateId(), type, path }));
      setFiles(newFiles);
      setCurrentIndex(0);
      setViewerVisible(true);
    }
  };

  const handlePrevious = () => setCurrentIndex((prev) => (prev === 0 ? files.length - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === files.length - 1 ? 0 : prev + 1));
  const handleClose = () => { setViewerVisible(false); setFiles([]); setCurrentIndex(0); };

  const handleLogout = () => {
  Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Sign Out',
      style: 'destructive',
      onPress: async () => {
        await closeLocalDB();
        await AsyncStorage.removeItem('user');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      },
    },
  ]);
};


  // const handleResetForTesting = async () => {
  //   await AsyncStorage.clear();
  //   navigation.reset({
  //     index: 0,
  //     routes: [{ name: 'Register' }],
  //   });
  // };

  return (
    <ImageBackground
      source={require('../../Assets/Splash-Background.webp')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <Header title={`Welcome, ${user.name}`} onLogout={handleLogout} />

        {/* <TouchableOpacity
          style={styles.devResetButton}
          onPress={handleResetForTesting}
          activeOpacity={0.7}
        >
          <Text style={styles.devResetText}>Reset APP</Text>
        </TouchableOpacity> */}

        <View style={styles.body}>
          <ChatSidebar
            currentUserXid={user.xid}
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            searchResults={searchResults}
            searchLoading={searchLoading}
            conversations={conversations}
            selectedUserXid={selectedUser?.xid}
            onSelectSearchResult={selectSearchResult}
            onOpenConversation={openConversation}
            formatXid={formatXid}
          />

          <View style={[styles.rightPanel, !selectedUser && styles.rightPanelCentered]}>
            {selectedUser ? (
              <ChatPanel
                currentUserXid={user.xid}
                selectedUser={selectedUser}
                messages={messages}
                messageInput={messageInput}
                onChangeMessageInput={setMessageInput}
                onSendMessage={handleSendMessage}
                onBack={backFromChat}
                formatXid={formatXid}
                onAttachmentSelect={handleSelectOption}
                viewerVisible={viewerVisible}
                files={files}
                currentIndex={currentIndex}
                onViewerPrevious={handlePrevious}
                onViewerNext={handleNext}
                onViewerClose={handleClose}
                onViewerSelectIndex={setCurrentIndex}
                isSendingImage={isSendingImage}
                onRemoveFile={handleRemoveFile}
                onDeleteForEveryone={deleteForEveryone}   // 👈 ADD THIS
                onDeleteForMe={deleteForMe}
              />
            ) : (
              showWelcomeContent && (
                <WelcomeCard
                  userName={user.name}
                  xid={user.xid}
                  formattedXid={formatXid(user.xid)}
                  onCopyXid={handleCopyXid}
                />
              )
            )}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, position: 'relative' },
  body: { flex: 1, flexDirection: 'row' },
  rightPanel: { flex: 1 },
  rightPanelCentered: { alignItems: 'center', justifyContent: 'center', padding: 32 },

  devResetButton: {
    position: 'absolute',
    bottom: 28,
    left: 28,
    backgroundColor: 'rgba(255,0,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  devResetText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default HomeScreen;