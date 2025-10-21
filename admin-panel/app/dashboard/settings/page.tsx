'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [adminEmail, setAdminEmail] = useState('admin@itsyouapp.com');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [dataRetention, setDataRetention] = useState('90');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Manage your admin panel preferences and configurations</p>
      </div>

      {/* Account Settings */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Account Settings</h3>

        <div className="space-y-6">
          {/* Admin Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="glass-input w-full md:w-2/3 px-4 py-3 rounded-lg text-white"
            />
            <p className="text-gray-500 text-sm mt-2">
              This email will receive important notifications and alerts
            </p>
          </div>

          {/* Change Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Change Password
            </label>
            <button className="glass-button px-6 py-3 rounded-lg text-white font-semibold">
              Update Password
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 glass-input rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Two-Factor Authentication</h4>
              <p className="text-gray-400 text-sm mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                twoFactorEnabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  twoFactorEnabled ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Notification Settings</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-input rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Email Notifications</h4>
              <p className="text-gray-400 text-sm mt-1">
                Receive email alerts for new messages and activities
              </p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                emailNotifications ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  emailNotifications ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              ></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 glass-input rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Push Notifications</h4>
              <p className="text-gray-400 text-sm mt-1">
                Get push notifications on your device
              </p>
            </div>
            <button className="relative w-14 h-7 rounded-full bg-gray-600">
              <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full"></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 glass-input rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Storage Alerts</h4>
              <p className="text-gray-400 text-sm mt-1">
                Alert when storage reaches 80% capacity
              </p>
            </div>
            <button className="relative w-14 h-7 rounded-full bg-blue-500">
              <div className="absolute top-0.5 translate-x-7 w-6 h-6 bg-white rounded-full"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Data Management</h3>

        <div className="space-y-6">
          {/* Auto Backup */}
          <div className="flex items-center justify-between p-4 glass-input rounded-lg">
            <div>
              <h4 className="text-white font-semibold">Automatic Backups</h4>
              <p className="text-gray-400 text-sm mt-1">
                Automatically backup data daily at midnight
              </p>
            </div>
            <button
              onClick={() => setAutoBackup(!autoBackup)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                autoBackup ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  autoBackup ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              ></div>
            </button>
          </div>

          {/* Data Retention */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data Retention Period
            </label>
            <select
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
              className="glass-input px-4 py-3 rounded-lg text-white w-full md:w-1/2"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </select>
            <p className="text-gray-500 text-sm mt-2">
              How long to keep captured messages and data
            </p>
          </div>

          {/* Export Data */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Export All Data
            </label>
            <button className="glass-button px-6 py-3 rounded-lg text-white font-semibold">
              Download Data Archive
            </button>
            <p className="text-gray-500 text-sm mt-2">
              Export all data as JSON files
            </p>
          </div>
        </div>
      </div>

      {/* Firebase Settings */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Firebase Configuration</h3>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-input p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Project ID</p>
              <p className="text-white font-semibold">itsyouapp-abc123</p>
            </div>
            <div className="glass-input p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Region</p>
              <p className="text-white font-semibold">us-central1</p>
            </div>
            <div className="glass-input p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Storage Bucket</p>
              <p className="text-white font-semibold">itsyouapp.appspot.com</p>
            </div>
            <div className="glass-input p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Status</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 glow"></div>
                <p className="text-green-400 font-semibold">Connected</p>
              </div>
            </div>
          </div>

          <button className="glass-input px-6 py-3 rounded-lg text-white font-semibold hover:glass-button transition-all">
            Test Connection
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border-2 border-red-500/20">
        <h3 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-input rounded-lg border border-red-500/20">
            <div>
              <h4 className="text-white font-semibold">Clear All Messages</h4>
              <p className="text-gray-400 text-sm mt-1">
                Permanently delete all captured messages
              </p>
            </div>
            <button className="px-6 py-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-semibold hover:bg-red-500/30 transition-all">
              Clear Data
            </button>
          </div>

          <div className="flex items-center justify-between p-4 glass-input rounded-lg border border-red-500/20">
            <div>
              <h4 className="text-white font-semibold">Reset Admin Panel</h4>
              <p className="text-gray-400 text-sm mt-1">
                Reset all settings to default values
              </p>
            </div>
            <button className="px-6 py-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-semibold hover:bg-red-500/30 transition-all">
              Reset Settings
            </button>
          </div>

          <div className="flex items-center justify-between p-4 glass-input rounded-lg border border-red-500/20">
            <div>
              <h4 className="text-white font-semibold">Delete Admin Account</h4>
              <p className="text-gray-400 text-sm mt-1">
                Permanently delete this admin account and all data
              </p>
            </div>
            <button className="px-6 py-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-semibold hover:bg-red-500/30 transition-all">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4">
        <button className="glass-input px-6 py-3 rounded-lg text-white font-semibold hover:glass-button transition-all">
          Cancel
        </button>
        <button className="glass-button px-6 py-3 rounded-lg text-white font-semibold">
          Save All Settings
        </button>
      </div>
    </div>
  );
}
