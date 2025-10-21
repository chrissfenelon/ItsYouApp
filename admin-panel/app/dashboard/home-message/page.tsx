'use client';

import { useState, useEffect } from 'react';

export default function HomeMessagePage() {
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCurrentMessage();
  }, []);

  async function fetchCurrentMessage() {
    try {
      setLoading(true);
      const response = await fetch('/api/home-message');
      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Error fetching home message:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/home-message', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Message saved successfully! ✓');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to save message');
      }
    } catch (error) {
      console.error('Error saving message:', error);
      alert('Error saving message');
    } finally {
      setIsSaving(false);
    }
  }

  const presetMessages = [
    "Welcome to ItsYouApp! ❤️\n\nYour romantic journey starts here.",
    "Love is in the air! 💕\n\nStart creating beautiful memories together.",
    "Together Forever ✨\n\nShare your love story with someone special.",
    "Your Love Hub 💖\n\nConnect, share, and celebrate your relationship.",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Home Screen Message</h2>
          <p className="text-gray-400">Customize the welcome message shown to users</p>
        </div>
        <div className="flex items-center space-x-4">
          {successMessage && (
            <span className="text-green-400 text-sm font-medium">{successMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="glass-button px-6 py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Message Editor</h3>

          {/* Text Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message Text
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 resize-none"
              placeholder="Enter your welcome message..."
            />
            <p className="text-gray-400 text-sm mt-2">
              {message.length} characters
            </p>
          </div>

          {/* Formatting Tips */}
          <div className="glass-input p-4 rounded-lg mb-6">
            <h4 className="text-white font-semibold mb-3">Formatting Tips:</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>• Use \n for line breaks</li>
              <li>• Add emojis to make it more engaging ❤️ 💕 ✨</li>
              <li>• Keep it concise and welcoming</li>
              <li>• Consider your app's tone and audience</li>
            </ul>
          </div>

          {/* Preset Messages */}
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Presets:</h4>
            <div className="grid grid-cols-2 gap-2">
              {presetMessages.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(preset)}
                  className="glass-input p-3 rounded-lg text-left text-sm text-gray-300 hover:glass-button transition-all"
                >
                  Preset {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Live Preview</h3>

          {/* Phone Mockup */}
          <div className="mx-auto max-w-sm">
            {/* Phone Frame */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-3 shadow-2xl">
              {/* Notch */}
              <div className="bg-black rounded-2xl overflow-hidden">
                <div className="h-6 bg-black relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-2xl"></div>
                </div>

                {/* Screen Content */}
                <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20 px-6 py-8 min-h-[600px] flex flex-col">
                  {/* App Logo */}
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full animated-gradient mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">ItsYouApp</h2>
                  </div>

                  {/* Message Display */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="glass-card p-6 text-center">
                      <p className="text-white text-lg whitespace-pre-line">
                        {message || "Your message will appear here..."}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="glass-button w-full py-4 rounded-lg text-white font-semibold mt-8">
                    Get Started
                  </button>
                </div>

                {/* Home Indicator */}
                <div className="bg-black h-8 flex items-center justify-center">
                  <div className="w-32 h-1 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <div className="mt-6 glass-input p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-sm">
                This preview shows how your message will appear to users when they open the app.
                Make sure it looks good on different screen sizes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message History */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Message History</h3>
        <div className="space-y-3">
          {[
            { message: "Welcome to ItsYouApp! ❤️", date: '2024-01-15 14:30', user: 'Admin' },
            { message: "Love is in the air! 💕", date: '2024-01-10 09:15', user: 'Admin' },
            { message: "Together Forever ✨", date: '2024-01-05 16:45', user: 'Admin' },
          ].map((item, index) => (
            <div key={index} className="glass-input p-4 rounded-lg hover:glass-card transition-all duration-200 cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-white font-semibold mb-2">{item.message}</p>
                  <div className="flex items-center space-x-3 text-sm text-gray-400">
                    <span>{item.user}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                  </div>
                </div>
                <button
                  onClick={() => setMessage(item.message)}
                  className="glass-input px-4 py-2 rounded-lg text-white text-sm hover:glass-button transition-all"
                >
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
