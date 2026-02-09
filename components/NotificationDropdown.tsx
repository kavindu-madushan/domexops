import React, { useEffect, useState } from 'react';
import { fetchActiveNotices } from '../services/db';
import { Notice } from '../types';
import { Bell, X, CheckCircle2, Clock, Megaphone, Loader2 } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotices();
    }
  }, [isOpen]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await fetchActiveNotices();
      setNotices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose}></div>
      <div className="absolute top-16 right-4 md:right-8 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Bell size={16} className="text-blue-600" /> Notifications
           </h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
           </button>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
           {loading ? (
              <div className="flex justify-center items-center py-8 text-slate-400">
                 <Loader2 className="animate-spin" size={24} />
              </div>
           ) : notices.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                 <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} className="opacity-50" />
                 </div>
                 <p className="text-sm font-medium">No new notifications</p>
                 <p className="text-xs mt-1">You're all caught up!</p>
              </div>
           ) : (
              <div className="divide-y divide-slate-50">
                 {notices.map((notice) => (
                    <div key={notice.id} className="p-4 hover:bg-slate-50 transition-colors">
                       <div className="flex gap-3">
                          <div className="flex-none mt-1">
                             <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Megaphone size={14} />
                             </div>
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-bold text-slate-800 mb-0.5">{notice.title}</h4>
                             <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-2">
                                {notice.message}
                             </p>
                             <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <Clock size={10} />
                                <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>Admin Announcement</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
        
        <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
           <button onClick={onClose} className="text-xs font-bold text-blue-600 hover:text-blue-700 py-1">
              Close Panel
           </button>
        </div>
      </div>
    </>
  );
};