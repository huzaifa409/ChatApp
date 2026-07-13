import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  Image,
  ImageBackground,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import Header, { AttachmentType } from '../components/Header';
import MediaViewerModal, { SelectedFile } from '../components/MediaViewerModal';
import { pickImage, pickVideo, pickDocument } from '../native/ImagePicker';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSocket } from '../socket/SocketContext';
import ChatPanel, { ChatMessage, ChatUser } from '../components/ChatPanel';
import Avatar from '../components/Avatar';
import GenericFlatList from '../components/GenericFlatList';
import BASE_URL from '../url/BaseUrl';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

let idCounter = 0;
const generateId = () => `file-${Date.now()}-${idCounter++}`;

// Formats raw digits into "123 345 321" style for display
const formatXid = (digits: string) => {
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
};

function HomeScreen({ route, navigation }: HomeScreenProps): React.JSX.Element {
  const { user } = route.params;
  const { socket } = useSocket();

  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<ChatUser[]>([]);

  const showWelcomeContent = !viewerVisible && files.length === 0 && !selectedUser;

  // ---------- Debounced XID search ----------
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length === 0) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/users/search?query=${encodeURIComponent(trimmedQuery)}`
        );
        const data = await response.json();
        setSearchResults(data.users || []);
      } catch (err) {
        console.error('Search request error:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // ---------- Socket listeners for chat ----------
  useEffect(() => {
    if (!socket) return;

    const handleHistory = ({ otherXid, messages: history }: { otherXid: string; messages: ChatMessage[] }) => {
      setSelectedUser((current) => {
        if (current && otherXid === current.xid) {
          setMessages(history);
        }
        return current;
      });
    };

    const handleNewMessage = (msg: ChatMessage) => {
      setSelectedUser((current) => {
        if (current && (msg.sender_xid === current.xid || msg.receiver_xid === current.xid)) {
          setMessages((prev) => [...prev, msg]);
        }
        return current;
      });
    };

    socket.on('conversationHistory', handleHistory);
    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('conversationHistory', handleHistory);
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket]);

  // ---------- Handlers ----------
  const handleCopyXid = () => {
    Clipboard.setString(user.xid);
  };

  const handleSelectSearchResult = (result: ChatUser) => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(result);
    setMessages([]);

    // Add to conversations list if not already present
    setConversations((prev) => {
      const alreadyExists = prev.some((c) => c.xid === result.xid);
      if (alreadyExists) return prev;
      return [result, ...prev];
    });

    if (socket) {
      socket.emit('getHistory', { myXid: user.xid, otherXid: result.xid });
    }
  };

  const handleOpenConversation = (contact: ChatUser) => {
    setSelectedUser(contact);
    setMessages([]);

    if (socket) {
      socket.emit('getHistory', { myXid: user.xid, otherXid: contact.xid });
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedUser || !socket) return;

    socket.emit('sendMessage', {
      senderXid: user.xid,
      receiverXid: selectedUser.xid,
      text: messageInput.trim(),
    });

    setMessageInput('');
  };

  const handleBackFromChat = () => {
    setSelectedUser(null);
    setMessages([]);
  };

  const handleSelectOption = async (type: AttachmentType) => {
    setFabMenuVisible(false);
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

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('user');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleResetForTesting = async () => {
    await AsyncStorage.clear();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Register' }],
    });
  };

  return (
    <ImageBackground
      source={require('../../Assets/Splash-Background.webp')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <Header title={`Welcome, ${user.name}`} onLogout={handleLogout} />

        {/* TEMPORARY — dev-only reset button, remove before production */}
        <TouchableOpacity
          style={styles.devResetButton}
          onPress={handleResetForTesting}
          activeOpacity={0.7}
        >
          <Text style={styles.devResetText}>Reset (Dev)</Text>
        </TouchableOpacity>

        <View style={styles.body}>
          {/* LEFT PANEL — search */}
          <View style={styles.leftPanel}>
            <View style={styles.searchWrapper}>
              <Icon name="search" size={16} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by XID"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                keyboardType="numeric"
                underlineColorAndroid="transparent"
                {...({ enableFocusRing: false } as any)}
              />
            </View>

            {searchQuery.trim().length > 0 && (
              <View style={styles.searchDropdown}>
                {searchLoading ? (
                  <Text style={styles.searchDropdownEmpty}>Searching...</Text>
                ) : searchResults.length === 0 ? (
                  <Text style={styles.searchDropdownEmpty}>No results found</Text>
                ) : (
                  searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.xid}
                      style={styles.searchResultRow}
                      activeOpacity={0.7}
                      onPress={() => handleSelectSearchResult(result)}
                    >
                      <View style={styles.chatHeaderAvatarWrap}>
                        <Avatar name={result.name} size={38} />
                      </View>

                      <View style={styles.searchResultTextWrap}>
                        <Text style={styles.searchResultName}>{result.name}</Text>
                        <Text style={styles.searchResultXid}>{formatXid(result.xid)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {searchQuery.trim().length === 0 && (
              <View style={styles.conversationsListWrap}>


                <GenericFlatList
                  data={conversations}
                  keyExtractor={(item) => item.xid}
                  emptyText="No conversations yet"
                  renderItem={(item) => (
                    <TouchableOpacity
                      style={[
                        styles.conversationRow,
                        selectedUser?.xid === item.xid && styles.conversationRowActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleOpenConversation(item)}
                    >
                      <Avatar name={item.name} size={44} />
                      <View style={styles.conversationTextWrap}>
                        <Text style={styles.conversationName}>{item.name}</Text>
                        <Text style={styles.conversationXid}>{formatXid(item.xid)}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />

              </View>
            )}
          </View>

          {/* RIGHT PANEL — welcome / chat */}
          <View style={[styles.rightPanel, !selectedUser && styles.rightPanelCentered]}>
            {selectedUser ? (
              <ChatPanel
                currentUserXid={user.xid}
                selectedUser={selectedUser}
                messages={messages}
                messageInput={messageInput}
                onChangeMessageInput={setMessageInput}
                onSendMessage={handleSendMessage}
                onBack={handleBackFromChat}
                formatXid={formatXid}
              />
            ) : (
              showWelcomeContent && (
                <View style={styles.welcomeCard}>
                  <View style={styles.headingRow}>
                    <Text style={styles.heading}>Welcome to</Text>
                    <Image
                      source={require('../../Assets/xpalLogoBasic.png')}
                      style={styles.headingLogoImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.subheading}>
                    {user.name}, this is your account overview.
                  </Text>

                  <View style={styles.xidBlock}>
                    <Text style={styles.xidLabel}>Your XID</Text>
                    <View style={styles.xidRow}>
                      <Text style={styles.xidValue}>{formatXid(user.xid)}</Text>
                      <TouchableOpacity
                        onPress={handleCopyXid}
                        style={styles.copyButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                      >
                        <Icon name="copy" size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.xidHint}>
                      Keep this safe — you'll need it to log in.
                    </Text>
                  </View>
                </View>
              )
            )}

            <MediaViewerModal
              visible={viewerVisible}
              files={files}
              currentIndex={currentIndex}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onClose={handleClose}
              onSelectIndex={setCurrentIndex}
            />
          </View>
        </View>

        {/* <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => setFabMenuVisible(prev => !prev)}
        >
          <Icon name={fabMenuVisible ? 'x' : 'plus'} size={26} color="#ffffff" />
        </TouchableOpacity>

        {fabMenuVisible && (
          <View style={styles.fabMenu}>
            <Pressable style={styles.fabMenuItemRow} onPress={() => handleSelectOption('picture')}>
              <Icon name="image" size={16} color="#0c0c45" />
              <Text style={styles.fabMenuText}>Images</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.fabMenuItemRow} onPress={() => handleSelectOption('video')}>
              <Icon name="video" size={16} color="#0c0c45" />
              <Text style={styles.fabMenuText}>Videos</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.fabMenuItemRow} onPress={() => handleSelectOption('document')}>
              <Icon name="file-text" size={16} color="#0c0c45" />
              <Text style={styles.fabMenuText}>Documents</Text>
            </Pressable>
          </View>
        )} */}
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
    flexDirection: 'row',
  },

  /* ---------- Left panel ---------- */
  leftPanel: {
    width: 320,
    backgroundColor: 'rgb(16, 9, 27)',
    borderRightWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#ffffff',
  },
  leftPlaceholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchDropdown: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  searchDropdownEmpty: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingVertical: 16,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchResultAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#6C3CE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchResultTextWrap: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  searchResultXid: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.6)',
  },

  /* ---------- Right panel ---------- */
  rightPanel: {
    flex: 1,
  },
  rightPanelCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  welcomeCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 10,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headingLogoImage: {
    width: 42,
    height: 42,
    marginLeft: 8,
  },
  subheading: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 36,
  },
  xidBlock: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'transparent',
    paddingVertical: 26,
    alignItems: 'center',
  },
  xidLabel: {
    fontSize: 18.5,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  xidValue: {
    fontSize: 46,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  xidHint: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  xidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copyButton: {
    marginBottom: 10,
    padding: 4,
  },

  /* ---------- FAB ---------- */
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6C3CE9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C3CE9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 1000,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 96,
    right: 28,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 4,
    width: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 1000,
  },
  fabMenuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  fabMenuText: {
    fontSize: 14,
    color: '#0c0c45',
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginHorizontal: 8,
  },
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
  conversationsListWrap: {
    flex: 1,
    marginTop: 12,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  conversationRowActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  conversationTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  conversationName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  conversationXid: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.55)',
  },
  chatHeaderAvatarWrap: {
    marginRight: 12,
  },

});

export default HomeScreen;