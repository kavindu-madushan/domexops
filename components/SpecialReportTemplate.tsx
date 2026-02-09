import React, { forwardRef, useMemo } from 'react';
import { ReportRow } from '../types';
import { 
  Calendar, 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface SpecialReportTemplateProps {
  rows: ReportRow[];
  branchName: string;
  dateRangeLabel: string;
}

export const SpecialReportTemplate = forwardRef<HTMLDivElement, SpecialReportTemplateProps>(({ rows, branchName, dateRangeLabel }, ref) => {
  
  // Sort rows chronologically for the list and charts
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
       const dateA = new Date(a.date.replace('-', ' ')); // Handle 'DD-Mon' format roughly
       const dateB = new Date(b.date.replace('-', ' '));
       // Fallback for simple string comparison if date parsing fails on DD-Mon without year
       return dateA.getTime() - dateB.getTime();
    });
  }, [rows]);

  const metrics = useMemo(() => {
    const totalInward = rows.reduce((acc, r) => acc + r.todayInward, 0);
    const avgSuccess = rows.length > 0 ? Math.round(rows.reduce((acc, r) => acc + r.deliveryPercentage, 0) / rows.length) : 0;
    const totalPending = rows.reduce((acc, r) => acc + (r.pendingChecking || 0), 0);
    return { totalInward, avgSuccess, totalPending };
  }, [rows]);

  // Styles
  const containerStyle = {
    width: '794px', // Standard A4 Width at 96 DPI
    minHeight: '1123px', // Standard A4 Height
    backgroundColor: '#ffffff',
    padding: '40px',
    fontFamily: '"Courier New", Courier, monospace', // Mono font for that "receipt/log" feel
    color: '#000000',
    position: 'relative' as const,
  };

  const cardStyle = "border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white";
  const pillStyle = "border border-black rounded-full px-3 py-1 text-xs font-bold uppercase flex items-center gap-1";

  // --- Chart Helpers ---
  
  const TrendChart = () => {
    if (sortedRows.length < 2) return <div className="h-full flex items-center justify-center text-xs text-gray-400">Needs more data</div>;
    const points = sortedRows.map((d, i) => {
      const x = (i / (sortedRows.length - 1)) * 100;
      const y = 100 - d.deliveryPercentage; // Invert for SVG coords (0 is top)
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <polyline fill="none" stroke="black" strokeWidth="3" points={points} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        {sortedRows.map((d, i) => {
           const x = (i / (sortedRows.length - 1)) * 100;
           const y = 100 - d.deliveryPercentage;
           return <circle key={i} cx={x} cy={y} r="2" fill="white" stroke="black" strokeWidth="1" />;
        })}
      </svg>
    );
  };

  const BarChart = () => {
     if (sortedRows.length === 0) return null;
     const maxVal = Math.max(...sortedRows.map(r => Math.max(r.todayInward, r.pendingChecking || 0)), 10);
     
     return (
       <div className="flex items-end justify-between h-full gap-1">
          {sortedRows.slice(0, 10).map((r, i) => ( // Limit bars to fit nicely
             <div key={i} className="flex flex-col items-center flex-1 gap-1">
                <div className="flex items-end gap-0.5 h-full w-full justify-center">
                   <div style={{height: `${(r.todayInward / maxVal) * 100}%`}} className="w-2 bg-black rounded-t-sm"></div>
                   <div style={{height: `${((r.pendingChecking || 0) / maxVal) * 100}%`}} className="w-2 bg-white border border-black border-b-0 rounded-t-sm bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSIjMDAwIi8+Cjwvc3ZnPg==')]"></div>
                </div>
                <div className="text-[8px] font-bold rotate-0 truncate w-full text-center">{r.date.split('-')[0]}</div>
             </div>
          ))}
       </div>
     );
  }

  return (
    <div ref={ref} style={containerStyle}>
       
       {/* Background Dot Pattern (CSS) */}
       <div className="absolute inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

       <div className="relative z-10 flex flex-col h-full">
          
          {/* Header */}
          <div className="flex justify-between items-end border-b-4 border-black pb-6 mb-8">
             <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
                      <span className="font-bold text-xl">DX</span>
                   </div>
                   <h1 className="text-4xl font-black uppercase tracking-tighter">Special Report</h1>
                </div>
                <div className="flex gap-2">
                   <div className={pillStyle}><Calendar size={12}/> {dateRangeLabel}</div>
                   <div className={pillStyle}><Package size={12}/> {branchName}</div>
                </div>
             </div>
             <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-widest mb-1">Generated</div>
                <div className="text-xl font-bold">{new Date().toLocaleDateString()}</div>
             </div>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-3 gap-6 mb-8">
             <div className={cardStyle}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold uppercase">Total Inward</span>
                   <Package size={16} />
                </div>
                <div className="text-4xl font-black">{metrics.totalInward}</div>
             </div>
             <div className={`${cardStyle} bg-black text-white`}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold uppercase text-gray-300">Avg Success</span>
                   <TrendingUp size={16} />
                </div>
                <div className="text-4xl font-black">{metrics.avgSuccess}%</div>
             </div>
             <div className={cardStyle}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold uppercase">Pending Check</span>
                   <Clock size={16} />
                </div>
                <div className="text-4xl font-black">{metrics.totalPending}</div>
             </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-2 gap-6 mb-8">
             <div className={cardStyle}>
                <div className="mb-4 border-b-2 border-dashed border-black pb-2 flex justify-between items-center">
                   <h3 className="font-bold text-sm uppercase">Success Trend</h3>
                   <TrendingUp size={14} />
                </div>
                <div className="h-32 px-2">
                   <TrendChart />
                </div>
             </div>
             <div className={cardStyle}>
                <div className="mb-4 border-b-2 border-dashed border-black pb-2 flex justify-between items-center">
                   <h3 className="font-bold text-sm uppercase">Inward vs Pending</h3>
                   <div className="flex gap-2 text-[10px]">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 bg-black"></div> In</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 border border-black bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSIjMDAwIi8+Cjwvc3ZnPg==')]"></div> Pnd</span>
                   </div>
                </div>
                <div className="h-32 px-2">
                   <BarChart />
                </div>
             </div>
          </div>

          {/* Daily Log List */}
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-4">
                <div className="h-1 flex-1 bg-black rounded-full"></div>
                <h3 className="font-black text-lg uppercase bg-white px-2">Daily Operations Log</h3>
                <div className="h-1 flex-1 bg-black rounded-full"></div>
             </div>

             <div className="space-y-3">
                {sortedRows.map((row, idx) => (
                   <div key={idx} className="flex items-center justify-between border-2 border-black rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 border-2 border-black rounded-lg flex flex-col items-center justify-center bg-gray-50">
                            <span className="text-[10px] font-bold uppercase leading-none">{row.date.split('-')[1]}</span>
                            <span className="text-xl font-black leading-none">{row.date.split('-')[0]}</span>
                         </div>
                         <div>
                            <div className="font-bold text-sm flex items-center gap-2">
                               Inward: {row.todayInward}
                               <span className="text-[10px] font-normal text-gray-500">|</span>
                               Pending: {row.pendingChecking || 0}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                               RTS: {row.todayRtnToSender} • Hold: {row.todayBranchHold}
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         {row.deliveryPercentage >= 90 && <CheckCircle2 size={16} className="text-black" />}
                         <div className="text-right">
                            <div className="text-[10px] font-bold uppercase">Success</div>
                            <div className={`text-xl font-black ${row.deliveryPercentage < 60 ? 'line-through decoration-2' : ''}`}>
                               {row.deliveryPercentage}%
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t-2 border-dashed border-black text-center">
             <p className="text-xs font-bold uppercase tracking-widest">Domex Operations System • {branchName}</p>
          </div>

       </div>
    </div>
  );
});

SpecialReportTemplate.displayName = 'SpecialReportTemplate';