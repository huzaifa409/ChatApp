import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Avatar from './Avatar';
export type ChatMessage = {
  id: number;
  sender_xid: string;
  receiver_xid: string;
  message_text: string;
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
}) => {
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
          <Text style={styles.chatHeaderName}>{selectedUser.name}</Text>
          <Text style={styles.chatHeaderXid}>{formatXid(selectedUser.xid)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}
        ref={(ref) => {
          if (ref) ref.scrollToEnd({ animated: true });
        }}
      >
        {messages.map((msg) => {
          const isMine = msg.sender_xid === currentUserXid;
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

      <View style={styles.messageInputRow}>
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
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgb(1, 0, 2)',
    padding:10
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
    marginHorizontal:12
  },
  chatHeaderXid: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal:12
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
});

export default ChatPanel;