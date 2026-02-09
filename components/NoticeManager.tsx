import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Send, 
  Trash2, 
  Users, 
  Globe, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Database
} from 'lucide-react';
import { createNotice, fetchAdminNotices, deleteNotice, getAllBranches } from '../services/db';
import { toast } from '../services/toast';
import { Notice } from '../types';

interface NoticeManagerProps {
  onSetupRequired?: () => void;
}

export const NoticeManager: React.FC<NoticeManagerProps> = ({ onSetupRequired }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [branches, setBranches] = useState<{user_id: string, branchName: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetId, setTargetId] = useState<string>('all'); // 'all' or user_id

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nData, bData] = await Promise.all([
        fetchAdminNotices(),
        getAllBranches()
      ]);
      setNotices(nData);
      setBranches(bData.filter(b => b.branchName.toLowerCase() !== 'admin' && b.branchName.toLowerCase() !== 'super admin'));
      setNeedsSetup(false);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'PGRST205' || e.code === '42P01') {
        setNeedsSetup(true);
      } else {
        toast.error("Failed to load notices");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    try {
      // Convert 'all' to null for DB
      const dbTarget = targetId === 'all' ? null : targetId;
      await createNotice(title, message, dbTarget);
      toast.success("Notice published successfully");
      
      // Reset Form
      setTitle('');
      setMessage('');
      setTargetId('all');
      
      // Reload list
      const nData = await fetchAdminNotices();
      setNotices(nData);
    } catch (e: any) {
      if (e.code === 'PGRST205' || e.code === '42P01') {
         setNeedsSetup(true);
      } else {
         toast.error("Failed to publish notice");
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this notice? Users will no longer see it.")) return;
    try {
      await deleteNotice(id);
      setNotices(prev => prev.filter(n => n.id !== id));
      toast.success("Notice deleted");
    } catch (e) {
      toast.error("Failed to delete notice");
    }
  };

  const getTargetName = (tid: string | null) => {
    if (!tid) return 'All Branches';
    const b = branches.find(br => br.user_id === tid);
    return b ? b.branchName : 'Unknown Branch';
  };

  if (needsSetup) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
         <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-2">
            <Database size={40} />
         </div>
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Database Setup Required</h2>
            <p className="text-slate-500 max-w-md mx-auto mt-2">
               The "Notices" feature requires a new database table that hasn't been created yet.
            </p>
         </div>
         {onSetupRequired ? (
           <button 
             onClick={onSetupRequired}
             className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
           >
             Run Database Setup Script
           </button>
         ) : (
           <div className="p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
              Please contact the Super Admin to run the database setup script.
           </div>
         )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden">
       {/* Header */}
       <div className="flex-none bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
         <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
           <Megaphone className="text-blue-600" /> Notice Board
         </h2>
         <p className="text-slate-500 text-sm">Send important announcements to branch dashboards.</p>
       </div>

       <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-y-auto">
             <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
               <Send size={18} /> Compose New Notice
             </h3>
             
             <form onSubmit={handleCreate} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Target Audience</label>
                   <select 
                     value={targetId}
                     onChange={(e) => setTargetId(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                   >
                      <option value="all">📢 All Branches</option>
                      <option disabled>──────────</option>
                      {branches.map(b => (
                        <option key={b.user_id} value={b.user_id}>🏢 {b.branchName}</option>
                      ))}
                   </select>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Title</label>
                   <input 
                     type="text" 
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="e.g. System Maintenance Update"
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                     required
                   />
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Message</label>
                   <textarea 
                     value={message}
                     onChange={(e) => setMessage(e.target.value)}
                     placeholder="Type your announcement here..."
                     className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                     required
                   />
                </div>

                <div className="pt-2">
                   <button 
                     type="submit"
                     disabled={sending}
                     className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                   >
                      {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      Publish Notice
                   </button>
                   <p className="text-[10px] text-slate-400 text-center mt-3">
                      Notices appear as a popup on the user's dashboard.
                   </p>
                </div>
             </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
             <h3 className="font-bold text-slate-700 mb-4">Active History</h3>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {loading ? (
                   <div className="flex justify-center items-center h-40">
                      <Loader2 className="animate-spin text-slate-300" size={32} />
                   </div>
                ) : notices.length === 0 ? (
                   <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                      <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-slate-400 font-medium">No notices published yet.</p>
                   </div>
                ) : (
                   notices.map(notice => (
                      <div key={notice.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-slate-50 group">
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${!notice.target_branch_id ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {!notice.target_branch_id ? <Globe size={10} /> : <Users size={10} />}
                                  {getTargetName(notice.target_branch_id)}
                               </span>
                               <span className="text-[10px] text-slate-400">
                                  {new Date(notice.created_at).toLocaleDateString()}
                               </span>
                            </div>
                            <button 
                               onClick={() => handleDelete(notice.id)}
                               className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                         <h4 className="font-bold text-slate-800 mb-1">{notice.title}</h4>
                         <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{notice.message}</p>
                      </div>
                   ))
                )}
             </div>
          </div>

       </div>
    </div>
  );
};