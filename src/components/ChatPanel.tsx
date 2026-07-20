import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Avatar from './Avatar';
import { AttachmentType } from './Header';
import MediaViewerModal, { SelectedFile } from './MediaViewerModal';
import BASE_URL from '../url/BaseUrl';
import { downloadFile } from '../native/FileDownloader';
import ReceivedMediaModal from './ReceivedMediaModal';


export type ChatMessage = {
  id: number;
  sender_xid: string;
  receiver_xid: string;
  message_text: string;
  message_type: 'text' | 'image' | 'video' | 'document';
  media_data?: string | null;   // URL/path for image, video, document
  created_at: string;
};

export type ChatUser = { name: string; xid: string };

interface ChatPanelProps {
  currentUserXid: string;
  selectedUser: ChatUser;
  messages: ChatMessage[];
  messageInput: string;
  onChangeMessageInput: (text: string) => void;
  onSendMessage: () => void;
  onBack: () => void;
  formatXid: (digits: string) => string;
  onAttachmentSelect: (type: AttachmentType) => void;

  // media viewer props
  viewerVisible: boolean;
  files: SelectedFile[];
  currentIndex: number;
  onViewerPrevious: () => void;
  onViewerNext: () => void;
  onViewerClose: () => void;
  onViewerSelectIndex: (index: number) => void;


  onRemoveFile: (id: string) => void;

  isSendingImage: boolean;
}



