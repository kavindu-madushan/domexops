import React, { useState, useMemo, useRef } from 'react';
import { ReportRow } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  BrainCircuit, 
  Filter,
  ArrowRight,
  FileSpreadsheet,
  Image as ImageIcon,
  Printer,
  Loader2,
  Clock,
  Send,
  AlertCircle,
  Star
} from 'lucide-react';
import { analyzeReport } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { SummaryReportTemplate } from './SummaryReportTemplate';
import { SpecialReportTemplate } from './SpecialReportTemplate';

interface ReportsViewProps {
  rows: ReportRow[];
  branchName: string;
}

type DateRangeType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({ rows, branchName }) => {
  const [rangeType, setRangeType] = useState<DateRangeType>('weekly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Template refs for PNG generation
  const summaryTemplateRef = useRef<HTMLDivElement>(null);
  const specialReportRef = useRef<HTMLDivElement>(null);

  // Helper to parse "DD-MMM" format (e.g. "25-Jan") back to a Date object
  const parseRowDate = (dateStr: string): Date => {
    const now = new Date();
    const [day, monthStr] = dateStr.split('-');
    const monthMap: {[key: string]: number} = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    if (!monthStr || monthMap[monthStr] === undefined) return new Date(0); // Invalid
    return new Date(now.getFullYear(), monthMap[monthStr], parseInt(day));
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    const sortedAll = [...rows].sort((a, b) => parseRowDate(b.date).getTime() - parseRowDate(a.date).getTime());
    
    return sortedAll.filter(row => {
      const rowDate = parseRowDate(row.date);
      
      if (rangeType === 'daily') {
        return rowDate.toDateString() === now.toDateString();
      }
      if (rangeType === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return rowDate >= weekAgo;
      }
      if (rangeType === 'monthly') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return rowDate >= monthAgo;
      }
      if (rangeType === 'yearly') {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return rowDate >= yearAgo;
      }
      if (rangeType === 'custom' && customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return rowDate >= start && rowDate <= end;
      }
      return true;
    });
  }, [rows, rangeType, customStart, customEnd]);

  // Aggregated Metrics
  const metrics = useMemo(() => {
    const totalInward = filteredData.reduce((acc, r) => acc + r.todayInward, 0);
    const totalDispatch = filteredData.reduce((acc, r) => acc + r.yesterdayDispatch, 0);
    const totalReturns = filteredData.reduce((acc, r) => acc + r.todayRtnToSender, 0);
    const totalPending = filteredData.reduce((acc, r) => acc + (r.pendingChecking || 0), 0);
    const avgSuccess = filteredData.length > 0 
      ? Math.round(filteredData.reduce((acc, r) => acc + r.deliveryPercentage, 0) / filteredData.length)
      : 0;
    
    return { totalInward, totalDispatch, totalReturns, totalPending, avgSuccess };
  }, [filteredData]);

  // Derived Date Label
  const dateRangeLabel = useMemo(() => {
    if (rangeType === 'daily') return "Today";
    if (rangeType === 'weekly') return "Last 7 Days";
    if (rangeType === 'monthly') return "Last 30 Days";
    if (rangeType === 'yearly') return "Last Year";
    if (rangeType === 'custom') return `${customStart} to ${customEnd}`;
    return "All Time";
  }, [rangeType, customStart, customEnd]);

  const handleAiAnalyze = async () => {
    if (filteredData.length === 0) return;
    setLoadingAi(true);
    const result = await analyzeReport(filteredData);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  // --- Export Functions ---

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = [
      "Date", "Inward", "Dispatch", "Pending Checking", "Missed Route", "Returns", "Success Rate", "Temu Reschedule", "Eve. Missed", "Hold"
    ];
    
    const csvRows = filteredData.map(row => [
      row.date,
      row.todayInward,
      row.yesterdayDispatch,
      row.pendingChecking || 0,
      row.missedRoute || 0,
      row.todayRtnToSender,
      `${row.deliveryPercentage}%`,
      row.temuReschedule || 0,
      row.eveningMissedRoute || 0,
      row.todayBranchHold
    ].join(','));
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LogiPro_Report_${rangeType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportPNG = async () => {
    if (!summaryTemplateRef.current) return;
    setExporting(true);
    
    setTimeout(async () => {
      try {
        if (summaryTemplateRef.current) {
          const canvas = await html2canvas(summaryTemplateRef.current, {
            scale: 2, 
            useCORS: true,
            backgroundColor: '#f8fafc',
            logging: false
          });
          
          const link = document.createElement('a');
          link.download = `LogiPro_Summary_${rangeType}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      } catch (err) {
        console.error("PNG export failed", err);
        alert("Failed to create image.");
      } finally {
        setExporting(false);
      }
    }, 100);
  };

  const handleExportSpecial = async () => {
    if (!specialReportRef.current) return;
    setExporting(true);
    
    setTimeout(async () => {
      try {
        if (specialReportRef.current) {
          const canvas = await html2canvas(specialReportRef.current, {
            scale: 2, 
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
          });
          
          const link = document.createElement('a');
          link.download = `LogiPro_SpecialReport_${rangeType}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      } catch (err) {
        console.error("Special export failed", err);
        alert("Failed to create report.");
      } finally {
        setExporting(false);
      }
    }, 100);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // --- SVG Chart Helpers ---
  const ChartContainer = ({ title, children }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-80 print:break-inside-avoid print:shadow-none print:border-slate-300">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">{title}</h3>
      <div className="flex-1 w-full h-full relative">
        {children}
      </div>
    </div>
  );

  // Simple Line Chart for Success Rate
  const TrendChart = () => {
    if (filteredData.length < 2) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Not enough data for trend</div>;
    
    const data = [...filteredData].reverse();
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - d.deliveryPercentage; 
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
        <polygon fill="url(#gradient)" points={`0,100 ${points} 100,100`} opacity="0.2" />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Bar Chart for Inward vs Dispatch
  const VolumeChart = () => {
     if (filteredData.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>;

     const data = [...filteredData].reverse();
     const maxVal = Math.max(...data.map(d => Math.max(d.todayInward, d.yesterdayDispatch)), 10);
     const barWidth = (100 / data.length) * 0.3; 

     return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
         {data.map((d, i) => {
           const slotWidth = 100 / data.length;
           const xCenter = (i * slotWidth) + (slotWidth / 2);
           const hInward = (d.todayInward / maxVal) * 100;
           const hDispatch = (d.yesterdayDispatch / maxVal) * 100;
           return (
             <g key={d.id}>
               <rect x={xCenter - barWidth} y={100 - hInward} width={barWidth} height={hInward} fill="#94a3b8" rx="1" />
               <rect x={xCenter} y={100 - hDispatch} width={barWidth} height={hDispatch} fill="#8b5cf6" rx="1" />
             </g>
           );
         })}
      </svg>
     )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Hidden Templates for Image Generation */}
      <div style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0 }}>
        <SummaryReportTemplate 
          ref={summaryTemplateRef} 
          metrics={metrics} 
          dateRangeLabel={dateRangeLabel} 
          branchName={branchName} 
        />
        <SpecialReportTemplate 
          ref={specialReportRef}
          rows={filteredData}
          branchName={branchName}
          dateRangeLabel={dateRangeLabel}
        />
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Advanced Analytics
          </h2>
          <p className="text-slate-500 text-sm">Performance reports for <span className="font-semibold text-slate-700">{branchName}</span></p>
        </div>

        <div className="flex flex-wrap gap-2">
           {(['daily', 'weekly', 'monthly', 'yearly'] as DateRangeType[]).map((type) => (
             <button
               key={type}
               onClick={() => setRangeType(type)}
               className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                 rangeType === type 
                   ? 'bg-slate-900 text-white shadow-md' 
                   : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
               }`}
             >
               {type}
             </button>
           ))}
           <button
             onClick={() => setRangeType('custom')}
             className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
               rangeType === 'custom' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
             }`}
           >
             <Filter size={14} /> Custom
           </button>
        </div>
      </div>

      {/* Custom Range Inputs */}
      {rangeType === 'custom' && (
        <div className="bg-slate-100 p-4 rounded-xl flex flex-wrap items-center gap-4 border border-slate-200 print:hidden">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase mr-2">From</span>
            <input 
              type="date" 
              value={customStart} 
              onChange={e => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-sm"
            />
          </div>
          <ArrowRight size={16} className="text-slate-400" />
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase mr-2">To</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={e => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-sm"
            />
          </div>
        </div>
      )}

      {/* Export Toolbar */}
      <div className="flex flex-wrap gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 print:hidden">
         <span className="text-xs font-bold text-slate-500 uppercase self-center mr-auto px-2">Export Report:</span>
         
         <button 
           onClick={handleExportSpecial}
           disabled={exporting}
           className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg shadow-md hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
         >
           {exporting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
           Special Report
         </button>

         <button 
           onClick={handleExportPNG}
           disabled={exporting}
           className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all active:scale-95 disabled:opacity-50"
         >
           <ImageIcon size={16} />
           Summary PNG
         </button>
         
         <button 
           onClick={handleExportCSV}
           className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all active:scale-95"
         >
           <FileSpreadsheet size={16} />
           Download Excel
         </button>
         
         <button 
           onClick={handlePrintPDF}
           className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-100 transition-all active:scale-95"
         >
           <Printer size={16} />
           Print / PDF
         </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5">
        
        {/* Inward */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden print:border-slate-300">
           <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500 rounded-bl-full opacity-5 print:hidden"></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Inward</p>
           <h3 className="text-3xl font-black text-slate-800">{metrics.totalInward}</h3>
           <div className="mt-2 text-xs text-blue-600 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded print:bg-transparent print:text-slate-600">Volume</div>
        </div>
        
        {/* Dispatch */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden print:border-slate-300">
           <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500 rounded-bl-full opacity-5 print:hidden"></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Dispatch</p>
           <h3 className="text-3xl font-black text-slate-800">{metrics.totalDispatch}</h3>
           <div className="mt-2 text-xs text-purple-600 font-medium bg-purple-50 inline-block px-2 py-0.5 rounded print:bg-transparent print:text-slate-600">Outbound</div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden print:border-slate-300">
           <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500 rounded-bl-full opacity-5 print:hidden"></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Success Rate</p>
           <h3 className="text-3xl font-black text-slate-800">{metrics.avgSuccess}%</h3>
           <div className="mt-2 text-xs text-emerald-600 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded print:bg-transparent print:text-slate-600">Performance</div>
        </div>

        {/* Pending Checking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden print:border-slate-300">
           <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500 rounded-bl-full opacity-5 print:hidden"></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Checking</p>
           <h3 className="text-3xl font-black text-slate-800">{metrics.totalPending}</h3>
           <div className="mt-2 text-xs text-orange-600 font-medium bg-orange-50 inline-block px-2 py-0.5 rounded print:bg-transparent print:text-slate-600">Backlog</div>
        </div>

        {/* Returns */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden print:border-slate-300">
           <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500 rounded-bl-full opacity-5 print:hidden"></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Returns</p>
           <h3 className="text-3xl font-black text-slate-800">{metrics.totalReturns}</h3>
           <div className="mt-2 text-xs text-rose-600 font-medium bg-rose-50 inline-block px-2 py-0.5 rounded print:bg-transparent print:text-slate-600">Issues</div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
        <ChartContainer title="Success Rate Trend">
           <TrendChart />
        </ChartContainer>
        <ChartContainer title="Inward vs Dispatch Volume">
           <div className="absolute top-0 right-0 flex gap-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Inward</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Dispatch</div>
           </div>
           <VolumeChart />
        </ChartContainer>
      </div>

      {/* Pro Feature: AI Analysis */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden print:bg-white print:text-slate-900 print:border print:border-slate-300 print:shadow-none">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full mix-blend-overlay filter blur-3xl animate-blob print:hidden"></div>
         
         <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                 <BrainCircuit className="text-indigo-300 print:text-indigo-600" /> AI Performance Analyst
              </h3>
              <p className="text-indigo-200/60 text-sm mt-1 print:text-slate-500">Insights based on {rangeType} data.</p>
            </div>
            <button 
              onClick={handleAiAnalyze}
              disabled={loadingAi}
              className="px-5 py-2.5 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 print:hidden"
            >
              {loadingAi ? 'Analyzing...' : 'Generate Insights'}
            </button>
         </div>

         {aiAnalysis && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 text-indigo-50 leading-relaxed text-sm shadow-inner max-h-64 overflow-y-auto custom-scrollbar print:bg-transparent print:text-slate-800 print:shadow-none print:border-none print:max-h-none">
               <div className="prose prose-invert prose-sm max-w-none print:prose-slate">
                 <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
               </div>
            </div>
         )}
      </div>
    </div>
  );
};