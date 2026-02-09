import React, { useState, useRef, useMemo } from 'react';
import { ReportRow } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  Download, 
  FileSpreadsheet, 
  ImageDown, 
  Loader2, 
  Copy, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  AlignJustify,
  AlignLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { QuickEntryModal } from './QuickEntryModal';
import { DailyReportTemplate } from './DailyReportTemplate';
import html2canvas from 'html2canvas';
import { toast } from '../services/toast';

interface OperationTableProps {
  rows: ReportRow[];
  branchName: string;
  onSaveRow: (row: ReportRow) => Promise<void>;
  onDeleteRow: (id: string) => Promise<void>;
  loading?: boolean;
  readOnly?: boolean;
}

type SortField = 'date' | 'todayInward' | 'deliveryPercentage';
type SortOrder = 'asc' | 'desc';

export const OperationTable: React.FC<OperationTableProps> = ({ rows, branchName, onSaveRow, onDeleteRow, loading = false, readOnly = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Advanced Table States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isCompact, setIsCompact] = useState(false);
  
  // State for PNG Export
  const [exportRow, setExportRow] = useState<ReportRow | null>(null);
  const templateRef = useRef<HTMLDivElement>(null);

  // 1. Filter
  const filteredRows = useMemo(() => {
    return rows.filter(row => 
      row.date.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rows, searchTerm]);

  // 2. Sort
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Custom date parsing for "DD-Mon" format
      if (sortField === 'date') {
        valA = new Date(a.date).getTime() || 0; // Fallback if parsing fails
        valB = new Date(b.date).getTime() || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortField, sortOrder]);

  // 3. Paginate
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleModalSave = async (savedRow: ReportRow) => {
    setActionLoading('new');
    try {
      await onSaveRow(savedRow);
    } catch (e) {
      // Toast handled in App
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    if (window.confirm('Are you sure you want to delete this record?')) {
      setActionLoading(id);
      try {
        await onDeleteRow(id);
      } catch (e) {
        // Toast handled in App
      } finally {
        setActionLoading(null);
      }
    }
  };

  const copyRowData = (row: ReportRow) => {
    const text = `Date: ${row.date} | Inward: ${row.todayInward} | Hold: ${row.todayBranchHold} | Success: ${row.deliveryPercentage}% | Dispatch: ${row.yesterdayDispatch}`;
    navigator.clipboard.writeText(text);
    toast.info("Row summary copied to clipboard");
  };

  const exportToCSV = () => {
    const headers = [
      "Date", "Inward", "Pending Checking", "Missed Route", 
      "Return to Sender", "Hold", "Temu Reschedule", 
      "Delivery %", "Dispatch", "Evening Missed Route"
    ];
    
    const csvContent = [
      headers.join(','),
      ...sortedRows.map(row => [
        row.date, 
        row.todayInward, 
        row.pendingChecking || 0,
        row.missedRoute || 0,
        row.todayRtnToSender, 
        row.todayBranchHold, 
        row.temuReschedule || 0,
        `${row.deliveryPercentage}%`, 
        row.yesterdayDispatch,
        row.eveningMissedRoute || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `operation_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("CSV Exported");
  };

  const handleDownloadImage = async (row: ReportRow) => {
    setExportRow(row);
    // Wait for state update and render
    setTimeout(async () => {
      if (templateRef.current) {
        try {
          const canvas = await html2canvas(templateRef.current, {
            scale: 3, 
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false
          });
          
          const link = document.createElement('a');
          const dateStr = row.date.replace(/[\/\\]/g, '-');
          link.download = `Daily_Report_${dateStr}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          toast.success("Image Downloaded");
        } catch (err) {
          console.error("Export failed", err);
          toast.error("Failed to generate image");
        } finally {
          setExportRow(null);
        }
      }
    }, 150);
  };

  const getPercentageColor = (val: number) => {
    if (val >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={`ml-1 inline-block transition-opacity ${sortField === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
       <ArrowUpDown size={12} />
    </span>
  );

  return (
    <div className="w-full space-y-4 relative">
      
      <div style={{ position: 'absolute', zIndex: -50, opacity: 0, pointerEvents: 'none', top: 0, left: 0 }}>
        <DailyReportTemplate ref={templateRef} row={exportRow} branchName={branchName} />
      </div>

      <QuickEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleModalSave}
        existingRows={rows}
      />

      {/* Modern Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-3 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-20">
        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by date..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100 text-slate-700 outline-none transition-all text-sm"
            />
          </div>
          
          <button 
            onClick={() => setIsCompact(!isCompact)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors hidden sm:block"
          >
             {isCompact ? <AlignJustify size={20} /> : <AlignLeft size={20} />}
          </button>
        </div>
        
        <div className="flex gap-2 w-full xl:w-auto">
          <button 
            onClick={exportToCSV}
            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">CSV</span>
          </button>
          {!readOnly && (
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={actionLoading === 'new'}
              className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all hover:scale-[1.02] text-sm"
            >
              {actionLoading === 'new' ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} 
              New Entry
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card View (List) */}
      <div className="md:hidden space-y-3">
         {paginatedRows.length > 0 ? (
            paginatedRows.map((row) => (
               <MobileRowCard 
                  key={row.id} 
                  row={row} 
                  onDelete={handleDelete}
                  onCopy={copyRowData}
                  onDownload={handleDownloadImage}
                  actionLoading={actionLoading}
                  getPercentageColor={getPercentageColor}
                  readOnly={readOnly}
               />
            ))
         ) : (
            <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-100">
               <p>No records found.</p>
            </div>
         )}
      </div>

      {/* Desktop Table View - 10 Columns */}
      <div className="hidden md:flex bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative min-h-[400px] flex-col">
        {loading && (
           <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
             <Loader2 className="animate-spin text-blue-600" size={40} />
           </div>
        )}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 font-semibold sticky left-0 bg-slate-50 z-10 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.05)] text-slate-800 cursor-pointer" onClick={() => handleSort('date')}>
                   <div className="flex items-center">Date <SortIcon field="date" /></div>
                </th>
                <th className="px-4 py-4 font-medium text-slate-500">Inward</th>
                <th className="px-4 py-4 font-medium text-slate-500 text-orange-600">Pending Chk</th>
                <th className="px-4 py-4 font-medium text-slate-500">Missed Route</th>
                <th className="px-4 py-4 font-medium text-slate-500">RTS</th>
                <th className="px-4 py-4 font-medium text-slate-500">Hold</th>
                <th className="px-4 py-4 font-medium text-purple-600">Temu Resched</th>
                <th className="px-4 py-4 font-medium text-slate-500">Delivery %</th>
                <th className="px-4 py-4 font-medium text-slate-500">Dispatch</th>
                <th className="px-4 py-4 font-medium text-slate-500">Eve. Missed</th>
                <th className="px-4 py-4 text-center sticky right-0 bg-slate-50 z-10 shadow-[-4px_0_24px_-2px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} font-medium text-slate-800 sticky left-0 bg-white group-hover:bg-blue-50/30 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.05)]`}>
                      {row.date}
                    </td>
                    
                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} text-slate-700`}>{row.todayInward}</td>
                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} text-orange-600 font-bold bg-orange-50/30`}>{row.pendingChecking || 0}</td>
                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} text-slate-500`}>{row.missedRoute || 0}</td>
                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} text-rose-500`}>{row.todayRtnToSender}</td>
                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} text-slate-500`}>{row.todayBranchHold}</td>
                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} text-purple-600`}>{row.temuReschedule || 0}</td>
                    
                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'}`}>
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPercentageColor(row.deliveryPercentage)}`}>
                        {row.deliveryPercentage}%
                      </span>
                    </td>

                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} text-blue-600 font-bold`}>{row.yesterdayDispatch}</td>
                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} text-slate-400`}>{row.eveningMissedRoute || 0}</td>

                    <td className={`px-4 ${isCompact ? 'py-2' : 'py-4'} text-center sticky right-0 bg-white group-hover:bg-blue-50/30 shadow-[-4px_0_24px_-2px_rgba(0,0,0,0.05)]`}>
                      <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyRowData(row)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"><Copy size={16} /></button>
                        <button onClick={() => handleDownloadImage(row)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 bg-blue-50 rounded-md transition-colors shadow-sm"><ImageDown size={16} /></button>
                        {!readOnly && (
                          <button onClick={() => handleDelete(row.id)} disabled={actionLoading === row.id} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                            {actionLoading === row.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                !loading && (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <FileSpreadsheet size={32} className="opacity-20" />
                        <p>No records found matching "{searchTerm}"</p>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
        
      {sortedRows.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 rounded-b-xl sticky bottom-0 z-10 md:static">
           <div><span className="hidden sm:inline">Showing </span>{((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, sortedRows.length)} of {sortedRows.length}</div>
           <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm disabled:opacity-50"><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm disabled:opacity-50"><ChevronRight size={16} /></button>
           </div>
        </div>
      )}
    </div>
  );
};

const MobileRowCard = ({ row, onDelete, onCopy, onDownload, actionLoading, getPercentageColor, readOnly }: any) => {
   const [expanded, setExpanded] = useState(false);

   return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center gap-3">
               <div className="bg-blue-50 text-blue-700 font-bold px-3 py-2 rounded-lg text-sm text-center min-w-[50px]">
                  {row.date.split('-')[0]}
                  <div className="text-[10px] font-normal uppercase">{row.date.split('-')[1]}</div>
               </div>
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPercentageColor(row.deliveryPercentage)}`}>
                        {row.deliveryPercentage}%
                     </span>
                  </div>
                  <div className="text-xs text-slate-500">
                     Inward: <span className="font-bold text-slate-700">{row.todayInward}</span>
                  </div>
               </div>
            </div>
            <button className="text-slate-300">
               {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
         </div>

         {expanded && (
            <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
               <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  <div><span className="text-slate-400 block mb-1">Pending Chk</span><span className="font-bold text-orange-600">{row.pendingChecking || 0}</span></div>
                  <div><span className="text-slate-400 block mb-1">Missed Route</span><span className="font-bold text-slate-700">{row.missedRoute || 0}</span></div>
                  <div><span className="text-slate-400 block mb-1">RTS</span><span className="font-bold text-rose-500">{row.todayRtnToSender}</span></div>
                  <div><span className="text-slate-400 block mb-1">Hold</span><span className="font-bold text-slate-700">{row.todayBranchHold}</span></div>
                  <div><span className="text-slate-400 block mb-1">Temu Resched</span><span className="font-bold text-purple-600">{row.temuReschedule || 0}</span></div>
                  <div><span className="text-slate-400 block mb-1">Dispatch</span><span className="font-bold text-blue-600">{row.yesterdayDispatch}</span></div>
                  <div className="col-span-2"><span className="text-slate-400 block mb-1">Evening Missed</span><span className="font-bold text-slate-700">{row.eveningMissedRoute || 0}</span></div>
               </div>
               
               <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                  <button onClick={() => onCopy(row)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600"><Copy size={16} /></button>
                  <button onClick={() => onDownload(row)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600"><ImageDown size={16} /></button>
                  {!readOnly && (
                    <button onClick={() => onDelete(row.id)} disabled={actionLoading === row.id} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-rose-600">
                       {actionLoading === row.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};