'use client';

import { useState, useEffect } from 'react';

interface StorageBreakdown {
  category: string;
  size: number;
  percentage: number;
  count: number;
  color: string;
}

interface RecentUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  userId: string;
}

interface StorageStats {
  totalFiles: number;
  thisMonth: number;
  avgSize: number;
}

export default function StoragePage() {
  const [loading, setLoading] = useState(true);
  const [totalStorage, setTotalStorage] = useState(0);
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [stats, setStats] = useState<StorageStats>({
    totalFiles: 0,
    thisMonth: 0,
    avgSize: 0,
  });

  useEffect(() => {
    fetchStorageAnalytics();
  }, []);

  async function fetchStorageAnalytics() {
    try {
      setLoading(true);
      const response = await fetch('/api/storage');
      const data = await response.json();

      if (data.success) {
        setTotalStorage(data.storage.total);
        setBreakdown(data.storage.breakdown);
        setRecentUploads(data.storage.recentUploads);
        setStats(data.storage.stats);
      }
    } catch (error) {
      console.error('Error fetching storage analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  function getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Calculate storage capacity (5GB limit for demo)
  const storageCapacity = 5 * 1024 * 1024 * 1024; // 5GB in bytes
  const usagePercentage = Math.min(Math.round((totalStorage / storageCapacity) * 100), 100);
  const circumference = 2 * Math.PI * 80; // r=80
  const strokeDasharray = `${(usagePercentage / 100) * circumference} ${circumference}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Storage Management</h2>
          <p className="text-gray-400">Monitor Firebase Storage usage and files</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading storage analytics...</p>
        </div>
      ) : (
        <>
          {/* Storage Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Total Storage Card */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-white mb-6">Total Storage</h3>
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  {/* Circular Progress */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="url(#gradient)"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={strokeDasharray}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <p className="text-4xl font-bold text-white">{usagePercentage}%</p>
                    <p className="text-gray-400 text-sm mt-1">Used</p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-2">
                  {formatFileSize(totalStorage)} / {formatFileSize(storageCapacity)}
                </p>
                <p className="text-gray-400">Total storage capacity</p>
              </div>
            </div>

            {/* Storage Stats */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-white mb-6">Storage Statistics</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold">Total Files</p>
                      <p className="text-gray-400 text-sm">All uploaded files</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.totalFiles}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold">This Month</p>
                      <p className="text-gray-400 text-sm">Uploads this month</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold">Avg Upload Size</p>
                      <p className="text-gray-400 text-sm">Average file size</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatFileSize(stats.avgSize)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Breakdown */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-6">Storage Breakdown by Type</h3>
            {breakdown.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No files uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {breakdown.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="text-white font-semibold">{item.category}</span>
                        <span className="text-gray-500 text-sm">({item.count} files)</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-400">{formatFileSize(item.size)}</span>
                        <span className="text-white font-semibold w-12 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all duration-1000`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">Total Used</span>
                    <span className="text-white font-bold text-lg">
                      {formatFileSize(totalStorage)} ({usagePercentage}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Uploads */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-6">Recent Uploads</h3>
            {recentUploads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No recent uploads.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUploads.map((file) => (
                  <div key={file.id} className="glass-input p-4 rounded-lg hover:glass-card transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* File Icon */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          file.type === 'Photo' ? 'bg-pink-500/20' :
                          file.type === 'Music' ? 'bg-purple-500/20' :
                          file.type === 'Video' ? 'bg-blue-500/20' :
                          'bg-gray-500/20'
                        }`}>
                          {file.type === 'Photo' && (
                            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {file.type === 'Music' && (
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          )}
                          {file.type === 'Video' && (
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold truncate">{file.name}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-gray-400 text-sm">{file.userId}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 text-sm">{getRelativeTime(file.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Size */}
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-300 font-semibold">{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
