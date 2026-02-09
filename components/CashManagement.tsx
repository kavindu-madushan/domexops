import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Download, 
  Copy, 
  Calculator, 
  Coins, 
  ArrowRight,
  Check,
  AlertCircle,
  Banknote,
  Loader2,
  X,
  User,
  Users
} from 'lucide-react';
import { fetchCashRecords, addCashRecord, deleteCashRecord, fetchSavedCouriers, saveCourierName, deleteCourierName } from '../services/db';
import { CashRow, SavedCourier } from '../types';
import { toast } from '../services/toast';
import html2canvas from 'html2canvas';
import { CashReportTemplate } from './CashReportTemplate';

interface CashManagementProps {
  userId: string;
  branchName: string;
  readOnly?: boolean;
}

export const CashManagement: React.FC<CashManagementProps> = ({ userId, branchName, readOnly = false }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<CashRow[]>([]);
  const [savedCouriers, setSavedCouriers] = useState<SavedCourier[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'entry' | 'counter'>('entry');

  // Form State
  const [courierName, setCourierName] = useState('');
  const [ecomCash, setEcomCash] = useState('');
  const [receivedCash, setReceivedCash] = useState('');
  const [resendStatus, setResendStatus] = useState<'Yes' | 'No'>('No');

  // Export State
  const templateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRecords();
    loadSavedCouriers();
  }, [date, userId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchCashRecords(userId, date);
      setRecords(data);
    } catch (e) {
      toast.error("Failed to load cash records");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCouriers = async () => {
    try {
      const data = await fetchSavedCouriers(userId);
      setSavedCouriers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName) return;
    if (readOnly) return;

    setSubmitting(true);
    try {
      // 1. Add Record
      await addCashRecord(userId, {
        date,
        courierName,
        ecomCash: Number(ecomCash) || 0,
        receivedCash: Number(receivedCash) || 0,
        resendStatus
      });

      // 2. Save Courier Name if not exists
      const exists = savedCouriers.some(sc => sc.name.toLowerCase() === courierName.trim().toLowerCase());
      if (!exists) {
         await saveCourierName(userId, courierName);
         loadSavedCouriers();
      }
      
      // Reset form
      setCourierName('');
      setEcomCash('');
      setReceivedCash('');
      setResendStatus('No');
      
      loadRecords();
      toast.success("Record added");
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    if (!window.confirm("Remove this entry?")) return;
    try {
      await deleteCashRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success("Deleted");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleDeleteCourier = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent clicking the card
    if (readOnly) return;
    if (!window.confirm("Delete this saved courier name?")) return;
    
    try {
      await deleteCourierName(id);
      setSavedCouriers(prev => prev.filter(sc => sc.id !== id));
      toast.success("Saved courier name removed");
    } catch (e) {
      toast.error("Failed to delete name");
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalEcom = records.reduce((acc, r) => acc + r.ecomCash, 0);
    const totalReceived = records.reduce((acc, r) => acc + r.receivedCash, 0);
    const balance = totalReceived - totalEcom;
    return { totalEcom, totalReceived, balance };
  }, [records]);

  // Export
  const copyForWhatsapp = () => {
    const lines = [
      `*Daily Cash Report - ${branchName}*`,
      `📅 Date: ${date}`,
      `------------------------`,
      ...records.map(r => 
        `${r.courierName}: ${r.receivedCash.toLocaleString()} (${r.resendStatus === 'Yes' ? '🔁 Resend' : '✅ Delivered'})`
      ),
      `------------------------`,
      `*Total Received: ${metrics.totalReceived.toLocaleString()}*`,
      `Expected: ${metrics.totalEcom.toLocaleString()}`,
      `Variance: ${metrics.balance}`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success("Copied to clipboard!");
  };

  const downloadImage = async () => {
    if (!templateRef.current) return;
    try {
      const canvas = await html2canvas(templateRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `Cash_Report_${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Image downloaded");
    } catch (e) {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Hidden Export Template */}
      <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
         <CashReportTemplate 
            ref={templateRef}
            branchName={branchName}
            date={date}
            records={records}
            totalEcom={metrics.totalEcom}
            totalReceived={metrics.totalReceived}
            balance={metrics.balance}
         />
      </div>

      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
               <Wallet className="text-emerald-600" /> Cash Management
            </h2>
            <p className="text-slate-500 text-sm">Track daily courier collections and shortages.</p>
         </div>
         <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
         />
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expected E-Com</p>
               <h3 className="text-2xl font-black text-slate-800">{metrics.totalEcom.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Wallet size={24} /></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Received</p>
               <h3 className="text-2xl font-black text-emerald-600">{metrics.totalReceived.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Banknote size={24} /></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Balance</p>
               <h3 className={`text-2xl font-black ${metrics.balance < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {metrics.balance > 0 ? '+' : ''}{metrics.balance.toLocaleString()}
               </h3>
            </div>
            <div className={`p-3 rounded-xl ${metrics.balance < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
               {metrics.balance < 0 ? <AlertCircle size={24} /> : <Check size={24} />}
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100 w-fit">
         <button 
            onClick={() => setActiveTab('entry')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'entry' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
         >
            <Plus size={16} /> Data Entry
         </button>
         <button 
            onClick={() => setActiveTab('counter')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'counter' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
         >
            <Calculator size={16} /> Cash Counter
         </button>
      </div>

      {/* Content Area */}
      {activeTab === 'entry' ? (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Input Form - Hidden if Read Only */}
            {!readOnly && (
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <Plus size={18} className="text-emerald-500" /> New Entry
                  </h3>
                  <form onSubmit={handleAdd} className="space-y-4">
                     
                     {/* Courier Name Input & Saved Chips */}
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Courier Name</label>
                        <input 
                           type="text" 
                           value={courierName}
                           onChange={e => setCourierName(e.target.value)}
                           className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none mb-3"
                           placeholder="Type or select below..."
                           required
                        />
                        {savedCouriers.length > 0 && (
                           <div className="flex flex-wrap gap-2">
                              {savedCouriers.map(sc => (
                                 <div 
                                    key={sc.id} 
                                    onClick={() => setCourierName(sc.name)}
                                    className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 rounded-lg cursor-pointer transition-colors text-xs font-bold text-slate-600 hover:text-emerald-700"
                                 >
                                    <User size={12} /> {sc.name}
                                    <button 
                                       onClick={(e) => handleDeleteCourier(e, sc.id)}
                                       className="p-0.5 rounded hover:bg-rose-100 hover:text-rose-600 text-slate-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                       <X size={12} />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-Com Value</label>
                           <input 
                              type="number" 
                              value={ecomCash}
                              onChange={e => setEcomCash(e.target.value)}
                              className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="0"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase ml-1">Received</label>
                           <input 
                              type="number" 
                              value={receivedCash}
                              onChange={e => setReceivedCash(e.target.value)}
                              className="w-full bg-emerald-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="0"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Resend Status</label>
                        <div className="flex gap-2 mt-1">
                           {(['No', 'Yes'] as const).map(s => (
                              <button
                                 key={s}
                                 type="button"
                                 onClick={() => setResendStatus(s)}
                                 className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                    resendStatus === s 
                                    ? (s === 'Yes' ? 'bg-amber-500 text-white border-amber-500' : 'bg-emerald-500 text-white border-emerald-500')
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                 }`}
                              >
                                 {s === 'Yes' ? 'Resend: Yes' : 'Resend: No (Delivered)'}
                              </button>
                           ))}
                        </div>
                     </div>
                     <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                     >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Add Record
                     </button>
                  </form>
               </div>
            )}

            {/* List */}
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px] ${readOnly ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                  <h3 className="font-bold text-slate-700">Today's Collections</h3>
                  <div className="flex gap-2">
                     <button onClick={copyForWhatsapp} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors" title="Copy for WhatsApp">
                        <Copy size={16} />
                     </button>
                     <button onClick={downloadImage} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 transition-colors" title="Download Image">
                        <Download size={16} />
                     </button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {records.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Wallet size={48} className="mb-4 opacity-20" />
                        <p>No cash records for this date.</p>
                     </div>
                  ) : (
                     <div className="space-y-2">
                        {records.map(record => (
                           <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                                    record.resendStatus === 'No' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                 }`}>
                                    {record.courierName.substring(0, 2).toUpperCase()}
                                 </div>
                                 <div>
                                    <div className="font-bold text-slate-800">{record.courierName}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                       <span>E-Com: {record.ecomCash.toLocaleString()}</span>
                                       {record.resendStatus === 'Yes' && (
                                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">RESEND</span>
                                       )}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="text-right">
                                    <div className="font-bold text-emerald-700">{record.receivedCash.toLocaleString()}</div>
                                    <div className={`text-xs font-bold ${record.receivedCash - record.ecomCash < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                       {record.receivedCash - record.ecomCash === 0 ? 'Balanced' : (record.receivedCash - record.ecomCash)}
                                    </div>
                                 </div>
                                 {!readOnly && (
                                    <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                       <Trash2 size={16} />
                                    </button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
      ) : (
         <CashDenominationCounter targetAmount={metrics.totalReceived} />
      )}
    </div>
  );
};

// --- Sub-Component: Cash Counter ---
const CashDenominationCounter = ({ targetAmount }: { targetAmount: number }) => {
   const [counts, setCounts] = useState<{[key: number]: string}>({
      5000: '', 1000: '', 500: '', 100: '', 50: '', 20: '', 10: '' // using strings for input handling
   });
   const [coins, setCoins] = useState('');

   const denominations = [5000, 1000, 500, 100, 50, 20, 10];

   const total = useMemo(() => {
      let sum = Number(coins) || 0;
      denominations.forEach(d => {
         sum += (Number(counts[d]) || 0) * d;
      });
      return sum;
   }, [counts, coins]);

   const handleCountChange = (denom: number, val: string) => {
      setCounts(prev => ({ ...prev, [denom]: val }));
   };

   const reset = () => {
      setCounts({ 5000: '', 1000: '', 500: '', 100: '', 50: '', 20: '', 10: '' });
      setCoins('');
   };

   return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
               <Coins className="text-blue-600" /> Physical Cash Counter
            </h3>
            <button onClick={reset} className="text-sm font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors">
               <RotateCcw size={14} /> Reset
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
               {denominations.map(d => (
                  <div key={d} className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                     <div className="w-20 font-bold text-slate-500 text-right">{d} x</div>
                     <input 
                        type="number" 
                        value={counts[d]}
                        onChange={e => handleCountChange(d, e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-center font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0"
                     />
                     <div className="w-24 text-right font-mono text-slate-400 text-sm">
                        = {((Number(counts[d]) || 0) * d).toLocaleString()}
                     </div>
                  </div>
               ))}
               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="w-20 font-bold text-slate-500 text-right">Coins</div>
                  <input 
                     type="number" 
                     value={coins}
                     onChange={e => setCoins(e.target.value)}
                     className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-center font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                     placeholder="Total Value"
                  />
                  <div className="w-24 text-right font-mono text-slate-400 text-sm">
                     = {Number(coins).toLocaleString()}
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col justify-center text-center">
               <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Total Physical Cash</div>
               <div className="text-5xl font-black mb-8">{total.toLocaleString()}</div>
               
               <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center text-sm mb-2">
                     <span className="text-slate-300">System Recorded Total</span>
                     <span className="font-bold">{targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t border-white/20 pt-2">
                     <span>Variance</span>
                     <span className={`${total - targetAmount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {total - targetAmount > 0 ? '+' : ''}{(total - targetAmount).toLocaleString()}
                     </span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};