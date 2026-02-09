import React, { useEffect, useState } from 'react';
import { fetchActiveNotices } from '../services/db';
import { Notice } from '../types';
import { X, Megaphone, CheckCircle2 } from 'lucide-react';

export const NoticePopup: React.FC = () => {
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkNotices();
  }, []);

  const checkNotices = async () => {
    const notices = await fetchActiveNotices();
    
    // Find the most recent active notice that hasn't been dismissed
    const relevantNotice = notices.find(n => {
       const dismissedKey = `logipro_notice_dismissed_${n.id}`;
       return !localStorage.getItem(dismissedKey);
    });

    if (relevantNotice) {
      setActiveNotice(relevantNotice);
      // Small delay for better UX (let app load first)
      setTimeout(() => setIsOpen(true), 1000);
    }
  };

  const handleDismiss = () => {
    if (activeNotice) {
      setIsOpen(false);
      // Mark as read in local storage
      localStorage.setItem(`logipro_notice_dismissed_${activeNotice.id}`, 'true');
      
      // Clear state after animation
      setTimeout(() => setActiveNotice(null), 300);
    }
  };

  if (!activeNotice) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'bg-slate-900/60 backdrop-blur-sm opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
      
      <div className={`bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}>
         
         {/* Decorative Header */}
         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full mix-blend-overlay filter blur-xl transform translate-x-10 -translate-y-10"></div>
            <div className="flex items-center gap-3 relative z-10">
               <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                  <Megaphone size={24} className="text-white" />
               </div>
               <div>
                  <h3 className="font-bold text-lg leading-tight">New Announcement</h3>
                  <p className="text-blue-100 text-xs font-medium">From Admin</p>
               </div>
            </div>
         </div>

         <div className="p-6">
            <h2 className="text-xl font-black text-slate-800 mb-3 leading-tight">
               {activeNotice.title}
            </h2>
            <div className="prose prose-sm prose-slate text-slate-600 mb-6 max-h-60 overflow-y-auto">
               <p className="whitespace-pre-wrap">{activeNotice.message}</p>
            </div>

            <button 
               onClick={handleDismiss}
               className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
               <CheckCircle2 size={18} />
               Got it, thanks!
            </button>
         </div>
      </div>
    </div>
  );
};
