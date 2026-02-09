import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchAllAdminReports, fetchAllAdminCashRecords, getAllBranches } from '../services/db';
import { 
  Calendar, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Printer, 
  Loader2,
  Check,
  Building2,
  BarChart3,
  Wallet
} from 'lucide-react';
import { toast } from '../services/toast';
import html2canvas from 'html2canvas';
import { GlobalReportTemplate } from './GlobalReportTemplate';

interface AggregatedBranchData {
  branchId: string;
  branchName: string;
  totalInward: number;
  totalDelivered: number; // Still calculated internally for reports if needed
  totalReturns: number;
  avgSuccess: number;
  // Cash Fields
  totalEcom: number;
  totalReceived: number;
  totalVariance: number;
}

export const GlobalReportGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<{user_id: string, branchName: string}[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  
  // Settings
  const [reportMode, setReportMode] = useState<'ops' | 'cash'>('ops');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data State
  const [reportData, setReportData] = useState<AggregatedBranchData[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [exporting, setExporting] = useState(false);

  const templateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBranches();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(today);
  }, []);

  const loadBranches = async () => {
    const data = await getAllBranches();
    const filtered = data.filter(b => b.branchName.toLowerCase() !== 'admin');
    setBranches(filtered);
    setSelectedBranchIds(filtered.map(b => b.user_id));
  };

  const toggleAllBranches = () => {
    if (selectedBranchIds.length === branches.length) {
      setSelectedBranchIds([]);
    } else {
      setSelectedBranchIds(branches.map(b => b.user_id));
    }
  };

  const parseRowDate = (dateStr: string): Date => {
    const now = new Date();
    const [day, monthStr] = dateStr.split('-');
    const monthMap: {[key: string]: number} = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    if (!monthStr || monthMap[monthStr] === undefined) {
       if (dateStr.includes('-')) return new Date(dateStr);
       return new Date(0); 
    }
    return new Date(now.getFullYear(), monthMap[monthStr], parseInt(day));
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a valid date range");
      return;
    }
    if (selectedBranchIds.length === 0) {
      toast.error("Please select at least one branch");
      return;
    }

    setLoading(true);
    setIsGenerated(false);

    try {
      const [allReports, allCash] = await Promise.all([
         fetchAllAdminReports(),
         fetchAllAdminCashRecords()
      ]);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const aggregated: AggregatedBranchData[] = branches
        .filter(b => selectedBranchIds.includes(b.user_id))
        .map(branch => {
          const branchOps = allReports.filter(r => r.user_id === branch.user_id);
          const filteredOps = branchOps.filter(r => {
             const d = parseRowDate(r.date);
             return d >= start && d <= end;
          });

          const branchCash = allCash.filter(c => c.user_id === branch.user_id);
          const filteredCash = branchCash.filter(c => {
             const d = new Date(c.date);
             return d >= start && d <= end;
          });

          const totalInward = filteredOps.reduce((sum, r) => sum + (r.todayInward || 0), 0);
          const totalDelivered = filteredOps.reduce((sum, r) => sum + (r.yesterdayDelivered || 0), 0);
          const totalReturns = filteredOps.reduce((sum, r) => sum + (r.todayRtnToSender || 0), 0);
          const avgSuccess = filteredOps.length > 0 
             ? Math.round(filteredOps.reduce((sum, r) => sum + (r.deliveryPercentage || 0), 0) / filteredOps.length)
             : 0;

          const totalEcom = filteredCash.reduce((sum, c) => sum + (c.ecomCash || 0), 0);
          const totalReceived = filteredCash.reduce((sum, c) => sum + (c.receivedCash || 0), 0);
          const totalVariance = totalReceived - totalEcom;

          return {
            branchId: branch.user_id,
            branchName: branch.branchName,
            totalInward,
            totalDelivered,
            totalReturns,
            avgSuccess,
            totalEcom,
            totalReceived,
            totalVariance
          };
        });
      
      if (reportMode === 'ops') {
         aggregated.sort((a, b) => b.avgSuccess - a.avgSuccess);
      } else {
         aggregated.sort((a, b) => b.totalReceived - a.totalReceived);
      }

      setReportData(aggregated);
      setIsGenerated(true);
      toast.success("Report generated successfully!");

    } catch (e) {
      console.error(e);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const networkStats = useMemo(() => {
    const totalInward = reportData.reduce((acc, r) => acc + r.totalInward, 0);
    const totalDelivered = reportData.reduce((acc, r) => acc + r.totalDelivered, 0);
    const avgSuccess = reportData.length > 0 ? Math.round(reportData.reduce((acc, r) => acc + r.avgSuccess, 0) / reportData.length) : 0;
    const totalReceived = reportData.reduce((acc, r) => acc + r.totalReceived, 0);
    const totalVariance = reportData.reduce((acc, r) => acc + r.totalVariance, 0);

    return { totalInward, totalDelivered, avgSuccess, totalReceived, totalVariance };
  }, [reportData]);

  const exportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];

    if (reportMode === 'ops') {
       headers = ["Branch Name", "Total Inward", "Total Delivered", "Returns", "Avg Success Rate"];
       rows = reportData.map(r => [r.branchName, r.totalInward, r.totalDelivered, r.totalReturns, `${r.avgSuccess}%`]);
    } else {
       headers = ["Branch Name", "Total Expected E-Com", "Total Cash Received", "Variance"];
       rows = reportData.map(r => [r.branchName, r.totalEcom, r.totalReceived, r.totalVariance]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Global_${reportMode.toUpperCase()}_Report_${startDate}.csv`;
    link.click();
    toast.success("CSV downloaded");
  };

  const exportPNG = async () => {
    if (!templateRef.current) return;
    setExporting(true);
    try {
       await new Promise(resolve => setTimeout(resolve, 200));
       const canvas = await html2canvas(templateRef.current, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
       const link = document.createElement('a');
       link.download = `Global_${reportMode.toUpperCase()}_Report_${startDate}.png`;
       link.href = canvas.toDataURL('image/png');
       link.click();
       toast.success("PNG Image downloaded");
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
      <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
         <GlobalReportTemplate 
           ref={templateRef}
           data={reportData}
           dateRange={`${startDate} to ${endDate}`}
           totalInward={networkStats.totalInward}
           totalDelivered={networkStats.totalDelivered}
           avgSuccess={networkStats.avgSuccess}
         />
      </div>

      <div className="flex-none bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Building2 className="text-blue-600" /> Global Report Generator
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-4 border-r border-slate-100 pr-6">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                   onClick={() => setReportMode('ops')}
                   className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${reportMode === 'ops' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   Operations
                </button>
                <button 
                   onClick={() => setReportMode('cash')}
                   className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${reportMode === 'cash' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   Cash Flow
                </button>
             </div>

             <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Date Range</label>
                <div className="flex gap-2">
                   <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                   <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
             </div>

             <div>
                <div className="flex justify-between items-center mb-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Branches</label>
                   <button onClick={toggleAllBranches} className="text-[10px] font-bold text-blue-600 hover:underline">
                      {selectedBranchIds.length === branches.length ? 'Deselect All' : 'Select All'}
                   </button>
                </div>
                <div className="h-40 overflow-y-auto custom-scrollbar bg-slate-50 rounded-lg border border-slate-200 p-2">
                   {branches.map(branch => (
                      <label key={branch.user_id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                         <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedBranchIds.includes(branch.user_id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                            {selectedBranchIds.includes(branch.user_id) && <Check size={12} className="text-white" />}
                         </div>
                         <span className="text-sm text-slate-700 truncate">{branch.branchName}</span>
                      </label>
                   ))}
                </div>
             </div>

             <button 
                onClick={generateReport}
                disabled={loading}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
             >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Filter size={18} />} Generate Report
             </button>
          </div>

          <div className="md:col-span-8 flex flex-col h-[500px]">
             {isGenerated ? (
               <>
                 <div className="flex justify-between items-center mb-4">
                    {reportMode === 'ops' ? (
                       <div className="flex gap-4">
                          <div><span className="text-xs text-slate-400 uppercase">Volume</span><div className="font-bold text-slate-800 text-lg">{networkStats.totalInward.toLocaleString()}</div></div>
                          <div><span className="text-xs text-slate-400 uppercase">Delivered</span><div className="font-bold text-emerald-600 text-lg">{networkStats.totalDelivered.toLocaleString()}</div></div>
                          <div><span className="text-xs text-slate-400 uppercase">Avg Success</span><div className="font-bold text-purple-600 text-lg">{networkStats.avgSuccess}%</div></div>
                       </div>
                    ) : (
                       <div className="flex gap-4">
                          <div><span className="text-xs text-slate-400 uppercase">Total Received</span><div className="font-bold text-emerald-600 text-lg">{networkStats.totalReceived.toLocaleString()}</div></div>
                          <div><span className="text-xs text-slate-400 uppercase">Total Variance</span><div className={`font-bold text-lg ${networkStats.totalVariance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{networkStats.totalVariance.toLocaleString()}</div></div>
                       </div>
                    )}
                    
                    <div className="flex gap-2">
                       {reportMode === 'ops' && (
                          <button onClick={exportPNG} disabled={exporting} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Export PNG">
                             {exporting ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                          </button>
                       )}
                       <button onClick={exportCSV} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Export CSV">
                          <FileSpreadsheet size={20} />
                       </button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 sticky top-0">
                          <tr>
                             <th className="px-4 py-3 font-semibold text-slate-600">Branch</th>
                             {reportMode === 'ops' ? (
                                <>
                                   <th className="px-4 py-3 font-semibold text-slate-600 text-right">Inward</th>
                                   <th className="px-4 py-3 font-semibold text-slate-600 text-right">Delivered</th>
                                   <th className="px-4 py-3 font-semibold text-slate-600 text-right">Success</th>
                                </>
                             ) : (
                                <>
                                   <th className="px-4 py-3 font-semibold text-slate-600 text-right">Expected E-Com</th>
                                   <th className="px-4 py-3 font-semibold text-slate-600 text-right">Cash Received</th>
                                   <th className="px-4 py-3 font-semibold text-slate-600 text-right">Variance</th>
                                </>
                             )}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {reportData.map((row) => (
                             <tr key={row.branchId} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{row.branchName}</td>
                                {reportMode === 'ops' ? (
                                   <>
                                      <td className="px-4 py-3 text-slate-600 text-right">{row.totalInward}</td>
                                      <td className="px-4 py-3 text-slate-600 text-right">{row.totalDelivered}</td>
                                      <td className="px-4 py-3 text-right">
                                         <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            row.avgSuccess >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                            row.avgSuccess >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                         }`}>
                                            {row.avgSuccess}%
                                         </span>
                                      </td>
                                   </>
                                ) : (
                                   <>
                                      <td className="px-4 py-3 text-slate-600 text-right">{row.totalEcom.toLocaleString()}</td>
                                      <td className="px-4 py-3 font-bold text-emerald-600 text-right">{row.totalReceived.toLocaleString()}</td>
                                      <td className={`px-4 py-3 font-bold text-right ${row.totalVariance < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                         {row.totalVariance.toLocaleString()}
                                      </td>
                                   </>
                                )}
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               </>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                   {reportMode === 'ops' ? <BarChart3 size={48} className="mb-4 opacity-20" /> : <Wallet size={48} className="mb-4 opacity-20" />}
                   <p className="font-medium">Select parameters and click Generate</p>
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};