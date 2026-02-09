import React from 'react';
import { Truck, Target, TrendingUp, Award } from 'lucide-react';

interface BranchDispatchOverviewProps {
  rank?: number;
  branchName: string;
  stats: {
    dispatch: number;
    target: number;
    percentage: number;
  };
  onClick?: () => void;
}

export const BranchDispatchOverview: React.FC<BranchDispatchOverviewProps> = ({ rank, branchName, stats, onClick }) => {
  
  // Determine color theme based on percentage
  let theme = {
    bg: 'bg-slate-50',
    border: 'border-slate-100',
    iconBg: 'bg-slate-200',
    iconColor: 'text-slate-500',
    text: 'text-slate-700',
    progress: 'bg-slate-400'
  };

  if (stats.percentage >= 100) {
    theme = {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      text: 'text-emerald-800',
      progress: 'bg-emerald-500'
    };
  } else if (stats.percentage >= 80) {
    theme = {
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      text: 'text-indigo-800',
      progress: 'bg-indigo-500'
    };
  } else if (stats.percentage >= 60) {
    theme = {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      text: 'text-amber-800',
      progress: 'bg-amber-500'
    };
  } else {
    theme = {
      bg: 'bg-white', // Keep low performers clean/white to not look too alarming, just plain
      border: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-400',
      text: 'text-slate-700',
      progress: 'bg-rose-500'
    };
  }

  return (
    <div 
      onClick={onClick}
      className={`relative rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group ${theme.bg} ${theme.border}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${theme.iconBg} ${theme.iconColor}`}>
             {rank ? `#${rank}` : <Truck size={18} />}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-lg truncate leading-tight">{branchName}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
               <Target size={12} /> Target: {stats.target.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Percentage Badge */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${theme.iconBg} ${theme.text} ${theme.border}`}>
           <TrendingUp size={14} />
           {stats.percentage.toFixed(0)}%
        </div>
      </div>

      {/* Main Metric */}
      <div className="flex items-end justify-between mb-3">
         <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Dispatch</span>
            <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
               {stats.dispatch.toLocaleString()}
            </div>
         </div>
         {stats.percentage >= 100 && (
            <Award className="text-yellow-500 mb-1 drop-shadow-sm" size={24} />
         )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${theme.progress}`}
          style={{ width: `${Math.min(stats.percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};
