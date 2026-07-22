import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { Socket } from 'socket.io-client';
import BASE_URL from '../url/BaseUrl';
import { ChatMessage, ChatUser } from '../components/ChatPanel';
import { SelectedFile } from '../components/MediaViewerModal';
import { downloadFile } from '../native/FileDownloader';
import {
  saveMessageLocally,
  saveMessagesLocally,
  getLocalMessages,
  deleteMessageLocally,
  markMessageDeletedLocally,
  messageExistsLocally,
  getLocalConversations,
  saveContactLocally,
} from '../database/LocalDatabase';

export type ConversationItem = {
  other_xid: string;
  other_name: string;
  last_message: string;
  last_time: string;
};

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  heic: 'image/heic', bmp: 'image/bmp', tiff: 'image/tiff',
  mp4: 'video/mp4', mov: 'video/quicktime', mkv: 'video/x-matroska',
  avi: 'video/x-msvideo', webm: 'video/webm',
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain', zip: 'application/zip',
};

function getMimeType(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

const toFileUri = (p: string) => (p.startsWith('file://') ? p : `file://${p}`);

// Merge two conversation lists (local + server), keeping the freshest entry per contact
const mergeConversations = (a: ConversationItem[], b: ConversationItem[]): ConversationItem[] => {
  const map = new Map<string, ConversationItem>();
  [...a, ...b].forEach((item) => {
    const existing = map.get(item.other_xid);
    if (!existing || new Date(item.last_time).getTime() > new Date(existing.last_time).getTime()) {
      map.set(item.other_xid, item);
    }
  });
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.last_time).getTime() - new Date(x.last_time).getTime()
  );
};

