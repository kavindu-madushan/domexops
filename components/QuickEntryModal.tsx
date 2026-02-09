import React, { useState, useEffect, useRef } from 'react';
import { ReportRow } from '../types';
import { X, Save, ArrowRight, Calendar, ShoppingBag, Truck, AlertTriangle, Percent } from 'lucide-react';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (row: ReportRow) => void;
  existingRows: ReportRow[];
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({ isOpen, onClose, onSave, existingRows }) => {
  const getTodayISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatToDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    const dayPart = String(date.getDate()).padStart(2, '0');
    const monthPart = date.toLocaleString('default', { month: 'short' });
    return `${dayPart}-${monthPart}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [formData, setFormData] = useState<Partial<ReportRow>>({});
  const [isEditing, setIsEditing] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const today = getTodayISO();
      setSelectedDate(today);
      loadDataForDate(today);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadDataForDate(selectedDate);
    }
  }, [selectedDate, isOpen]);

  const loadDataForDate = (isoDate: string) => {
    const displayDate = formatToDisplayDate(isoDate);
    const existingRow = existingRows.find(row => row.date === displayDate);

    if (existingRow) {
      setFormData({ ...existingRow });
      setIsEditing(true);
    } else {
      setFormData({
        id: Date.now().toString(),
        date: displayDate,
        todayInward: 0,
        pendingChecking: 0,
        missedRoute: 0,
        todayRtnToSender: 0,
        todayBranchHold: 0,
        temuReschedule: 0,
        deliveryPercentage: 0,
        yesterdayDispatch: 0,
        eveningMissedRoute: 0,
        // Defaults for legacy hidden fields
        yesterdayResend: 0,
        yesterdayBranchHold: 0,
        todayTemuInward: 0,
        yesterdayTemuHold: 0,
        todayTotalParcel: 0,
        yesterdayOnRoute: 0,
        yesterdayDelivered: 0
      });
      setIsEditing(false);
    }
  };

  const handleChange = (field: keyof ReportRow, value: string | number) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
  };

  const handleSubmit = (addAnother: boolean) => {
    const newRow: ReportRow = {
      id: formData.id || Date.now().toString(),
      date: formatToDisplayDate(selectedDate),
      
      // Core 10 Fields
      todayInward: Number(formData.todayInward || 0),
      pendingChecking: Number(formData.pendingChecking || 0),
      missedRoute: Number(formData.missedRoute || 0),
      todayRtnToSender: Number(formData.todayRtnToSender || 0),
      todayBranchHold: Number(formData.todayBranchHold || 0),
      temuReschedule: Number(formData.temuReschedule || 0),
      deliveryPercentage: Number(formData.deliveryPercentage || 0),
      yesterdayDispatch: Number(formData.yesterdayDispatch || 0),
      eveningMissedRoute: Number(formData.eveningMissedRoute || 0),

      // Hidden/Legacy fields required by DB schema constraints
      yesterdayDelivered: 0, // Direct percentage entry means we don't track raw delivered count here
      yesterdayOnRoute: 0,
      yesterdayResend: 0, 
      yesterdayBranchHold: 0, 
      todayTemuInward: 0, 
      yesterdayTemuHold: 0, 
      todayTotalParcel: Number(formData.todayInward || 0) 
    };

    onSave(newRow);

    if (addAnother) {
      const dateObj = new Date(selectedDate);
      dateObj.setDate(dateObj.getDate() + 1);
      if (dateObj.getDay() === 0) dateObj.setDate(dateObj.getDate() + 1);
      setSelectedDate(dateObj.toISOString().split('T')[0]);
      if (firstInputRef.current) firstInputRef.current.focus();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full border-0 bg-slate-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-medium";
  const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 ml-1";
  const sectionClass = "bg-white p-5 rounded-xl border border-slate-100 shadow-sm mb-4";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-3xl md:rounded-2xl shadow-2xl overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
             <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Record' : 'New Daily Record'}</h2>
             <p className="text-slate-500 text-xs mt-0.5">Fill in the 10-point daily metrics.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
        </div>

        {/* Content */}
        <div className="p-6 bg-slate-50/50 flex-1 overflow-y-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* 1. Date & Inward */}
             <div className={sectionClass}>
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">1</div>
                   <h3 className="text-slate-700 font-bold text-sm">Inward Flow</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={inputClass} />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                         <label className={labelClass}>Inward</label>
                         <input ref={firstInputRef} type="number" value={formData.todayInward} onChange={e => handleChange('todayInward', Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                         <label className={labelClass}>Pending Checking</label>
                         <input type="number" value={formData.pendingChecking} onChange={e => handleChange('pendingChecking', Number(e.target.value))} className={`${inputClass} bg-orange-50 focus:bg-white`} />
                      </div>
                   </div>
                </div>
             </div>

             {/* 2. Route & Delivery */}
             <div className={sectionClass}>
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">2</div>
                   <h3 className="text-slate-700 font-bold text-sm">Route Status</h3>
                </div>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                         <label className={labelClass}>Missed Route</label>
                         <input type="number" value={formData.missedRoute} onChange={e => handleChange('missedRoute', Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                         <label className={labelClass}>Return to Sender</label>
                         <input type="number" value={formData.todayRtnToSender} onChange={e => handleChange('todayRtnToSender', Number(e.target.value))} className={`${inputClass} text-rose-600`} />
                      </div>
                   </div>
                   <div>
                      <label className={labelClass}>Evening Missed Route</label>
                      <input type="number" value={formData.eveningMissedRoute} onChange={e => handleChange('eveningMissedRoute', Number(e.target.value))} className={inputClass} />
                   </div>
                </div>
             </div>

             {/* 3. Holds & Temu */}
             <div className={sectionClass}>
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">3</div>
                   <h3 className="text-slate-700 font-bold text-sm">Holds & Special</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <label className={labelClass}>Branch Hold</label>
                      <input type="number" value={formData.todayBranchHold} onChange={e => handleChange('todayBranchHold', Number(e.target.value))} className={inputClass} />
                   </div>
                   <div>
                      <label className={labelClass}>Temu Reschedule</label>
                      <input type="number" value={formData.temuReschedule} onChange={e => handleChange('temuReschedule', Number(e.target.value))} className={`${inputClass} bg-purple-50 focus:bg-white`} />
                   </div>
                </div>
             </div>

             {/* 4. Performance & Dispatch */}
             <div className={sectionClass}>
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">4</div>
                   <h3 className="text-slate-700 font-bold text-sm">Final Metrics</h3>
                </div>
                <div className="space-y-4">
                   
                   <div>
                      <label className={labelClass}>Delivery Percentage</label>
                      <div className="relative">
                         <input 
                           type="number" 
                           value={formData.deliveryPercentage} 
                           onChange={e => handleChange('deliveryPercentage', Number(e.target.value))}
                           className={`${inputClass} font-bold text-indigo-700 bg-indigo-50 focus:bg-white pr-10`} 
                           placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 text-sm font-bold">
                           <Percent size={16} />
                        </span>
                      </div>
                   </div>
                   
                   <div>
                      <label className={labelClass}>Dispatch</label>
                      <input type="number" value={formData.yesterdayDispatch} onChange={e => handleChange('yesterdayDispatch', Number(e.target.value))} className={`${inputClass} bg-blue-50 border-blue-100 focus:bg-white`} />
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
          <button onClick={() => handleSubmit(true)} className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 flex items-center gap-2">Next <ArrowRight size={16} /></button>
          <button onClick={() => handleSubmit(false)} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center gap-2"><Save size={18} /> Save</button>
        </div>
      </div>
    </div>
  );
};