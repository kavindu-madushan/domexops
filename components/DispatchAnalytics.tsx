import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchDispatchHistory, fetchDispatchTargets } from '../services/db';
import { DispatchReport, DispatchItem } from '../types';
import { DispatchProcessor } from './DispatchProcessor';
import { DispatchReportTemplate } from './DispatchReportTemplate';
import { BranchDispatchOverview } from './BranchDispatchOverview'; // Import new component
import html2canvas from 'html2canvas';
import { 
  LayoutDashboard, 
  FileText, 
  PenTool, 
  Calendar, 
  Download, 
  Filter, 
  Loader2,
  TrendingUp,
  Award,
  Truck,
  Maximize2,
  MoveHorizontal
} from 'lucide-react';
import { toast } from '../services/toast';

interface DispatchAnalyticsProps {
  rmName?: string;
  userRole?: string;
}

type Tab = 'dashboard' | 'report' | 'entry';
type DateRange = '7days' | '30days' | 'month' | 'custom';

export const DispatchAnalytics: React.FC<DispatchAnalyticsProps> = ({ rmName, userRole }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [history, setHistory] = useState<DispatchReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDispatchHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load dispatch history");
    } finally {
      setLoading(false);
    }
  };

  // --- Data Processing Logic ---

  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(); // Today

    if (dateRange === '7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === '30days') {
      startDate.setDate(now.getDate() - 30);
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'custom') {
       return history; // Return all if range invalid? Or empty. Let's return all for safe fallback.
    }

    return history.filter(h => {
      const d = new Date(h.date);
      return d >= startDate && d <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
  }, [history, dateRange, customStart, customEnd]);

  const aggregatedData = useMemo(() => {
    const branchMap = new Map<string, { totalDispatch: number; totalTarget: number }>();
    
    // Aggregate totals
    filteredHistory.forEach(day => {
      day.items.forEach(item => {
        const current = branchMap.get(item.branch) || { totalDispatch: 0, totalTarget: 0 };
        current.totalDispatch += item.dispatch;
        current.totalTarget += item.target;
        branchMap.set(item.branch, current);
      });
    });

    const ranking = Array.from(branchMap.entries()).map(([branch, stats]) => ({
      branch,
      totalDispatch: stats.totalDispatch,
      totalTarget: stats.totalTarget,
      percentage: stats.totalTarget > 0 ? (stats.totalDispatch / stats.totalTarget) * 100 : 0
    })).sort((a, b) => b.percentage - a.percentage);

    const totalDispatch = ranking.reduce((acc, b) => acc + b.totalDispatch, 0);
    const avgAchievement = ranking.length > 0 
      ? Math.round(ranking.reduce((acc, b) => acc + b.percentage, 0) / ranking.length) 
      : 0;
    const topBranch = ranking.length > 0 ? ranking[0].branch : 'N/A';
    const achieversCount = ranking.filter(b => b.percentage >= 80).length;

    // Trend Data (Total Dispatch per Day)
    // Sort chronological for chart
    const chronologicalHistory = [...filteredHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const trendData = chronologicalHistory.map(day => ({
      date: day.date,
      total: day.items.reduce((sum, item) => sum + item.dispatch, 0)
    }));

    // Daily High Performance Log
    const dailyHighLog = filteredHistory.map(day => {
      const highPerformers = day.items
        .filter(item => item.percentage >= 80)
        .map(item => ({ branch: item.branch, percentage: item.percentage }))
        .sort((a, b) => b.percentage - a.percentage);
      return { date: day.date, highPerformers };
    });

    return { ranking, totalDispatch, avgAchievement, topBranch, achieversCount, trendData, dailyHighLog };
  }, [filteredHistory]);

  // --- Export ---

  const handleDownloadPNG = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    // Tiny delay to ensure render
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(reportRef.current!, { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = `Dispatch_Report_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success("Report downloaded");
      } catch (e) {
        console.error(e);
        toast.error("Export failed");
      } finally {
        setExporting(false);
      }
    }, 100);
  };

  const handleExportCSV = () => {
    const headers = ["Rank", "Branch Name", "Total Dispatch", "Total Target", "Achievement %"];
    const rows = aggregatedData.ranking.map((b, i) => [
      i + 1,
      b.branch,
      b.totalDispatch,
      b.totalTarget,
      `${b.percentage.toFixed(1)}%`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Dispatch_Analytics_${dateRange}.csv`;
    link.click();
  };

  // --- Render ---

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      
      {/* Hidden Report Template for Export - High Res */}
      <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
        <DispatchReportTemplate 
          ref={reportRef}
          dateRangeLabel={dateRange === 'custom' ? `${customStart} to ${customEnd}` : dateRange === '7days' ? 'Last 7 Days' : dateRange === '30days' ? 'Last 30 Days' : 'This Month'}
          generatedDate={new Date().toLocaleDateString()}
          regionName={rmName ? `${rmName}'s` : "Regional"}
          metrics={{
            avgAchievement: aggregatedData.avgAchievement,
            totalDispatch: aggregatedData.totalDispatch,
            topBranch: aggregatedData.topBranch,
            achieversCount: aggregatedData.achieversCount
          }}
          trendData={aggregatedData.trendData}
          branchRanking={aggregatedData.ranking}
          dailyHighLog={aggregatedData.dailyHighLog}
        />
      </div>

      {/* Header & Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 flex-none z-10">
        <div className="w-full md:w-auto text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
            <Truck className="text-blue-600" /> Auto-Dispatch Analysis
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">System performance tracking and reporting.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutDashboard size={16} /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'report' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={16} /> <span className="hidden sm:inline">Report</span> Preview
          </button>
          <button 
            onClick={() => setActiveTab('entry')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'entry' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PenTool size={16} /> Data Entry
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        
        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
               <div className="relative w-full sm:w-auto">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="w-full sm:w-auto pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 appearance-none cursor-pointer"
                  >
                     <option value="7days">Last 7 Days</option>
                     <option value="30days">Last 30 Days</option>
                     <option value="month">Current Month</option>
                     <option value="custom">Custom Range</option>
                  </select>
               </div>
               
               {dateRange === 'custom' && (
                  <div className="flex flex-wrap gap-2 items-center text-sm w-full sm:w-auto">
                     <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-slate-50 border-slate-200 rounded px-2 py-1 flex-1" />
                     <span className="text-slate-400">to</span>
                     <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-slate-50 border-slate-200 rounded px-2 py-1 flex-1" />
                  </div>
               )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Avg Achievement</p>
                  <h3 className="text-4xl font-black">{aggregatedData.avgAchievement}%</h3>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Dispatch</p>
                  <h3 className="text-3xl font-black text-slate-800">{aggregatedData.totalDispatch.toLocaleString()}</h3>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Top Branch</p>
                  <h3 className="text-2xl font-black text-indigo-600 truncate" title={aggregatedData.topBranch}>{aggregatedData.topBranch}</h3>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">80%+ Achievers</p>
                  <h3 className="text-3xl font-black text-emerald-500">{aggregatedData.achieversCount}</h3>
               </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-6">Dispatch Trend</h3>
                  <div className="h-64 w-full flex items-end justify-between gap-1 relative pt-4">
                     {aggregatedData.trendData.length > 0 ? aggregatedData.trendData.map((d, i) => {
                        const maxVal = Math.max(...aggregatedData.trendData.map(t => t.total), 1);
                        const height = (d.total / maxVal) * 100;
                        return (
                           <div key={i} className="flex-1 flex flex-col justify-end group relative">
                              <div 
                                className="bg-blue-100 group-hover:bg-blue-500 transition-colors rounded-t-sm w-full min-w-[4px]"
                                style={{ height: `${height}%` }}
                              ></div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                 {d.date}: {d.total}
                              </div>
                           </div>
                        )
                     }) : <div className="w-full text-center text-slate-400 self-center">No trend data available</div>}
                  </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-6">Top 5 Performers</h3>
                  <div className="space-y-4">
                     {aggregatedData.ranking.slice(0, 5).map((b, i) => (
                        <div key={i} className="flex items-center gap-3">
                           <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i===0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                              {i+1}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-xs mb-1">
                                 <span className="font-bold text-slate-700 truncate">{b.branch}</span>
                                 <span className="font-bold text-slate-900">{b.percentage.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                 <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(b.percentage, 100)}%` }}></div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Detailed List using New Card Component */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-700">Branch Performance</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {aggregatedData.ranking.map((b, i) => (
                     <BranchDispatchOverview 
                        key={i}
                        rank={i + 1}
                        branchName={b.branch}
                        stats={{
                           dispatch: b.totalDispatch,
                           target: b.totalTarget,
                           percentage: b.percentage
                        }}
                     />
                  ))}
               </div>
            </div>

          </div>
        )}

        {/* REPORT PREVIEW TAB */}
        {activeTab === 'report' && (
           <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Toolbar */}
              <div className="w-full max-w-5xl flex flex-col gap-4 mb-6 sticky top-0 z-20">
                 {/* Main Controls Card */}
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                       <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 p-1 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase pl-2">Period:</span>
                          <select 
                             value={dateRange}
                             onChange={(e) => setDateRange(e.target.value as DateRange)}
                             className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer flex-1 sm:flex-none py-1 pl-1 pr-8"
                          >
                             <option value="7days">Last 7 Days</option>
                             <option value="30days">Last 30 Days</option>
                             <option value="month">Current Month</option>
                             <option value="custom">Custom Range</option>
                          </select>
                       </div>
                       
                       {dateRange === 'custom' && (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 w-full sm:w-auto">
                             <input 
                                type="date" 
                                value={customStart} 
                                onChange={(e) => setCustomStart(e.target.value)} 
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                             />
                             <span className="text-slate-400 text-xs font-bold">to</span>
                             <input 
                                type="date" 
                                value={customEnd} 
                                onChange={(e) => setCustomEnd(e.target.value)} 
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                             />
                          </div>
                       )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                       <button 
                          onClick={handleExportCSV}
                          className="flex-1 md:flex-none px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors text-xs flex items-center justify-center gap-2"
                       >
                          Export CSV
                       </button>
                       <button 
                          onClick={handleDownloadPNG}
                          disabled={exporting}
                          className="flex-1 md:flex-none px-6 py-2.5 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
                       >
                          {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                          Save Report
                       </button>
                    </div>
                 </div>
                 
                 {/* Mobile Hint */}
                 <div className="md:hidden flex justify-center">
                    <div className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                       <MoveHorizontal size={12} /> Swipe to view full report
                    </div>
                 </div>
              </div>

              {/* Scrollable Preview Container for Mobile */}
              <div className="w-full max-w-5xl overflow-x-auto custom-scrollbar md:overflow-visible flex justify-start md:justify-center pb-8 px-4 md:px-0">
                 {/* 
                    Wrapper: 
                    On mobile: min-width equal to scaled report to allow scrolling (e.g. 500px).
                    On desktop: auto width.
                 */}
                 <div className="min-w-[500px] md:min-w-0 origin-top-left md:origin-top transform scale-[0.5] sm:scale-[0.6] md:scale-[0.75] lg:scale-[0.85] xl:scale-100 transition-transform duration-300">
                    <div className="shadow-2xl rounded-sm overflow-hidden bg-white">
                       <DispatchReportTemplate 
                          dateRangeLabel={dateRange === 'custom' ? `${customStart} to ${customEnd}` : dateRange === '7days' ? 'Last 7 Days' : dateRange === '30days' ? 'Last 30 Days' : 'This Month'}
                          generatedDate={new Date().toLocaleDateString()}
                          regionName={rmName ? `${rmName}'s` : "Regional"}
                          metrics={{
                             avgAchievement: aggregatedData.avgAchievement,
                             totalDispatch: aggregatedData.totalDispatch,
                             topBranch: aggregatedData.topBranch,
                             achieversCount: aggregatedData.achieversCount
                          }}
                          trendData={aggregatedData.trendData}
                          branchRanking={aggregatedData.ranking}
                          dailyHighLog={aggregatedData.dailyHighLog}
                       />
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* DATA ENTRY TAB */}
        {activeTab === 'entry' && (
           <div className="max-w-5xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
              <DispatchProcessor rmName={rmName} />
           </div>
        )}

      </div>
    </div>
  );
};