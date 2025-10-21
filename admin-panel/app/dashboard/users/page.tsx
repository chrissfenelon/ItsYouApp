'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  status: 'active' | 'inactive' | 'disabled';
  joinedAt: Date;
  lastActive?: Date;
}

interface UserActivity {
  totalMessages: number;
  totalSMS: number;
  recentMessages: any[];
  recentSMS: any[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserDetails(userId: string) {
    try {
      setLoadingActivity(true);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      if (data.success) {
        setUserActivity(data.activity);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingActivity(false);
    }
  }

  async function handleStatusChange(userId: string, newStatus: 'active' | 'inactive' | 'disabled') {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        alert('User status updated successfully!');
        fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all associated data.')) {
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('User deleted successfully!');
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  }

  function handleViewUser(user: User) {
    setSelectedUser(user);
    setUserActivity(null);
    fetchUserDetails(user.id);
  }

  function getRelativeTime(date: Date | undefined): string {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Filter users
  let filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    disabled: users.filter(u => u.status === 'disabled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">User Management</h2>
          <p className="text-gray-400">View and manage all registered users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
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
              <p className="text-gray-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Inactive</p>
              <p className="text-2xl font-bold text-white">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Disabled</p>
              <p className="text-2xl font-bold text-white">{stats.disabled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or phone..."
              className="glass-input w-full px-4 py-3 pl-12 rounded-lg text-white placeholder-gray-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-4 py-3 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No users found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">User</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">Contact</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">Status</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">Joined</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">Last Active</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full animated-gradient flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-semibold">{user.name || 'Unknown'}</p>
                            <p className="text-gray-400 text-sm">ID: {user.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white">{user.email || 'N/A'}</p>
                        <p className="text-gray-400 text-sm">{user.phone || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          user.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {new Date(user.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-gray-300">
                        {getRelativeTime(user.lastActive)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="glass-input p-2 rounded-lg hover:glass-button transition-all"
                          >
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="glass-input p-2 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Info */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="glass-input p-2 rounded-lg hover:glass-button transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-2 gap-6 glass-input p-6 rounded-lg mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Name</p>
                <p className="text-white font-semibold">{selectedUser.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Email</p>
                <p className="text-white font-semibold">{selectedUser.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Phone</p>
                <p className="text-white font-semibold">{selectedUser.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">User ID</p>
                <p className="text-white font-semibold text-xs">{selectedUser.id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Joined</p>
                <p className="text-white font-semibold">
                  {new Date(selectedUser.joinedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Last Active</p>
                <p className="text-white font-semibold">
                  {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>

            {/* Activity Stats */}
            {loadingActivity ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading activity...</p>
              </div>
            ) : userActivity && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="glass-card p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Messages</p>
                        <p className="text-2xl font-bold text-white">{userActivity.totalMessages}</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total SMS</p>
                        <p className="text-2xl font-bold text-white">{userActivity.totalSMS}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Management */}
            <div className="glass-input p-6 rounded-lg mt-6">
              <h4 className="text-white font-semibold mb-4">User Status</h4>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleStatusChange(selectedUser.id, 'active')}
                  disabled={selectedUser.status === 'active'}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                    selectedUser.status === 'active'
                      ? 'bg-green-500/30 text-green-400 cursor-not-allowed'
                      : 'glass-button text-white hover:bg-green-500/20'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleStatusChange(selectedUser.id, 'inactive')}
                  disabled={selectedUser.status === 'inactive'}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                    selectedUser.status === 'inactive'
                      ? 'bg-yellow-500/30 text-yellow-400 cursor-not-allowed'
                      : 'glass-button text-white hover:bg-yellow-500/20'
                  }`}
                >
                  Inactive
                </button>
                <button
                  onClick={() => handleStatusChange(selectedUser.id, 'disabled')}
                  disabled={selectedUser.status === 'disabled'}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                    selectedUser.status === 'disabled'
                      ? 'bg-red-500/30 text-red-400 cursor-not-allowed'
                      : 'glass-button text-white hover:bg-red-500/20'
                  }`}
                >
                  Disabled
                </button>
              </div>
            </div>

            {/* Delete User */}
            <div className="mt-6">
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                className="w-full glass-input px-6 py-3 rounded-lg text-red-400 font-semibold hover:bg-red-500/20 transition-all"
              >
                Delete User & All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
