import React, { forwardRef } from 'react';
import { DispatchItem } from '../types';
import { Truck, Calendar, BarChart3, TrendingUp, Award, Download } from 'lucide-react';

interface AggregatedBranch {
  branch: string;
  totalDispatch: number;
  totalTarget: number;
  percentage: number;
}

interface DailyPerformance {
  date: string;
  highPerformers: { branch: string; percentage: number }[];
}

interface DispatchReportTemplateProps {
  dateRangeLabel: string;
  generatedDate: string;
  regionName: string;
  metrics: {
    avgAchievement: number;
    totalDispatch: number;
    topBranch: string;
    achieversCount: number;
  };
  trendData: { date: string; total: number }[];
  branchRanking: AggregatedBranch[];
  dailyHighLog: DailyPerformance[];
  aiSummary?: string;
}

export const DispatchReportTemplate = forwardRef<HTMLDivElement, DispatchReportTemplateProps>((props, ref) => {
  const {
    dateRangeLabel,
    generatedDate,
    regionName,
    metrics,
    trendData,
    branchRanking,
    dailyHighLog,
    aiSummary
  } = props;

  const containerStyle = {
    width: '1000px', // Fixed width for A4-like ratio export
    minHeight: '1400px',
    backgroundColor: '#ffffff',
    padding: '40px',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#1e293b'
  };

  // Helper for charts
  const maxTrend = Math.max(...trendData.map(d => d.total), 100);
  const maxDispatch = Math.max(...branchRanking.map(b => b.totalDispatch), 100);

  // 7-Stage Color Logic (Hard Red -> Green)
  const getPerformanceStyle = (percentage: number) => {
    if (percentage >= 100) return { color: '#16a34a', bg: 'bg-green-600', label: 'text-green-700' };      // Green
    if (percentage >= 90) return { color: '#86efac', bg: 'bg-green-300', label: 'text-green-600' };       // Light Green
    if (percentage >= 80) return { color: '#fef08a', bg: 'bg-yellow-200', label: 'text-yellow-600' };     // Light Yellow
    if (percentage >= 70) return { color: '#facc15', bg: 'bg-yellow-400', label: 'text-yellow-700' };     // Yellow
    if (percentage >= 60) return { color: '#fca5a5', bg: 'bg-red-300', label: 'text-red-400' };           // Light Red
    if (percentage >= 40) return { color: '#ef4444', bg: 'bg-red-500', label: 'text-red-600' };           // Red
    return { color: '#991b1b', bg: 'bg-red-800', label: 'text-red-800' };                                 // Hard Red
  };

  return (
    <div ref={ref} style={containerStyle} className="relative">
      
      {/* 1. Header Section */}
      <div className="border-b-4 border-blue-900 pb-6 mb-8 flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
            {regionName} Region Branches
          </h3>
          <h1 className="text-4xl font-black text-blue-900 tracking-tight leading-none mb-2 pb-1">
            SYSTEM PERFORMANCE REPORT
          </h1>
          <div className="flex items-center gap-2 font-medium text-slate-600">
            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase text-slate-500">Report Period</span>
            <span>{dateRangeLabel}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated On</div>
          <div className="text-xl font-bold text-slate-800">{generatedDate}</div>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center flex flex-col justify-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Achievement</div>
          <div className="text-3xl font-black text-blue-600">{metrics.avgAchievement}%</div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center flex flex-col justify-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Dispatch</div>
          <div className="text-3xl font-black text-slate-800">{metrics.totalDispatch.toLocaleString()}</div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center flex flex-col justify-center overflow-hidden">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Top Branch</div>
          <div className="text-2xl font-black text-indigo-600 truncate w-full leading-normal pb-1 px-2" title={metrics.topBranch}>
            {metrics.topBranch}
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center flex flex-col justify-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">80%+ Achievers</div>
          <div className="text-3xl font-black text-emerald-500">{metrics.achieversCount}</div>
        </div>
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        
        {/* Trend Chart */}
        <div className="border border-slate-200 rounded-xl p-6">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-6">Trend Analysis</h4>
          <div className="h-64 flex items-end gap-2 relative">
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                {[...Array(5)].map((_, i) => <div key={i} className="border-t border-slate-400 w-full h-0"></div>)}
             </div>
             
             <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
               <polyline
                 fill="none"
                 stroke="#3b82f6"
                 strokeWidth="3"
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 points={trendData.map((d, i) => {
                   const count = trendData.length;
                   const x = count > 1 ? (i / (count - 1)) * 100 : 50;
                   const y = 100 - ((d.total / maxTrend) * 100);
                   return `${x},${y}`;
                 }).join(' ')}
               />
               {trendData.map((d, i) => {
                  const count = trendData.length;
                  const x = count > 1 ? (i / (count - 1)) * 100 : 50;
                  const y = 100 - ((d.total / maxTrend) * 100);
                  return (
                    <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#3b82f6" strokeWidth="2" />
                  );
               })}
             </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
             <span>{trendData[0]?.date}</span>
             <span>{trendData.length > 2 ? trendData[Math.floor(trendData.length / 2)]?.date : ''}</span>
             <span>{trendData.length > 1 ? trendData[trendData.length - 1]?.date : ''}</span>
          </div>
        </div>

        {/* Branch Ranking Chart (Horizontal Bar) */}
        <div className="border border-slate-200 rounded-xl p-6">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-6">Branch Ranking (Top 10)</h4>
          <div className="space-y-4">
             {branchRanking.slice(0, 8).map((b, i) => {
                const style = getPerformanceStyle(b.percentage);
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                     <div className="w-28 text-right font-bold text-slate-600 truncate leading-relaxed pb-0.5">{b.branch}</div>
                     <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${style.bg}`}
                          style={{ width: `${Math.min(100, (b.totalDispatch / maxDispatch) * 100)}%` }}
                        ></div>
                     </div>
                     <div className="w-12 text-right font-bold text-slate-700">{b.totalDispatch}</div>
                  </div>
                );
             })}
          </div>
        </div>
      </div>

      {/* 4. Day-to-Day High Performance Log */}
      <div className="mb-10">
         <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
            Day-to-Day High Performance Log (80%+)
         </h4>
         <div className="space-y-4">
            {dailyHighLog.slice(0, 5).map((log, i) => (
               <div key={i} className="flex items-start gap-4">
                  <div className="w-32 font-bold text-slate-800 text-sm py-1.5">{log.date}</div>
                  <div className="flex-1 flex flex-wrap gap-2">
                     {log.highPerformers.map((p, idx) => {
                        const style = getPerformanceStyle(p.percentage);
                        return (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded px-3 py-1 text-xs flex items-center gap-2">
                             <span className="font-medium text-slate-700">{p.branch}</span>
                             <span className={`font-bold ${style.label}`}>
                                {Math.round(p.percentage)}%
                             </span>
                          </div>
                        );
                     })}
                     {log.highPerformers.length === 0 && (
                        <span className="text-xs text-slate-400 italic py-1">No branches exceeded 80%</span>
                     )}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* 5. Overall Detailed Table */}
      <div className="mb-8">
         <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
            Overall Detailed Branch Performance
         </h4>
         <table className="w-full text-sm text-left border-collapse">
            <thead>
               <tr className="text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 pl-2">Rank</th>
                  <th className="py-3">Branch Name</th>
                  <th className="py-3 text-right">Total Dispatch</th>
                  <th className="py-3 text-right">Target</th>
                  <th className="py-3 text-center w-24">Meter</th>
                  <th className="py-3 text-right pr-2">Achiev %</th>
               </tr>
            </thead>
            <tbody>
               {branchRanking.map((b, i) => {
                  const style = getPerformanceStyle(b.percentage);
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                       <td className="py-3 pl-2 font-mono text-slate-400">#{i + 1}</td>
                       <td className="py-3 font-bold text-slate-700">{b.branch}</td>
                       <td className="py-3 text-right font-medium text-slate-600">{b.totalDispatch.toLocaleString()}</td>
                       <td className="py-3 text-right font-medium text-slate-400">{b.totalTarget.toLocaleString()}</td>
                       <td className="py-3 px-2">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                             <div 
                                className={`h-full rounded-full ${style.bg}`}
                                style={{ width: `${Math.min(b.percentage, 100)}%` }}
                             ></div>
                          </div>
                       </td>
                       <td className={`py-3 text-right font-black pr-2 ${style.label}`}>
                          {b.percentage.toFixed(0)}%
                       </td>
                    </tr>
                  );
               })}
            </tbody>
         </table>
      </div>

      {/* 6. Footer */}
      <div className="bg-blue-900 text-white rounded-xl p-6 mt-auto">
         <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">Automated Analysis Summary</h4>
         <p className="text-sm text-blue-50 leading-relaxed opacity-90">
            {aiSummary || `For the period ${dateRangeLabel}, the system processed a total of ${metrics.totalDispatch.toLocaleString()} dispatches. A significant ${metrics.achieversCount} branches maintained a cumulative achievement rate of 80% or higher, reflecting strong overall operational efficiency in key areas.`}
         </p>
      </div>

    </div>
  );
});

DispatchReportTemplate.displayName = 'DispatchReportTemplate';
