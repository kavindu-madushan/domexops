import React, { forwardRef } from 'react';
import { CashRow } from '../types';
import { Wallet, TrendingUp, AlertTriangle } from 'lucide-react';

interface CashReportTemplateProps {
  branchName: string;
  date: string;
  records: CashRow[];
  totalEcom: number;
  totalReceived: number;
  balance: number;
}

export const CashReportTemplate = forwardRef<HTMLDivElement, CashReportTemplateProps>(({ 
  branchName, date, records, totalEcom, totalReceived, balance 
}, ref) => {

  const containerStyle = {
    width: '1000px',
    backgroundColor: '#ffffff',
    padding: '40px',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  return (
    <div ref={ref} style={containerStyle}>
       {/* Background */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

       {/* Header */}
       <div className="flex justify-between items-center mb-8 border-b-2 border-slate-100 pb-6 relative z-10">
          <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-600 p-2 rounded-lg text-white">
                   <Wallet size={24} />
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Daily Cash Report</h1>
             </div>
             <p className="text-slate-500 font-medium">Branch: <span className="text-slate-900 font-bold">{branchName}</span></p>
          </div>
          <div className="text-right bg-slate-50 px-6 py-3 rounded-xl border border-slate-100">
             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Date</div>
             <div className="text-2xl font-black text-slate-800">{date}</div>
          </div>
       </div>

       {/* Summary Cards */}
       <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
             <div className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-2">Expected E-Com</div>
             <div className="text-4xl font-black text-blue-900">{totalEcom.toLocaleString()}</div>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center">
             <div className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">Total Received</div>
             <div className="text-4xl font-black text-emerald-900">{totalReceived.toLocaleString()}</div>
          </div>
          <div className={`p-6 rounded-2xl border text-center ${balance < 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
             <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${balance < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                {balance < 0 ? 'Shortage' : 'Excess / Balance'}
             </div>
             <div className={`text-4xl font-black ${balance < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {balance > 0 ? '+' : ''}{balance.toLocaleString()}
             </div>
          </div>
       </div>

       {/* Detailed Table */}
       <div className="border border-slate-200 rounded-xl overflow-hidden relative z-10">
          <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                <tr>
                   <th className="px-6 py-4">Courier Name</th>
                   <th className="px-6 py-4 text-center">Resend?</th>
                   <th className="px-6 py-4 text-right">E-Com Value</th>
                   <th className="px-6 py-4 text-right">Cash Received</th>
                   <th className="px-6 py-4 text-right">Variance</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 bg-white">
                {records.map((row, idx) => {
                   const variance = row.receivedCash - row.ecomCash;
                   return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                         <td className="px-6 py-3 font-bold text-slate-700">{row.courierName}</td>
                         <td className="px-6 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                               row.resendStatus === 'No' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                               {row.resendStatus === 'No' ? 'No' : 'Yes'}
                            </span>
                         </td>
                         <td className="px-6 py-3 text-right text-slate-600">{row.ecomCash.toLocaleString()}</td>
                         <td className="px-6 py-3 text-right font-bold text-emerald-600">{row.receivedCash.toLocaleString()}</td>
                         <td className={`px-6 py-3 text-right font-bold ${variance < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {variance === 0 ? '-' : variance.toLocaleString()}
                         </td>
                      </tr>
                   );
                })}
             </tbody>
          </table>
       </div>

       {/* Footer */}
       <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-slate-400 text-xs">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             Domex Operations System
          </div>
          <div>Generated on {new Date().toLocaleString()}</div>
       </div>
    </div>
  );
});

CashReportTemplate.displayName = 'CashReportTemplate';