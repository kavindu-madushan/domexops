import React, { forwardRef } from 'react';
import { 
  BarChart3, 
  Package, 
  CheckCircle2, 
  TrendingUp, 
  RotateCcw,
  CalendarRange,
  Send,
  Clock
} from 'lucide-react';

interface SummaryMetrics {
  totalInward: number;
  totalDispatch: number;
  totalReturns: number;
  avgSuccess: number;
  totalPending: number;
}

interface SummaryReportTemplateProps {
  metrics: SummaryMetrics;
  dateRangeLabel: string;
  branchName: string;
}

export const SummaryReportTemplate = forwardRef<HTMLDivElement, SummaryReportTemplateProps>(({ metrics, dateRangeLabel, branchName }, ref) => {
  
  // Container for high-res capture
  const containerStyle = {
    width: '1000px',
    backgroundColor: '#f8fafc',
    padding: '40px',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const StatCard = ({ label, value, icon: Icon, colorClass, bgClass, subLabel }: any) => (
    <div className={`rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden ${bgClass} h-40`}>
       <div className={`absolute -right-4 -top-4 opacity-10 transform rotate-12 ${colorClass}`}>
         <Icon size={100} />
       </div>
       
       <div className="relative z-10">
         <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                <Icon size={20} className={colorClass.replace('text-', 'text-')} /> 
            </div>
            <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{label}</span>
         </div>
       </div>
       
       <div className="relative z-10 mt-2">
         <div className={`font-black text-slate-800 text-5xl leading-tight`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
         </div>
         {subLabel && <div className="text-slate-400 text-xs font-medium mt-1">{subLabel}</div>}
       </div>
    </div>
  );

  return (
    <div ref={ref} style={containerStyle}>
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-white/50 flex justify-between items-center mb-8 relative z-10">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-l-3xl"></div>
            <div>
                <div className="flex items-center gap-2 mb-3">
                   <img src="https://domex.lk/public/image/domex_logo.png" alt="Domex" className="h-8 w-auto object-contain" />
                </div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">{branchName}</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Performance Summary</p>
            </div>
            <div className="text-right">
                <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <CalendarRange size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Report Period</div>
                        <div className="text-xl font-bold text-slate-700">{dateRangeLabel}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Hero Section: Success Rate */}
        <div className="mb-8 relative z-10">
            <div className={`rounded-3xl p-8 flex items-center justify-between text-white shadow-lg ${metrics.avgSuccess >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : metrics.avgSuccess >= 60 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-pink-600'}`}>
                <div>
                    <div className="font-bold text-white/80 text-sm uppercase tracking-widest mb-1">Average Success Rate</div>
                    <div className="text-7xl font-black tracking-tighter flex items-baseline gap-2">
                        {metrics.avgSuccess}
                        <span className="text-3xl opacity-80">%</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                        <TrendingUp size={14} /> Overall Efficiency
                    </div>
                </div>
                <div className="opacity-20 transform scale-150 mr-8">
                    <CheckCircle2 size={120} />
                </div>
            </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
            <StatCard 
                label="Total Inward" 
                value={metrics.totalInward} 
                icon={Package} 
                colorClass="text-blue-600" 
                bgClass="bg-white"
                subLabel="Parcels Received"
            />
            <StatCard 
                label="Total Dispatch" 
                value={metrics.totalDispatch} 
                icon={Send} 
                colorClass="text-purple-600" 
                bgClass="bg-white"
                subLabel="Dispatched"
            />
            <StatCard 
                label="Pending Checking" 
                value={metrics.totalPending} 
                icon={Clock} 
                colorClass="text-orange-600" 
                bgClass="bg-white"
                subLabel="To Be Checked"
            />
            <StatCard 
                label="Total Returns" 
                value={metrics.totalReturns} 
                icon={RotateCcw} 
                colorClass="text-rose-600" 
                bgClass="bg-white"
                subLabel="Returned to Sender"
            />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-8 border-t border-slate-200/60 relative z-10">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">DX</div>
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Domex Analytics</div>
            </div>
            <div className="text-slate-400 text-xs font-medium">
                Generated {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </div>
        </div>
    </div>
  );
});

SummaryReportTemplate.displayName = 'SummaryReportTemplate';