const ChatPanel: React.FC<ChatPanelProps> = ({
  currentUserXid,
  selectedUser,
  messages,
  messageInput,
  onChangeMessageInput,
  onSendMessage,
  onBack,
  formatXid,
  onAttachmentSelect,
  viewerVisible,
  files,
  currentIndex,
  onViewerPrevious,
  onViewerNext,
  onViewerClose,
  onViewerSelectIndex,
  onRemoveFile,
  isSendingImage,
}) => {


  const [receivedMediaId, setReceivedMediaId] = React.useState<number | null>(null);

  // FIX 1: reset the received-media popup when switching chats
  React.useEffect(() => {
    setReceivedMediaId(null);
  }, [selectedUser.xid]);

  const [attachMenuVisible, setAttachMenuVisible] = React.useState(false);

  // CLOSE the attachmentMenu when any other chat is opened
  React.useEffect(() => {
    setAttachMenuVisible(false);
  }, [selectedUser.xid]);

  // / Scroll to end when message length changes not on AttachmentMenu OPENING
  const scrollViewRef = React.useRef<ScrollView | null>(null);
  React.useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleOpenReceivedMedia = async (msg: ChatMessage) => {
    if (!msg.media_data) return;
    setReceivedMediaId(msg.id);
  };

  const handleAttachmentPress = (type: AttachmentType) => {
    setAttachMenuVisible(false);
    onAttachmentSelect(type);
  };

  const iscurrent = selectedUser.xid === currentUserXid;


  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.chatBackButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={18} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.chatHeaderAvatarWrap}>
          <Avatar name={selectedUser.name} size={38} />
        </View>

        <View>
          <Text style={styles.chatHeaderName}>{selectedUser.name}
            {iscurrent && <Text style={styles.youLabel}> (You)</Text>}
          </Text>
          <Text style={styles.chatHeaderXid}>{formatXid(selectedUser.xid)}</Text>
        </View>
        <View>



        </View>
      </View>

      <View style={styles.messagesArea}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
        >
          {messages.map((msg) => {
            const isMine = msg.sender_xid === currentUserXid;

            if (msg.message_type === 'image' && msg.media_data) {
              const uri = msg.media_data.startsWith('http')
                ? msg.media_data
                : `${BASE_URL}${msg.media_data}`;

              return (
                <View
                  key={msg.id}
                  style={isMine ? styles.imageBubbleMine : styles.imageBubbleTheirs}
                >

                  <TouchableOpacity
                    style={styles.imageTouchable}
                    activeOpacity={0.9}
                    onPress={() => handleOpenReceivedMedia(msg)}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.inlineImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                </View>
              );
            }

            if (msg.message_type === 'video' && msg.media_data) {
              return (
                <TouchableOpacity
                  key={msg.id}
                  style={isMine ? styles.mediaCardMine : styles.mediaCardTheirs}
                  activeOpacity={0.8}
                  onPress={() => handleOpenReceivedMedia(msg)}
                >
                  <View style={styles.videoThumb}>
                    <Icon name="play-circle" size={32} color="#ffffff" />
                  </View>
                  <Text style={styles.mediaCardLabel}>Video</Text>
                </TouchableOpacity>
              );
            }

            if (msg.message_type === 'document' && msg.media_data) {
              return (
                <TouchableOpacity
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs,
                    styles.documentBubble,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleOpenReceivedMedia(msg)}
                >
                  <Icon name="file-text" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.messageText} numberOfLines={1}>
                    {msg.message_text || 'Document'}
                  </Text>
                </TouchableOpacity>
              );
            }

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs,
                ]}
              >
                <Text style={styles.messageText}>{msg.message_text}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* ///Extra Overlay added to close AttachmentMenu */}
        {attachMenuVisible && (
          <Pressable
            style={styles.outsideCloseOverlay}
            onPress={() => setAttachMenuVisible(false)}
          />
        )}

        {/* Sending progress overlay */}
        {isSendingImage && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressCard}>
              <ActivityIndicator size="large" color="#6C3CE9" />
              <Text style={styles.progressLabel}>Sending image…</Text>
            </View>
          </View>
        )}

        <MediaViewerModal
          visible={viewerVisible}
          files={files}
          currentIndex={currentIndex}
          onPrevious={onViewerPrevious}
          onNext={onViewerNext}
          onClose={onViewerClose}
          onSelectIndex={onViewerSelectIndex}
          onRemoveFile={onRemoveFile}
        />
      </View>

      {!receivedMediaId && (
        <View style={styles.inputAreaWrap}>
          {attachMenuVisible && (
            <View style={styles.attachMenu}>
              <TouchableOpacity
                style={styles.attachMenuItem}
                activeOpacity={0.7}
                onPress={() => handleAttachmentPress('picture')}
              >
                <View style={[styles.attachIconBadge, { backgroundColor: '#F59E0B' }]}>
                  <Icon name="camera" size={16} color="#ffffff" />
                </View>
                <Text style={styles.attachMenuText}>Images</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachMenuItem}
                activeOpacity={0.7}
                onPress={() => handleAttachmentPress('video')}
              >
                <View style={[styles.attachIconBadge, { backgroundColor: '#EF4444' }]}>
                  <Icon name="video" size={16} color="#ffffff" />
                </View>
                <Text style={styles.attachMenuText}>Videos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachMenuItem}
                activeOpacity={0.7}
                onPress={() => handleAttachmentPress('document')}
              >
                <View style={[styles.attachIconBadge, { backgroundColor: '#3B82F6' }]}>
                  <Icon name="file-text" size={16} color="#ffffff" />
                </View>
                <Text style={styles.attachMenuText}>Documents</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.messageInputRow}>
            <TouchableOpacity
              style={styles.attachButton}
              activeOpacity={0.7}
              onPress={() => setAttachMenuVisible((prev) => !prev)}
            >
              <Icon name={attachMenuVisible ? 'x' : 'plus'} size={20} color="#ffffff" />
            </TouchableOpacity>

            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={messageInput}
              onChangeText={onChangeMessageInput}
              onSubmitEditing={onSendMessage}
              underlineColorAndroid="transparent"
              {...({ enableFocusRing: false } as any)}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={onSendMessage}
              activeOpacity={0.8}
            >
              <Icon name="send" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ReceivedMediaModal
        visible={!!receivedMediaId}
        initialMessageId={receivedMediaId}
        messages={messages}
        onClose={() => setReceivedMediaId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  messagesArea: {
    flex: 1,
    position: 'relative',
  },
  chatContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgb(1, 0, 2)',
    padding: 10
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chatBackButton: {
    marginRight: 12,
  },
  chatHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6C3CE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginHorizontal: 12
  },
  chatHeaderXid: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 12
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesListContent: {
    paddingVertical: 16,
  },
  messageBubble: {
    maxWidth: '65%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 10,
  },
  messageBubbleMine: {
    backgroundColor: '#6C3CE9',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    
  },
  messageBubbleTheirs: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    
  },
  messageText: {
    fontSize: 13.5,
    color: '#ffffff',
    lineHeight: 19,
  },
  messageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 10,
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C3CE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderAvatarWrap: {
    marginRight: 12,
  },
  inputAreaWrap: {
    position: 'relative',
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 16,
    marginBottom: 8,
    backgroundColor: '#1a1424',
    borderRadius: 14,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 5000,
  },
  attachMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  attachIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachMenuText: {
    fontSize: 13.5,
    color: '#ffffff',
    fontWeight: '600',
  },
  youLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    fontStyle: 'italic',
  },
  imageBubble: {
    padding: 4,
    borderRadius: 14,
    overflow: 'hidden',
  },
  imageTouchable: {
    width: '100%',
  },
  inlineImage: {
    width: 220,
    height: 180,
    borderRadius: 10,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
  },
  progressCard: {
    backgroundColor: '#1a1424',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 36,
    alignItems: 'center',
    minWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 16,
  },
  progressBarTrack: {
    width: 160,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#6C3CE9',
  },
  progressPercent: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 8,
  },
  attachedFilesStrip: {
    maxHeight: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  attachedFilesStripContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  attachedFileBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'visible',
    marginRight: 10,
  },
  attachedFileImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  attachedFilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  removeFileButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1a1424',
    zIndex: 10,
  },
  imageBubbleMine: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
 imageBubbleTheirs: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mediaCardMine: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 160,
  },
  mediaCardTheirs: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 160,
  },
  videoThumb: {
    width: '100%',
    height: 100,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCardLabel: {
    color: '#ffffff',
    fontSize: 12,
    padding: 8,
  },
  documentBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '75%',
  },
  outsideCloseOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
  },
});

export default ChatPanel;