'use client';

export default function AnalyticsPage() {
  const statsCards = [
    { title: 'Total Users', value: '127', change: '+12%', icon: 'users', color: 'blue' },
    { title: 'Active Today', value: '48', change: '+8%', icon: 'activity', color: 'green' },
    { title: 'Messages Sent', value: '2,847', change: '+15%', icon: 'message', color: 'purple' },
    { title: 'Photos Shared', value: '1,847', change: '+22%', icon: 'photo', color: 'pink' },
  ];

  const activityData = [
    { day: 'Mon', messages: 420, photos: 180, users: 45 },
    { day: 'Tue', messages: 380, photos: 165, users: 42 },
    { day: 'Wed', messages: 450, photos: 195, users: 48 },
    { day: 'Thu', messages: 410, photos: 175, users: 44 },
    { day: 'Fri', messages: 520, photos: 220, users: 52 },
    { day: 'Sat', messages: 390, photos: 160, users: 38 },
    { day: 'Sun', messages: 360, photos: 150, users: 35 },
  ];

  const topUsers = [
    { name: 'John & Jane', messages: 342, photos: 156, storage: '450 MB', joinDate: '2024-01-10' },
    { name: 'Bob & Alice', messages: 298, photos: 134, storage: '380 MB', joinDate: '2024-01-08' },
    { name: 'Mike & Sarah', messages: 267, photos: 98, storage: '320 MB', joinDate: '2024-01-12' },
    { name: 'Tom & Lisa', messages: 245, photos: 87, storage: '290 MB', joinDate: '2024-01-14' },
    { name: 'David & Emma', messages: 223, photos: 76, storage: '265 MB', joinDate: '2024-01-11' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
          <p className="text-gray-400">Track app performance and user engagement</p>
        </div>
        <div className="flex space-x-2">
          <select className="glass-input px-4 py-2 rounded-lg text-white text-sm">
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
          <button className="glass-button px-6 py-2 rounded-lg text-white font-semibold">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="glass-card p-6 float-animation" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stat.color === 'blue' ? 'bg-blue-500/20' :
                stat.color === 'green' ? 'bg-green-500/20' :
                stat.color === 'purple' ? 'bg-purple-500/20' :
                'bg-pink-500/20'
              }`}>
                <svg className={`w-6 h-6 ${
                  stat.color === 'blue' ? 'text-blue-400' :
                  stat.color === 'green' ? 'text-green-400' :
                  stat.color === 'purple' ? 'text-purple-400' :
                  'text-pink-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {stat.icon === 'users' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  )}
                  {stat.icon === 'activity' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  )}
                  {stat.icon === 'message' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  )}
                  {stat.icon === 'photo' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  )}
                </svg>
              </div>
              <span className="text-green-400 text-sm font-semibold">{stat.change}</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Activity Chart */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold text-white mb-6">Weekly Activity</h3>

        {/* Simple Bar Chart */}
        <div className="h-80 flex items-end justify-between space-x-4">
          {activityData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-2">
              {/* Messages Bar */}
              <div className="w-full flex flex-col items-center space-y-1">
                <div
                  className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg hover:scale-105 transition-transform cursor-pointer"
                  style={{ height: `${(data.messages / 600) * 200}px` }}
                  title={`${data.messages} messages`}
                ></div>
              </div>

              {/* Day Label */}
              <span className="text-gray-400 text-sm font-semibold">{data.day}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-gray-400 text-sm">Messages</span>
          </div>
        </div>
      </div>

      {/* Top Users & App Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Top Active Users</h3>
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <div key={index} className="glass-input p-4 rounded-lg hover:glass-card transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full animated-gradient flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{user.name}</h4>
                      <p className="text-gray-400 text-sm">{user.messages} messages • {user.photos} photos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{user.storage}</p>
                    <p className="text-gray-400 text-sm">storage</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* App Usage Stats */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">App Usage Statistics</h3>
          <div className="space-y-6">
            {/* Messages by Platform */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-300 font-semibold">Messages by Platform</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-sm">WhatsApp</span>
                    <span className="text-white font-semibold">44%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: '44%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-sm">Instagram</span>
                    <span className="text-white font-semibold">35%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-sm">SMS</span>
                    <span className="text-white font-semibold">21%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" style={{ width: '21%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peak Usage Times */}
            <div className="glass-input p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-3">Peak Usage Times</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Morning (6AM - 12PM)</span>
                  <span className="text-blue-400 font-semibold">25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Afternoon (12PM - 6PM)</span>
                  <span className="text-green-400 font-semibold">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Evening (6PM - 12AM)</span>
                  <span className="text-purple-400 font-semibold">40%</span>
                </div>
              </div>
            </div>

            {/* User Engagement */}
            <div className="glass-input p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-3">User Engagement</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg. Messages/Day</span>
                  <span className="text-white font-semibold">406</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg. Photos/Day</span>
                  <span className="text-white font-semibold">264</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg. Session Duration</span>
                  <span className="text-white font-semibold">12m 34s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
