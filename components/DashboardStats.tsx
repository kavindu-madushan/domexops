import React, { useMemo } from 'react';
import { ReportRow } from '../types';
import { 
  TrendingUp, 
  Package, 
  AlertCircle, 
  Clock, 
  Flame, 
  AlertTriangle,
  Truck
} from 'lucide-react';

interface DashboardStatsProps {
  rows: ReportRow[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ rows }) => {
  const stats = useMemo(() => {
    if (rows.length === 0) return null;

    const totalInward = rows.reduce((acc, row) => acc + row.todayInward, 0);
    const avgSuccess = Math.round(rows.reduce((acc, row) => acc + row.deliveryPercentage, 0) / rows.length);
    
    // New Metrics Sums
    const totalMissed = rows.reduce((acc, row) => acc + (row.missedRoute || 0) + (row.eveningMissedRoute || 0), 0);
    const totalPending = rows.reduce((acc, row) => acc + (row.pendingChecking || 0), 0);
    
    const latest = rows[0]; // Assumes sorted by date desc in parent or we sort here
    
    // Streak
    let currentStreak = 0;
    // Sort logic just in case
    const sorted = [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const row of sorted) {
      if (row.deliveryPercentage >= 90) currentStreak++;
      else break;
    }

    let grade = 'F';
    let gradeColor = 'text-rose-600 bg-rose-50';
    if (avgSuccess >= 95) { grade = 'S'; gradeColor = 'text-purple-600 bg-purple-50'; }
    else if (avgSuccess >= 90) { grade = 'A'; gradeColor = 'text-emerald-600 bg-emerald-50'; }
    else if (avgSuccess >= 80) { grade = 'B'; gradeColor = 'text-blue-600 bg-blue-50'; }
    else if (avgSuccess >= 60) { grade = 'C'; gradeColor = 'text-amber-600 bg-amber-50'; }

    return { 
      totalInward,
      avgSuccess, 
      totalMissed,
      totalPending,
      currentStreak, 
      grade, 
      gradeColor,
      latest
    };
  }, [rows]);

  if (!stats) return null;

  return (
    <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
           <div className="relative z-10 flex items-center justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-2 text-indigo-200">
                  <span className="text-xs font-bold uppercase tracking-widest">Performance Grade</span>
                </div>
                <h2 className="text-6xl font-black text-white">{stats.grade}</h2>
                <div className="text-sm opacity-80 mt-2">Avg Success: {stats.avgSuccess}%</div>
              </div>
              
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                 <Flame size={24} className={`${stats.currentStreak > 2 ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`} />
                 <span className="text-3xl font-black mt-1">{stats.currentStreak}</span>
                 <span className="text-[10px] uppercase font-bold text-indigo-200">Day Streak</span>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Latest Inward</span>
           <div className="text-4xl font-black text-slate-800">{stats.latest ? stats.latest.todayInward : 0}</div>
           <div className="text-xs text-blue-600 font-bold mt-1 bg-blue-50 inline-block px-2 py-1 rounded w-fit">
              Last update: {stats.latest ? stats.latest.date : '-'}
           </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock size={18} /></div>
           </div>
           <div className="text-2xl font-black text-slate-800">{stats.totalPending}</div>
           <div className="text-xs text-slate-400 font-bold uppercase">Pending Checking</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle size={18} /></div>
           </div>
           <div className="text-2xl font-black text-slate-800">{stats.totalMissed}</div>
           <div className="text-xs text-slate-400 font-bold uppercase">Total Missed Routes</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Truck size={18} /></div>
           </div>
           <div className="text-2xl font-black text-slate-800">{stats.latest ? stats.latest.yesterdayDispatch : 0}</div>
           <div className="text-xs text-slate-400 font-bold uppercase">Latest Dispatch</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><AlertCircle size={18} /></div>
           </div>
           <div className="text-2xl font-black text-slate-800">{stats.latest ? stats.latest.todayBranchHold : 0}</div>
           <div className="text-xs text-slate-400 font-bold uppercase">Current Hold</div>
        </div>
      </div>
    </div>
  );
};