export function useChat(myXid: string, socket: Socket | null) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  const [isSendingImage, setIsSendingImage] = useState(false);

  const selectedUserRef = useRef<ChatUser | null>(null);
  selectedUserRef.current = selectedUser;

  const pendingSentFilesRef = useRef<Map<string, string>>(new Map());

  // Local DB is the source of truth for the sidebar (MySQL only holds messages temporarily)
  const refreshLocalConversations = useCallback(() => {
    getLocalConversations(myXid)
      .then((local) => setConversations((prev) => mergeConversations(prev, local)))
      .catch((err) => console.error('[LocalDB] Failed to load local conversations:', err));
  }, [myXid]);

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

  // Load the sidebar from local history immediately, then also ask the server
  // (covers any edge case where a conversation exists server-side but not yet locally)
  useEffect(() => {
    refreshLocalConversations();
    if (!socket) return;
    socket.emit('getConversations', { myXid });
  }, [socket, myXid, refreshLocalConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleHistory = ({ otherXid, messages: history }: { otherXid: string; messages: ChatMessage[] }) => {
      (async () => {
        try {
          await saveMessagesLocally(history);

          if (selectedUserRef.current && selectedUserRef.current.xid === otherXid) {
            const merged = await getLocalMessages(myXid, otherXid);
            setMessages(merged);
          }
          refreshLocalConversations();
        } catch (err) {
          console.error('[LocalDB] Failed to sync history:', err);
        }
      })();
    };

    const handleNewMessage = (msg: ChatMessage) => {
      (async () => {
        let messageToStore: ChatMessage = msg;
        let shouldAck = false;

        if (msg.message_type === 'text') {
          shouldAck = msg.receiver_xid === myXid;
        } else if (msg.sender_xid === myXid) {
          const originalPath = msg.media_data
            ? pendingSentFilesRef.current.get(msg.media_data)
            : undefined;

          if (originalPath) {
            pendingSentFilesRef.current.delete(msg.media_data!);
            messageToStore = { ...msg, media_data: toFileUri(originalPath) };
          }
        } else if (msg.receiver_xid === myXid) {
          try {
            const alreadyExists = await messageExistsLocally(msg.id);
            if (alreadyExists) return;

            if (msg.media_data) {
              const remoteUrl = msg.media_data.startsWith('http')
                ? msg.media_data
                : `${BASE_URL}${msg.media_data}`;

              const localPath = await downloadFile(remoteUrl);
              messageToStore = { ...msg, media_data: toFileUri(localPath) };
            }
            shouldAck = true;
          } catch (err) {
            console.error('[Media] Download failed, will retry on next reconnect:', err);
            return;
          }
        }

        try {
          await saveMessageLocally(messageToStore);
          refreshLocalConversations(); // keeps sidebar accurate even without a server conversationUpdate
        } catch (err) {
          console.error('[LocalDB] Failed to save new message:', err);
        }

        if (shouldAck && socket) {
          socket.emit('messageDelivered', { messageId: msg.id, userXid: myXid });
        }

        setSelectedUser((current) => {
          if (current && (messageToStore.sender_xid === current.xid || messageToStore.receiver_xid === current.xid)) {
            setMessages((prev) => [...prev, messageToStore]);
          }
          return current;
        });
      })();
    };

    const handleConversationsList = (list: ConversationItem[]) => {
      list.forEach((item) => {
        saveContactLocally(item.other_xid, item.other_name).catch(() => {});
      });
      setConversations((prev) => mergeConversations(prev, list));
    };

    const handleConversationUpdate = (update: ConversationItem) => {
      saveContactLocally(update.other_xid, update.other_name).catch(() => {});
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.other_xid !== update.other_xid);
        return [update, ...filtered];
      });
    };

    const handleDeletedForEveryone = ({
      id,
      sender_xid,
      receiver_xid,
      created_at,
    }: {
      id: number;
      sender_xid: string;
      receiver_xid: string;
      created_at: string;
    }) => {
      markMessageDeletedLocally({ id, sender_xid, receiver_xid, created_at })
        .then(() => refreshLocalConversations())
        .catch((err) => console.error('[LocalDB] Failed to mark deleted locally:', err));

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === id);
        if (exists) {
          return prev.map((m) =>
            m.id === id
              ? { ...m, message_text: 'This message was deleted', message_type: 'deleted' as const, media_data: null }
              : m
          );
        }
        if (selectedUserRef.current && (sender_xid === selectedUserRef.current.xid || receiver_xid === selectedUserRef.current.xid)) {
          return [
            ...prev,
            {
              id,
              sender_xid,
              receiver_xid,
              message_text: 'This message was deleted',
              message_type: 'deleted' as const,
              media_data: null,
              created_at,
            },
          ];
        }
        return prev;
      });
    };

    const handleDeletedForMe = ({ id }: { id: number }) => {
      deleteMessageLocally(id)
        .then(() => refreshLocalConversations())
        .catch((err) => console.error('[LocalDB] Failed to delete locally:', err));
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    const handleErrorMessage = ({ error }: { error: string }) => {
      Alert.alert('Error', error);
    };

    socket.on('conversationHistory', handleHistory);
    socket.on('newMessage', handleNewMessage);
    socket.on('conversationsList', handleConversationsList);
    socket.on('conversationUpdate', handleConversationUpdate);
    socket.on('messageDeletedForEveryone', handleDeletedForEveryone);
    socket.on('messageDeletedForMe', handleDeletedForMe);
    socket.on('errorMessage', handleErrorMessage);

    return () => {
      socket.off('conversationHistory', handleHistory);
      socket.off('newMessage', handleNewMessage);
      socket.off('conversationsList', handleConversationsList);
      socket.off('conversationUpdate', handleConversationUpdate);
      socket.off('messageDeletedForEveryone', handleDeletedForEveryone);
      socket.off('messageDeletedForMe', handleDeletedForMe);
      socket.off('errorMessage', handleErrorMessage);
    };
  }, [socket, myXid, refreshLocalConversations]);

  const selectSearchResult = (result: ChatUser) => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(result);
    setMessages([]);

    saveContactLocally(result.xid, result.name).catch(() => {});

    getLocalMessages(myXid, result.xid)
      .then((local) => setMessages(local))
      .catch((err) => console.error('[LocalDB] Failed to load local messages:', err));

    if (socket) {
      socket.emit('joinConversation', { myXid, otherXid: result.xid });
      socket.emit('getHistory', { myXid, otherXid: result.xid });
    }
  };

  const openConversation = (item: ConversationItem) => {
    const contact: ChatUser = { name: item.other_name, xid: item.other_xid };
    setSelectedUser(contact);
    setMessages([]);

    saveContactLocally(contact.xid, contact.name).catch(() => {});

    getLocalMessages(myXid, contact.xid)
      .then((local) => setMessages(local))
      .catch((err) => console.error('[LocalDB] Failed to load local messages:', err));

    if (socket) {
      socket.emit('joinConversation', { myXid, otherXid: contact.xid });
      socket.emit('getHistory', { myXid, otherXid: contact.xid });
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedUser || !socket) return;

    socket.emit('sendMessage', {
      senderXid: myXid,
      receiverXid: selectedUser.xid,
      text: messageInput.trim(),
    });

    setMessageInput('');
  };

  const deleteForEveryone = (msg: ChatMessage) => {
    if (!socket) return;
    socket.emit('deleteMessageForEveryone', { 
      messageId: msg.id, 
      senderXid: msg.sender_xid,
      receiverXid: msg.receiver_xid,
      createdAt: msg.created_at,
      userXid: myXid 
    });
  };

  const deleteForMe = (messageId: number) => {
    if (!socket) return;
    socket.emit('deleteMessageForMe', { messageId, userXid: myXid });
  };

  const backFromChat = () => {
    setSelectedUser(null);
    setMessages([]);
  };

  const sendSingleFile = useCallback(async (file: SelectedFile) => {
    if (!selectedUserRef.current || !socket) return;

    const receiver = selectedUserRef.current;
    setIsSendingImage(true);

    try {
      const mimeType = getMimeType(file.path);
      const fileName = file.path.split('/').pop() || `upload-${Date.now()}`;

      const formData = new FormData();
      formData.append('file', {
        uri: `file://${file.path}`,
        type: mimeType,
        name: fileName,
      } as any);

      const response = await fetch(`${BASE_URL}/api/upload/file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const messageType = file.type === 'picture' ? 'image' : file.type;

      pendingSentFilesRef.current.set(data.fileUrl, file.path);

      socket.emit('sendMediaMessage', {
        senderXid: myXid,
        receiverXid: receiver.xid,
        mediaUrl: data.fileUrl,
        messageType,
        fileName,
      });

    } catch (err) {
      console.error('[media] Upload failed:', err);
    } finally {
      setIsSendingImage(false);
    }
  }, [socket, myXid]);

  const sendFiles = useCallback(async (filesToSend: SelectedFile[]) => {
    for (const file of filesToSend) {
      await sendSingleFile(file);
    }
  }, [sendSingleFile]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    conversations,
    selectedUser,
    messages,
    messageInput,
    setMessageInput,
    selectSearchResult,
    openConversation,
    sendMessage,
    sendFiles,
    backFromChat,
    isSendingImage,
    deleteForEveryone,
    deleteForMe,
  };
}