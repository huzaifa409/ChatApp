import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Avatar from './Avatar';
import GenericFlatList from './GenericFlatList';
import { ChatUser } from './ChatPanel';
import { ConversationItem } from '../hooks/useChat';

interface ChatSidebarProps {
  currentUserXid: string;
  searchQuery: string;
  onChangeSearchQuery: (text: string) => void;
  searchResults: ChatUser[];
  searchLoading: boolean;
  conversations: ConversationItem[];
  selectedUserXid: string | undefined;
  onSelectSearchResult: (user: ChatUser) => void;
  onOpenConversation: (item: ConversationItem) => void;
  formatXid: (digits: string) => string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentUserXid,
  searchQuery,
  onChangeSearchQuery,
  searchResults,
  searchLoading,
  conversations,
  selectedUserXid,
  onSelectSearchResult,
  onOpenConversation,
  formatXid,
}) => {
  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={styles.leftPanel}>
      <View style={styles.searchWrapper}>
        <Icon name="search" size={16} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by XID"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
          keyboardType="numeric"
          underlineColorAndroid="transparent"
          {...({ enableFocusRing: false } as any)}
        />
      </View>

      {isSearching ? (
        <View style={styles.searchDropdown}>
          {searchLoading ? (
            <Text style={styles.searchDropdownEmpty}>Searching...</Text>
          ) : searchResults.length === 0 ? (
            <Text style={styles.searchDropdownEmpty}>No results found</Text>
          ) : (
            searchResults.map((result) => {
              const isCurrentUser = result.xid === currentUserXid;
              return (
                <TouchableOpacity
                  key={result.xid}
                  style={styles.searchResultRow}
                  activeOpacity={0.7}
                  onPress={() => onSelectSearchResult(result)}
                >
                  <View style={styles.avatarWrap}>
                    <Avatar name={result.name} size={38} />
                  </View>
                  <View style={styles.searchResultTextWrap}>
                    <Text style={styles.searchResultName}>
                      {result.name}
                      {isCurrentUser && <Text style={styles.youLabel}> (You)</Text>}
                    </Text>
                    <Text style={styles.searchResultXid}>{formatXid(result.xid)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : (
        <View style={styles.conversationsListWrap}>
          <GenericFlatList<ConversationItem>
            data={conversations}
            keyExtractor={(item) => item.other_xid}
            emptyText="No conversations yet"
            renderItem={(item) => (
              <TouchableOpacity
                style={[
                  styles.conversationRow,
                  selectedUserXid === item.other_xid && styles.conversationRowActive,
                ]}
                activeOpacity={0.7}
                onPress={() => onOpenConversation(item)}
              >
                <Avatar name={item.other_name} size={44} />
                <View style={styles.conversationTextWrap}>
                  <Text style={styles.conversationName}>{item.other_name}</Text>
                  <Text style={styles.conversationPreview} numberOfLines={1}>
                    {item.last_message}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#ffffff',
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
  avatarWrap: { marginRight: 12 },
  searchResultTextWrap: { flex: 1 },
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
  youLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    fontStyle: 'italic',
    marginLeft: 20,
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
  conversationPreview: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.55)',
  },
});

export default ChatSidebar;