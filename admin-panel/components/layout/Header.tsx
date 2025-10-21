'use client';

import { useState } from 'react';

export default function Header() {
  const [selectedUser, setSelectedUser] = useState('all');

  return (
    <header className="glass border-b border-white/10 p-6">
      <div className="flex items-center justify-between">
        {/* Page Title & User Selector */}
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400">Welcome back, Admin</p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-sm text-gray-400">Viewing:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="glass-input px-4 py-2 rounded-lg text-white text-sm"
            >
              <option value="all">All Users</option>
              <option value="user1">User 1</option>
              <option value="user2">User 2</option>
              <option value="user3">User 3</option>
            </select>
          </div>
        </div>

        {/* Storage & User Info */}
        <div className="flex items-center space-x-6">
          {/* Storage Indicator */}
          <div className="glass-card px-4 py-2 flex items-center space-x-3">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <div>
              <p className="text-xs text-gray-400">Storage</p>
              <p className="text-sm font-semibold text-white">2.4 GB / 5 GB</p>
            </div>
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-pink-500 rounded-full" style={{ width: '48%' }}></div>
            </div>
          </div>

          {/* Admin Avatar */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full animated-gradient flex items-center justify-center">
              <span className="text-white font-semibold">A</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
