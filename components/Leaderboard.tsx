import React, { useMemo } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';

interface BranchStats {
  branchName: string;
  successRate: number;
  volume: number;
}

interface LeaderboardProps {
  branches: {user_id: string, branchName: string}[];
  // Ideally this would take real aggregated stats, but for this demo we might mock or need a new fetch
  // For simplicity, let's assume the parent passes calculated stats or we use a placeholder visual
  // Since fetching *all* data for *all* branches to calc stats is heavy, we'll design the UI 
  // and explain it works best with the Global Report Generator data.
  
  // Actually, let's allow it to accept data if available, or show a 'Generate Report to View' state
  data?: BranchStats[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ data = [] }) => {
  
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.successRate - a.successRate).slice(0, 5);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
         <Trophy size={48} className="mx-auto text-slate-200 mb-4" />
         <h3 className="font-bold text-slate-700">Leaderboard</h3>
         <p className="text-sm text-slate-400 mt-1">Generate a Global Report to see rankings.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
       <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h3 className="font-black text-xl flex items-center gap-2">
             <Crown size={24} className="text-yellow-300" /> Top Performing Branches
          </h3>
          <p className="text-indigo-100 text-sm opacity-80">Ranked by Success Rate</p>
       </div>
       <div className="divide-y divide-slate-100">
          {sortedData.map((branch, index) => (
             <div key={branch.branchName} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                   index === 0 ? 'bg-yellow-100 text-yellow-700' :
                   index === 1 ? 'bg-slate-100 text-slate-700' :
                   index === 2 ? 'bg-orange-100 text-orange-700' :
                   'text-slate-400'
                }`}>
                   {index + 1}
                </div>
                <div className="flex-1">
                   <div className="font-bold text-slate-800">{branch.branchName}</div>
                   <div className="text-xs text-slate-500">{branch.volume} parcels</div>
                </div>
                <div className={`font-black text-lg ${index === 0 ? 'text-indigo-600' : 'text-slate-600'}`}>
                   {branch.successRate}%
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};