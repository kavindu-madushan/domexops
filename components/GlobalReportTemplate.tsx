import React, { forwardRef } from 'react';
import { 
  Building2, 
  BarChart3, 
  Calendar,
  CheckCircle2,
  Package,
  RotateCcw
} from 'lucide-react';

interface AggregatedBranchData {
  branchId: string;
  branchName: string;
  totalInward: number;
  totalDelivered: number;
  totalReturns: number;
  avgSuccess: number;
}

interface GlobalReportTemplateProps {
  data: AggregatedBranchData[];
  dateRange: string;
  totalInward: number;
  totalDelivered: number;
  avgSuccess: number;
}

export const GlobalReportTemplate = forwardRef<HTMLDivElement, GlobalReportTemplateProps>(({ data, dateRange, totalInward, totalDelivered, avgSuccess }, ref) => {
  
  const containerStyle = {
    width: '1200px', // Wider for table data
    backgroundColor: '#f8fafc',
    padding: '40px',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const TopStat = ({ label, value, colorClass }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 text-center">
       <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">{label}</div>
       <div className={`text-4xl font-black ${colorClass}`}>{value}</div>
    </div>
  );

  return (
    <div ref={ref} style={containerStyle}>
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-10 relative z-10">
           <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl border border-slate-200">
                 <img src="https://domex.lk/public/image/domex_logo.png" alt="Domex" className="h-10 w-auto object-contain" />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-slate-800 tracking-tight">Network Performance Report</h1>
                 <p className="text-slate-500 font-medium mt-1">Domex Global Operations Analysis</p>
              </div>
           </div>
           <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3">
              <Calendar className="text-orange-500" size={20} />
              <div>
                 <div className="text-[10px] text-slate-400 font-bold uppercase">Report Period</div>
                 <div className="font-bold text-slate-700">{dateRange}</div>
              </div>
           </div>
        </div>

        {/* Aggregated Stats */}
        <div className="flex gap-6 mb-10 relative z-10">
           <TopStat label="Total Network Volume" value={totalInward.toLocaleString()} colorClass="text-blue-600" />
           <TopStat label="Total Delivered" value={totalDelivered.toLocaleString()} colorClass="text-emerald-600" />
           <TopStat label="Avg Network Success" value={`${avgSuccess}%`} colorClass="text-purple-600" />
        </div>

        {/* Breakdown Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative z-10">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
               <BarChart3 size={18} className="text-slate-400" />
               <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Branch Performance Breakdown</h3>
            </div>
            
            <table className="w-full text-left text-sm">
               <thead>
                  <tr className="border-b border-slate-100">
                     <th className="px-8 py-4 font-bold text-slate-400 uppercase text-xs">Branch Name</th>
                     <th className="px-8 py-4 font-bold text-slate-400 uppercase text-xs text-right">Inward</th>
                     <th className="px-8 py-4 font-bold text-slate-400 uppercase text-xs text-right">Delivered</th>
                     <th className="px-8 py-4 font-bold text-slate-400 uppercase text-xs text-right">Returns</th>
                     <th className="px-8 py-4 font-bold text-slate-400 uppercase text-xs text-right">Success Rate</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {data.map((row) => (
                    <tr key={row.branchId}>
                       <td className="px-8 py-4 font-bold text-slate-700">{row.branchName}</td>
                       <td className="px-8 py-4 text-slate-600 text-right font-medium">{row.totalInward}</td>
                       <td className="px-8 py-4 text-emerald-600 text-right font-bold">{row.totalDelivered}</td>
                       <td className="px-8 py-4 text-rose-500 text-right">{row.totalReturns}</td>
                       <td className="px-8 py-4 text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                             row.avgSuccess >= 90 ? 'bg-emerald-100 text-emerald-700' : 
                             row.avgSuccess >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                             {row.avgSuccess}%
                          </span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center text-slate-400 text-xs font-medium">
           <div>Domex Operations • Admin Generated Report</div>
           <div>{new Date().toLocaleDateString()}</div>
        </div>
    </div>
  );
});

GlobalReportTemplate.displayName = 'GlobalReportTemplate';