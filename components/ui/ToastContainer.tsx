import React, { useState, useEffect } from 'react';
import { toast } from '../../services/toast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = toast.onChange((newToast) => {
      setToasts((prev) => [...prev, newToast]);
      // Auto dismiss
      setTimeout(() => {
        removeToast(newToast.id);
      }, 4000);
    });
    return unsubscribe;
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div 
          key={t.id}
          className={`pointer-events-auto min-w-[300px] max-w-sm rounded-2xl shadow-2xl p-4 flex items-center gap-3 transform transition-all animate-in slide-in-from-right-10 fade-in duration-300 ${
            t.type === 'success' ? 'bg-white border-l-4 border-emerald-500 text-slate-800' :
            t.type === 'error' ? 'bg-white border-l-4 border-rose-500 text-slate-800' :
            'bg-white border-l-4 border-blue-500 text-slate-800'
          }`}
        >
          <div className={`p-2 rounded-full ${
            t.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
            t.type === 'error' ? 'bg-rose-100 text-rose-600' :
            'bg-blue-100 text-blue-600'
          }`}>
             {t.type === 'success' && <CheckCircle2 size={20} />}
             {t.type === 'error' && <AlertCircle size={20} />}
             {t.type === 'info' && <Info size={20} />}
          </div>
          <div className="flex-1">
             <h4 className="font-bold text-sm capitalize">{t.type}</h4>
             <p className="text-xs text-slate-500 font-medium">{t.message}</p>
          </div>
          <button onClick={() => removeToast(t.id)} className="text-slate-300 hover:text-slate-500">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};