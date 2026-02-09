import React, { forwardRef } from 'react';
import { ReportRow } from '../types';
import { 
  Package, 
  Truck, 
  RotateCcw, 
  AlertCircle, 
  Send, 
  Clock, 
  ShoppingBag, 
  AlertTriangle, 
  Rocket
} from 'lucide-react';

interface DailyReportTemplateProps {
  row: ReportRow | null;
  branchName: string;
}

export const DailyReportTemplate = forwardRef<HTMLDivElement, DailyReportTemplateProps>(({ row, branchName }, ref) => {
  if (!row) return null;

  const getHeaderDate = (dateStr: string) => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const [day, monthName] = dateStr.split('-');
      if (!day || !monthName) return dateStr;
      const date = new Date(`${monthName} ${day}, ${currentYear}`);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const headerDate = getHeaderDate(row.date);
  const percentage = row.deliveryPercentage;

  // Capitalize first letter of each word in branch name
  const formattedBranchName = branchName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // 7-Stage Color Logic for Success Card
  const getTheme = (p: number) => {
    if (p >= 100) return { gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-200/50', iconColor: 'text-emerald-100', arcColor: '#fff' }; // Green
    if (p >= 90) return { gradient: 'from-emerald-400 to-teal-500', shadow: 'shadow-teal-200/50', iconColor: 'text-teal-100', arcColor: '#fff' };       // Light Green
    if (p >= 80) return { gradient: 'from-yellow-300 to-amber-400', shadow: 'shadow-amber-200/50', iconColor: 'text-amber-100', arcColor: '#fff' };     // Light Yellow
    if (p >= 70) return { gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-200/50', iconColor: 'text-orange-100', arcColor: '#fff' };   // Yellow
    if (p >= 60) return { gradient: 'from-rose-300 to-red-400', shadow: 'shadow-rose-200/50', iconColor: 'text-rose-100', arcColor: '#fff' };           // Light Red
    if (p >= 40) return { gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-200/50', iconColor: 'text-red-100', arcColor: '#fff' };             // Red
    return { gradient: 'from-red-800 to-rose-950', shadow: 'shadow-red-900/50', iconColor: 'text-red-200', arcColor: '#fff' };                          // Hard Red
  };

  const theme = getTheme(percentage);

  // SVG Arc Meter Component
  const ArcMeter = ({ value }: { value: number }) => {
    const r = 50;
    const cx = 60;
    const cy = 60;
    const strokeWidth = 8;
    
    // Arc logic: Semi-circle from -90deg to +90deg (180deg span)
    const startAngle = -Math.PI; // -180 deg
    const endAngle = 0; // 0 deg
    
    const progress = Math.min(Math.max(value, 0), 100) / 100;
    const currentAngle = startAngle + (progress * Math.PI);

    const x = cx + r * Math.cos(currentAngle);
    const y = cy + r * Math.sin(currentAngle);

    // SVG Path for arc
    // M startX startY A radius radius 0 0 1 endX endY
    const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
    const valPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`;

    return (
      <svg width="120" height="70" viewBox="0 0 120 70" className="overflow-visible">
        {/* Background Track */}
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Value Track */}
        <path d={valPath} fill="none" stroke="white" strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    );
  };

  // Fixed container for consistent image generation
  const containerStyle = {
    width: '1200px',
    minHeight: '850px',
    backgroundColor: '#f8fafc',
    padding: '40px',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  // Card Component
  const MetricCard = ({ label, value, icon: Icon, bgClass, textClass, iconClass, customContent }: any) => (
    <div className={`relative rounded-[2rem] p-6 flex flex-col justify-between overflow-hidden h-48 shadow-sm border border-white/40 ${bgClass}`}>
       {/* Watermark Icon */}
       <div className={`absolute -right-6 -bottom-6 opacity-10 transform -rotate-12 scale-150 pointer-events-none ${iconClass}`}>
         <Icon size={160} strokeWidth={1.5} />
       </div>
       
       <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-white/40 backdrop-blur-sm shadow-sm ${iconClass}`}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${textClass} opacity-80`}>
              {label}
            </span>
          </div>
       </div>

       <div className="relative z-10 mt-auto">
          {customContent ? customContent : (
             <div className={`text-[5rem] font-black tracking-tighter leading-none ${textClass}`}>
                {value}
             </div>
          )}
       </div>
    </div>
  );

  return (
    <div ref={ref} style={containerStyle}>
       {/* Abstract Background Shapes */}
       <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-50 rounded-full blur-3xl mix-blend-multiply opacity-60"></div>
       <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl mix-blend-multiply opacity-60"></div>
       <div className="absolute bottom-20 right-20 w-32 h-32 bg-yellow-100 rounded-xl rotate-12 blur-md opacity-40"></div>
       
       {/* Header */}
       <div className="relative z-10 bg-white rounded-[2rem] p-6 pl-10 pr-8 shadow-lg shadow-slate-200/50 border border-white/60 mb-8 flex items-center justify-between">
          <div className="absolute top-0 left-12 right-12 h-1.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-b-lg opacity-80"></div>
          
          <div className="mt-6">
             <h1 className="text-5xl text-slate-800 mb-3 font-serif tracking-tight leading-tight">{formattedBranchName}</h1>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] ml-1">DAILY OPERATIONS REPORT</p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl px-8 py-4 text-right border border-slate-100 mt-2">
             <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operating Date</div>
             <div className="text-2xl font-black text-slate-700 font-mono tracking-tight">{headerDate}</div>
          </div>
       </div>

       {/* Grid Layout */}
       <div className="relative z-10 grid grid-cols-4 gap-6">
          
          {/* 1. Delivery Success (Span 2) */}
          <div className={`col-span-2 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl ${theme.shadow} bg-gradient-to-br ${theme.gradient}`}>
             {/* Rocket Icon */}
             <div className="absolute top-6 right-6 opacity-20 text-white">
                <Rocket size={80} />
             </div>
             
             <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                   <h3 className="text-white/90 font-bold text-xs uppercase tracking-widest mb-1">Delivery Success</h3>
                   <div className="h-1 w-12 bg-white/30 rounded-full"></div>
                </div>
                
                <div className="flex items-end gap-6 mt-4">
                   <div className="mb-2">
                      <ArcMeter value={percentage} />
                   </div>
                   <div className="text-[6rem] font-black text-white leading-none tracking-tighter">
                      {percentage}<span className="text-4xl align-top opacity-60">%</span>
                   </div>
                </div>
             </div>
          </div>

          {/* 2. Inward */}
          <MetricCard 
             label="Inward" 
             value={row.todayInward}
             icon={Package}
             bgClass="bg-blue-100" // Light Blue
             textClass="text-slate-800"
             iconClass="text-blue-500"
          />

          {/* 3. Dispatch */}
          <MetricCard 
             label="Dispatch" 
             value={row.yesterdayDispatch}
             icon={Send}
             bgClass="bg-purple-100" // Light Purple
             textClass="text-slate-800"
             iconClass="text-purple-500"
          />

          {/* Row 2 */}
          <MetricCard 
             label="Pending Checking" 
             value={row.pendingChecking || 0}
             icon={Clock}
             bgClass="bg-yellow-100" // Light Yellow
             textClass="text-slate-800"
             iconClass="text-yellow-600"
          />
          <MetricCard 
             label="Missed Route" 
             value={row.missedRoute || 0}
             icon={AlertTriangle}
             bgClass="bg-orange-100" // Light Orange
             textClass="text-slate-800"
             iconClass="text-orange-500"
          />
          <MetricCard 
             label="Eve. Missed Route" 
             value={row.eveningMissedRoute || 0}
             icon={Truck}
             bgClass="bg-emerald-100" // Light Mint
             textClass="text-slate-800"
             iconClass="text-emerald-600"
          />
          <MetricCard 
             label="Temu Reschedule" 
             value={row.temuReschedule || 0}
             icon={ShoppingBag}
             bgClass="bg-pink-100" // Light Pink
             textClass="text-slate-800"
             iconClass="text-pink-500"
          />

          {/* Row 3 */}
          <MetricCard 
             label="RTS" 
             value={row.todayRtnToSender}
             icon={RotateCcw}
             bgClass="bg-red-100" // Light Red/Salmon
             textClass="text-slate-800"
             iconClass="text-red-500"
          />
          <MetricCard 
             label="Hold" 
             value={row.todayBranchHold}
             icon={AlertCircle}
             bgClass="bg-sky-100" // Light Sky Blue
             textClass="text-slate-800"
             iconClass="text-sky-600"
          />
          
          {/* Decorative Empty Area */}
          <div className="col-span-2 relative flex items-center justify-end px-12 opacity-50">
             <div className="text-right">
                <div className="w-16 h-16 bg-purple-200 rounded-full blur-xl absolute right-20 top-10"></div>
                <div className="w-12 h-12 bg-yellow-200 rounded-lg rotate-45 blur-lg absolute right-40 bottom-10"></div>
             </div>
          </div>

       </div>

       {/* Footer */}
       <div className="mt-12 border-t border-slate-300 pt-6 flex justify-between items-end relative z-10">
          <div className="flex flex-col">
             <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-1">System</span>
             <span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Domex Operations System</span>
          </div>
          
          {/* Center decorative dot */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-slate-300 rounded-full border-2 border-white"></div>

          <div className="text-right">
             <span className="text-slate-400 text-[10px] font-mono">Generated {new Date().toLocaleString()}</span>
          </div>
       </div>
    </div>
  );
});

DailyReportTemplate.displayName = 'DailyReportTemplate';