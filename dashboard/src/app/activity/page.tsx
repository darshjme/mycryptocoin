'use client';

import React, { useState } from 'react';

const todayActivities = [
  { initials: 'KH', color: 'bg-indigo-500', text: '<strong>API Key</strong> rotated for production environment', time: 'Mar 19, 2026 - 10:30 AM' },
  { initials: 'SY', color: 'bg-pink-500', text: '<strong class="text-pink-400">[ALERT]</strong> Unusual payment volume detected from IP <strong class="text-pink-400">203.0.113.42</strong>', time: 'Mar 19, 2026 - 09:15 AM' },
  { initials: 'WH', color: 'bg-emerald-500', text: '<strong>Webhook</strong> endpoint updated: <strong class="text-indigo-400">https://yoursite.com/webhook</strong>', time: 'Mar 19, 2026 - 08:45 AM' },
  { initials: 'WD', color: 'bg-amber-500', text: 'Withdrawal of <strong>0.5 BTC</strong> to <strong class="text-red-400">bc1q...a7f3</strong> completed', time: 'Mar 19, 2026 - 08:00 AM' },
];

const yesterdayActivities = [
  { initials: 'PY', color: 'bg-purple-500', text: 'New <strong>payment</strong> received: <strong class="text-indigo-400">$2,450.00</strong> in ETH', time: 'Mar 18, 2026 - 11:30 PM' },
  { initials: 'ST', color: 'bg-blue-500', text: '2FA authentication <strong>enabled</strong> for your account', time: 'Mar 18, 2026 - 04:15 PM' },
];

export default function ActivityPage() {
  const [filter, setFilter] = useState('Recently');

  return (
    <div className="space-y-6">
      {/* Header - matching Activity page-titles */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-white">Activity Log</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">Activity</button>
          <button className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs font-medium border border-transparent hover:border-[rgba(99,102,241,0.15)] transition-colors">Notifications</button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none ml-2"
          >
            <option>Recently</option>
            <option>Today</option>
            <option>This Week</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline - matching Activity card */}
      <div className="glass-card">
        <h4 className="text-sm font-bold text-white mb-4">Today</h4>
        <div className="space-y-0">
          {todayActivities.map((activity, i) => (
            <div key={i} className="flex items-start gap-4 py-4 border-b border-[rgba(99,102,241,0.05)] last:border-0">
              <div className={`w-10 h-10 rounded-xl ${activity.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {activity.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: activity.text }} />
              </div>
              <span className="text-[10px] text-slate-600 whitespace-nowrap flex-shrink-0">{activity.time}</span>
            </div>
          ))}
        </div>

        <h4 className="text-sm font-bold text-white mt-6 mb-4">Yesterday</h4>
        <div className="space-y-0">
          {yesterdayActivities.map((activity, i) => (
            <div key={i} className="flex items-start gap-4 py-4 border-b border-[rgba(99,102,241,0.05)] last:border-0">
              <div className={`w-10 h-10 rounded-xl ${activity.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {activity.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: activity.text }} />
              </div>
              <span className="text-[10px] text-slate-600 whitespace-nowrap flex-shrink-0">{activity.time}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-400 transition-all">
            Load More
          </button>
        </div>
      </div>
    </div>
  );
}
