'use client';

export default function SmsPage() {
  const smsMessages = [
    { id: 1, contact: '+1 (555) 123-4567', name: 'John Doe', message: 'Hey, can you call me back?', time: '2024-01-15 15:30', type: 'received' },
    { id: 2, contact: '+1 (555) 987-6543', name: 'Jane Smith', message: 'Thanks for your help!', time: '2024-01-15 15:25', type: 'sent' },
    { id: 3, contact: '+1 (555) 456-7890', name: 'Bob Wilson', message: 'Meeting at 3pm tomorrow', time: '2024-01-15 15:20', type: 'received' },
    { id: 4, contact: '12345', name: 'Bank Alert', message: 'Your verification code is 847392', time: '2024-01-15 15:15', type: 'received' },
    { id: 5, contact: '+1 (555) 234-5678', name: 'Alice Johnson', message: 'On my way!', time: '2024-01-15 15:10', type: 'sent' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">SMS Messages</h2>
          <p className="text-gray-400">View all text messages sent and received</p>
        </div>
        <div className="flex space-x-3">
          <button className="glass-input px-6 py-3 rounded-lg text-white font-semibold hover:glass-button transition-all">
            Sync Now
          </button>
          <button className="glass-button px-6 py-3 rounded-lg text-white font-semibold">
            Export SMS
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total SMS</p>
              <p className="text-2xl font-bold text-white">606</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Received</p>
              <p className="text-2xl font-bold text-white">384</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Sent</p>
              <p className="text-2xl font-bold text-white">222</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Recent Messages</h3>

        <div className="space-y-4">
          {smsMessages.map((sms) => (
            <div key={sms.id} className="glass-input p-4 rounded-lg hover:glass-card transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Contact Icon */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {sms.name.charAt(0)}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-white font-semibold">{sms.name}</h4>
                      <p className="text-gray-400 text-sm">{sms.contact}</p>
                    </div>
                    <p className="text-gray-300">{sms.message}</p>
                    <p className="text-gray-500 text-sm mt-2">{sms.time}</p>
                  </div>
                </div>

                {/* Type Badge */}
                <span className={`text-xs px-3 py-1 rounded-full ${
                  sms.type === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {sms.type}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
          <p className="text-gray-400 text-sm">Showing 5 of 606 messages</p>
          <div className="flex space-x-2">
            <button className="glass-input px-4 py-2 rounded-lg text-white hover:glass-button transition-all">
              Previous
            </button>
            <button className="glass-button px-4 py-2 rounded-lg text-white">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
