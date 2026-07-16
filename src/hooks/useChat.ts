import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import BASE_URL from '../url/BaseUrl';
import { ChatMessage, ChatUser } from '../components/ChatPanel';
import { SelectedFile } from '../components/MediaViewerModal';

export type ConversationItem = {
  other_xid: string;
  other_name: string;
  last_message: string;
  last_time: string;
};

// Extension -> mime type lookup, used to tag the upload correctly
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

export function useChat(myXid: string, socket: Socket | null) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  // Media sending progress state (covers image, video, document)
  const [isSendingImage, setIsSendingImage] = useState(false);

  // Track latest selectedUser in a ref so socket callbacks can read it without stale closure
  const selectedUserRef = useRef<ChatUser | null>(null);
  selectedUserRef.current = selectedUser;

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

  // ---------- Fetch conversation list once the socket is ready ----------
  useEffect(() => {
    if (!socket) return;
    socket.emit('getConversations', { myXid });
  }, [socket, myXid]);

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

    const handleConversationsList = (list: ConversationItem[]) => {
      setConversations(list);
    };

    const handleConversationUpdate = (update: ConversationItem) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.other_xid !== update.other_xid);
        return [update, ...filtered];
      });
    };

    socket.on('conversationHistory', handleHistory);
    socket.on('newMessage', handleNewMessage);
    socket.on('conversationsList', handleConversationsList);
    socket.on('conversationUpdate', handleConversationUpdate);

    return () => {
      socket.off('conversationHistory', handleHistory);
      socket.off('newMessage', handleNewMessage);
      socket.off('conversationsList', handleConversationsList);
      socket.off('conversationUpdate', handleConversationUpdate);
    };
  }, [socket]);

  // ---------- Handlers ----------
  const selectSearchResult = (result: ChatUser) => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(result);
    setMessages([]);

    if (socket) {
      socket.emit('joinConversation', { myXid, otherXid: result.xid });
      socket.emit('getHistory', { myXid, otherXid: result.xid });
    }
  };

  const openConversation = (item: ConversationItem) => {
    const contact: ChatUser = { name: item.other_name, xid: item.other_xid };
    setSelectedUser(contact);
    setMessages([]);

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

  const backFromChat = () => {
    setSelectedUser(null);
    setMessages([]);
  };

  // ---------- Media sending (HTTP multipart) — covers image, video, document ----------
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
        // No Content-Type header — fetch sets the multipart boundary itself
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // picker type 'picture' maps to stored message_type 'image'; video/document stay as-is
      const messageType = file.type === 'picture' ? 'image' : file.type;

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

  /**
   * Sends multiple files sequentially (one finishes before next starts).
   * Accepts full SelectedFile objects so the type (picture/video/document) is preserved.
   */
  const sendFiles = useCallback(async (filesToSend: SelectedFile[]) => {
    for (const file of filesToSend) {
      await sendSingleFile(file);
    }
  }, [sendSingleFile]);

  return {
    // search
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    // conversations
    conversations,
    // active chat
    selectedUser,
    messages,
    messageInput,
    setMessageInput,
    // actions
    selectSearchResult,
    openConversation,
    sendMessage,
    sendFiles,
    backFromChat,
    // media sending state
    isSendingImage,
  };
}