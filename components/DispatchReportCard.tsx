import React, { forwardRef } from 'react';
import { DispatchItem } from '../types';
import { Truck } from 'lucide-react';

interface DispatchReportCardProps {
  date: string;
  items: DispatchItem[];
  regionName?: string;
  rmName?: string;
}

export const DispatchReportCard = forwardRef<HTMLDivElement, DispatchReportCardProps>(({ date, items, regionName = "Regional", rmName }, ref) => {
  
  const containerStyle = {
    width: '800px',
    backgroundColor: '#ffffff',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    paddingBottom: '20px'
  };

  return (
    <div ref={ref} style={containerStyle} className="shadow-xl">
       {/* Header */}
       <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white flex justify-between items-end">
          <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-yellow-400 p-2 rounded-lg text-indigo-900">
                   <Truck size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">
                   Dispatch Report
                </h2>
             </div>
             <p className="text-blue-200 font-medium text-sm tracking-wide">
                {regionName} Operations {rmName ? `• ${rmName}` : ''}
             </p>
          </div>
          
          <div className="text-right">
             <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Report Date</div>
             <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-xl border border-white/20 shadow-lg">
                <span className="text-2xl font-bold font-mono">{date}</span>
             </div>
          </div>
       </div>

       {/* Table */}
       <div className="p-8 pt-6">
          <table className="w-full text-sm border-separate border-spacing-0">
             <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                   <th className="p-3 text-left border-b-2 border-slate-200 pl-4 rounded-tl-lg">Branch</th>
                   <th className="p-3 text-center border-b-2 border-slate-200">Target</th>
                   <th className="p-3 text-center border-b-2 border-slate-200">Actual</th>
                   <th className="p-3 text-center border-b-2 border-slate-200">%</th>
                   <th className="p-3 text-center border-b-2 border-slate-200 pr-4 rounded-tr-lg">Status</th>
                </tr>
             </thead>
             <tbody>
                {items.map((item, idx) => {
                   let rowClass = 'text-slate-700 hover:bg-slate-50 transition-colors';
                   let statusBadge = '';
                   
                   // Striped rows via JS logic or CSS
                   const isEven = idx % 2 === 0;
                   if (!isEven) rowClass += ' bg-slate-50/30';

                   if (item.percentage >= 100) {
                      statusBadge = 'bg-emerald-100 text-emerald-700';
                   } else if (item.percentage >= 70) {
                      statusBadge = 'bg-amber-100 text-amber-700';
                   } else {
                      statusBadge = 'bg-rose-100 text-rose-700';
                   }

                   return (
                      <tr key={idx} className={rowClass}>
                         <td className="p-3 pl-4 border-b border-slate-100 font-bold">{item.branch}</td>
                         <td className="p-3 text-center border-b border-slate-100 font-mono text-slate-400">{item.target}</td>
                         <td className="p-3 text-center border-b border-slate-100 font-bold text-lg text-slate-800">{item.dispatch}</td>
                         <td className="p-3 text-center border-b border-slate-100 font-bold">{Math.round(item.percentage)}%</td>
                         <td className="p-3 text-center pr-4 border-b border-slate-100">
                            <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${statusBadge}`}>
                               {item.percentage >= 100 ? 'Excellent' : item.percentage >= 70 ? 'Good' : 'Poor'}
                            </span>
                         </td>
                      </tr>
                   );
                })}
             </tbody>
          </table>
       </div>

       {/* Footer */}
       <div className="px-8 pb-4">
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-wider">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Domex Operations System
             </div>
             <div>Generated automatically</div>
          </div>
       </div>
    </div>
  );
});

DispatchReportCard.displayName = 'DispatchReportCard';