import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, 
  Settings, 
  Send, 
  Download, 
  Loader2, 
  ClipboardPaste,
  Truck,
  History,
  Calendar,
  Trash2,
  ChevronRight,
  FileText,
  ArrowDown,
  X,
  Plus,
  Search
} from 'lucide-react';
import { fetchDispatchTargets, saveDispatchReport, fetchDispatchHistory, deleteDispatchHistoryEntry } from '../services/db';
import { parseDispatchText } from '../services/geminiService';
import { DispatchItem, DispatchTarget, DispatchReport } from '../types';
import { toast } from '../services/toast';
import { DispatchReportCard } from './DispatchReportCard';
import { DispatchTargetManager } from './DispatchTargetManager';
import html2canvas from 'html2canvas';

interface DispatchProcessorProps {
  rmName?: string; // Optional RM name for the report header
}

export const DispatchProcessor: React.FC<DispatchProcessorProps> = ({ rmName }) => {
  // Input State
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [targets, setTargets] = useState<DispatchTarget[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Report State
  const [reportItems, setReportItems] = useState<DispatchItem[]>([]);
  
  // History State
  const [history, setHistory] = useState<DispatchReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const [isTargetsOpen, setIsTargetsOpen] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTargets();
    loadHistory(); // Always load history on mount now
  }, []);

  // Reload targets if manager closes
  useEffect(() => {
    if (!isTargetsOpen) loadTargets();
  }, [isTargetsOpen]);

  const loadTargets = async () => {
    try {
      const data = await fetchDispatchTargets();
      setTargets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchDispatchHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
      // toast.error("Failed to load history"); // Silent fail on init
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleProcess = async () => {
    if (!text.trim()) {
      toast.error("Please paste text first");
      return;
    }
    if (targets.length === 0) {
      toast.error("No branch targets defined. Please set targets first.");
      return;
    }

    setProcessing(true);
    try {
      // 1. AI Parse
      const parsedData = await parseDispatchText(text, targets);
      
      // 2. Map & Calculate
      const items: DispatchItem[] = parsedData.map((p: any) => {
         const t = targets.find(tg => tg.branch_name.toLowerCase() === p.branch.toLowerCase());
         const targetVal = t ? t.target : 0;
         const percentage = targetVal > 0 ? (p.dispatch / targetVal) * 100 : 0;
         
         let status: 'excellent' | 'good' | 'poor' = 'poor';
         if (percentage >= 100) status = 'excellent';
         else if (percentage >= 70) status = 'good';

         return {
            branch: t ? t.branch_name : p.branch, // Prefer configured name
            target: targetVal,
            dispatch: p.dispatch,
            percentage,
            status
         };
      });

      // 3. Sort by % desc
      items.sort((a, b) => b.percentage - a.percentage);
      
      setReportItems(items);
      toast.success("Data processed successfully!");
      setIsInputOpen(false); // Close modal
      
      // Auto-scroll to preview on mobile
      if (window.innerWidth < 1024) {
         setTimeout(() => {
            previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }, 300);
      }

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (reportItems.length === 0) return;
    try {
      await saveDispatchReport(date, reportItems);
      toast.success("Report saved to history");
      loadHistory();
    } catch (e) {
      toast.error("Failed to save");
    }
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.download = `Dispatch_Report_${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Image downloaded");
    } catch (e) {
      toast.error("Export failed");
    }
  };

  const handleHistoryItemClick = (report: DispatchReport) => {
    setReportItems(report.items);
    setDate(report.date);
    toast.info(`Loaded report for ${report.date}`);
    if (window.innerWidth < 1024) {
       setTimeout(() => {
          previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 300);
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this saved report?")) return;
    try {
      await deleteDispatchHistoryEntry(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success("Report deleted");
      if (history.find(h => h.id === id)?.date === date) {
         setReportItems([]);
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filteredHistory = history.filter(h => h.date.includes(historySearch));

  return (
    <div className="h-full flex flex-col space-y-4 md:space-y-6">
      <DispatchTargetManager isOpen={isTargetsOpen} onClose={() => setIsTargetsOpen(false)} />

      {/* Input Modal */}
      {isInputOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative border border-slate-200">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                       <FileText className="text-blue-600" /> New Dispatch Report
                    </h3>
                    <p className="text-xs text-slate-500">Enter details below to generate report.</p>
                 </div>
                 <button onClick={() => setIsInputOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50">
                 {/* Step 1: Date */}
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                     <div className="flex items-center gap-3 mb-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm">1</div>
                         <label className="font-bold text-slate-700 text-sm">Report Date</label>
                     </div>
                     <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input 
                             type="date" 
                             value={date}
                             onChange={e => setDate(e.target.value)}
                             className="w-full bg-slate-50 border-0 rounded-xl pl-12 pr-4 py-3 text-sm font-semibold text-slate-700 focus:bg-blue-50/30 focus:text-blue-700 outline-none transition-all cursor-pointer"
                         />
                     </div>
                 </div>

                 {/* Step 2: Paste Data */}
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all flex flex-col h-[600px]">
                     <div className="flex justify-between items-start mb-3 shrink-0">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm">2</div>
                             <label className="font-bold text-slate-700 text-sm">Paste Data</label>
                         </div>
                         <button 
                             onClick={() => setText('')} 
                             disabled={!text}
                             className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 px-3 py-1.5 rounded bg-slate-100 hover:bg-rose-50 disabled:opacity-50"
                         >
                             <Trash2 size={12} /> Clear
                         </button>
                     </div>
                     
                     <div className="flex-1 relative">
                         <textarea 
                             value={text}
                             onChange={e => setText(e.target.value)}
                             placeholder="Paste your WhatsApp message here...&#10;&#10;Example:&#10;Embilipitiya 250&#10;Godakawela 100&#10;Kahawatta 150..."
                             className="w-full h-full bg-slate-50 border-0 rounded-xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:bg-indigo-50/30 focus:text-indigo-900 outline-none resize-none transition-all leading-relaxed custom-scrollbar"
                         />
                     </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                 <button 
                     onClick={handleProcess}
                     disabled={processing}
                     className="w-full py-3.5 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                 >
                     {processing ? (
                         <>
                             <Loader2 className="animate-spin" size={20} /> Processing...
                         </>
                     ) : (
                         <>
                             <Wand2 size={20} className="text-purple-400 group-hover:text-white transition-colors" /> Generate Analysis
                         </>
                     )}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-none bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
         <div className="text-center sm:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-2">
               <Truck className="text-blue-600" /> Auto-Dispatch Pro
            </h2>
            <p className="text-slate-500 text-xs md:text-sm">AI-powered dispatch analytics system.</p>
         </div>
         <button 
            onClick={() => setIsTargetsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors w-full sm:w-auto justify-center"
         >
            <Settings size={16} /> Manage Targets
         </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-[600px]">
         
         {/* Left Column (History List) */}
         <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full order-2 lg:order-1 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="font-bold text-slate-700 flex items-center gap-2">
                   <History size={18} /> History
                </div>
                <button 
                   onClick={() => {
                      setText('');
                      setIsInputOpen(true);
                   }}
                   className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 shadow-md shadow-slate-200"
                >
                   <Plus size={14} /> New Entry
                </button>
            </div>
            
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                     type="text" 
                     placeholder="Search date..." 
                     value={historySearch}
                     onChange={e => setHistorySearch(e.target.value)}
                     className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50">
               {loadingHistory ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
               ) : filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                     <History size={32} className="opacity-20 mb-2" />
                     <p className="text-sm">No reports found.</p>
                     <button onClick={() => setIsInputOpen(true)} className="text-xs text-blue-600 font-bold mt-2 hover:underline">Create First Report</button>
                  </div>
               ) : (
                  filteredHistory.map(item => (
                     <div 
                        key={item.id}
                        onClick={() => handleHistoryItemClick(item)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center group touch-manipulation ${item.date === date ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'}`}
                     >
                        <div>
                           <div className="flex items-center gap-2 font-bold text-slate-700">
                              <Calendar size={14} className="text-blue-500" /> {item.date}
                           </div>
                           <div className="text-xs text-slate-400 mt-1">
                              {item.items.length} branches tracked
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                              onClick={(e) => handleDeleteHistory(e, item.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                           >
                              <Trash2 size={16} />
                           </button>
                           <ChevronRight size={16} className="text-slate-300" />
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>

         {/* Preview Section (Right Column) */}
         <div ref={previewRef} className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden relative h-full min-h-[400px] order-1 lg:order-2 scroll-mt-24">
            <div className="absolute top-4 right-4 z-20 flex gap-2">
               {reportItems.length > 0 && (
                  <>
                     <button onClick={handleSave} className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:scale-105 transition-transform border border-emerald-100" title="Save to History">
                        <Send size={20} />
                     </button>
                     <button onClick={handleDownload} className="p-2 bg-white text-blue-600 rounded-lg shadow-sm hover:scale-105 transition-transform border border-blue-100" title="Download Image">
                        <Download size={20} />
                     </button>
                  </>
               )}
            </div>

            <div className="flex-1 overflow-auto bg-slate-100/50 relative">
               {reportItems.length > 0 ? (
                  <>
                     {/* MOBILE VIEW */}
                     <div className="md:hidden p-4 space-y-3 pb-20">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 sticky top-0 z-10">
                           <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
                              {date} <span className="text-[10px] font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Preview</span>
                           </h3>
                           <p className="text-xs text-slate-500">
                              {reportItems.length} branches processed.
                           </p>
                        </div>
                        {reportItems.map((item, i) => (
                           <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                              <div>
                                 <div className="font-bold text-slate-700">{item.branch}</div>
                                 <div className="text-xs text-slate-400 mt-1">
                                    Target: <span className="font-mono text-slate-600">{item.target}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-xl font-black text-slate-800">{item.dispatch}</div>
                                 <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                                    item.percentage >= 100 ? 'bg-emerald-100 text-emerald-700' :
                                    item.percentage >= 70 ? 'bg-amber-100 text-amber-700' :
                                    'bg-rose-100 text-rose-700'
                                 }`}>
                                    {Math.round(item.percentage)}%
                                 </div>
                              </div>
                           </div>
                        ))}
                        <div className="text-center text-xs text-slate-400 pt-4 pb-8">
                           Use Download button (top right) to generate full report image.
                        </div>
                     </div>

                     {/* DESKTOP VIEW */}
                     <div className="hidden md:flex justify-center p-8 h-full items-start">
                        <div className="transform scale-[0.65] lg:scale-[0.85] origin-top">
                           <DispatchReportCard 
                              ref={reportRef} 
                              date={date} 
                              items={reportItems} 
                              rmName={rmName}
                           />
                        </div>
                     </div>

                     {/* Hidden Card for Mobile Export */}
                     <div className="md:hidden absolute top-0 left-0 w-full overflow-hidden h-0 opacity-0 pointer-events-none">
                        <div style={{ width: '800px' }}>
                           <DispatchReportCard 
                              ref={reportRef} 
                              date={date} 
                              items={reportItems} 
                              rmName={rmName}
                           />
                        </div>
                     </div>
                  </>
               ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 h-full p-8 text-center bg-slate-50/50">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                          <ClipboardPaste size={32} className="text-slate-300" />
                      </div>
                      <h3 className="font-bold text-slate-600 text-lg mb-2">Ready for Input</h3>
                      <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
                          Click "New Entry" to add data or select a report from the history.
                      </p>
                      
                      {/* Mobile Hint */}
                      <div className="md:hidden flex flex-col items-center animate-pulse text-blue-400/70">
                         <span className="text-xs mb-1">Scroll up for History</span>
                         <ArrowDown size={16} className="rotate-180" />
                      </div>
                  </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
};