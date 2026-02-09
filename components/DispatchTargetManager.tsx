import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Target
} from 'lucide-react';
import { fetchDispatchTargets, upsertDispatchTarget, deleteDispatchTarget } from '../services/db';
import { DispatchTarget } from '../types';
import { toast } from '../services/toast';

interface DispatchTargetManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchTargetManager: React.FC<DispatchTargetManagerProps> = ({ isOpen, onClose }) => {
  const [targets, setTargets] = useState<DispatchTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  
  // New Target Form
  const [newBranch, setNewBranch] = useState('');
  const [newTarget, setNewTarget] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTargets();
    }
  }, [isOpen]);

  const loadTargets = async () => {
    setLoading(true);
    try {
      const data = await fetchDispatchTargets();
      setTargets(data);
    } catch (e) {
      toast.error("Failed to load targets");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch || !newTarget) return;

    setAdding(true);
    try {
      await upsertDispatchTarget(newBranch, Number(newTarget));
      setNewBranch('');
      setNewTarget('');
      loadTargets();
      toast.success("Target saved");
    } catch (e) {
      toast.error("Failed to save target");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this target?")) return;
    try {
      await deleteDispatchTarget(id);
      setTargets(prev => prev.filter(t => t.id !== id));
      toast.success("Target removed");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Target size={18} className="text-blue-600" /> Manage Targets
           </h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-white">
           <form onSubmit={handleAdd} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Branch Name" 
                value={newBranch}
                onChange={e => setNewBranch(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <input 
                type="number" 
                placeholder="Target" 
                value={newTarget}
                onChange={e => setNewTarget(e.target.value)}
                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <button 
                type="submit" 
                disabled={adding}
                className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                 {adding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              </button>
           </form>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
           {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
           ) : targets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No targets set.</div>
           ) : (
              <div className="space-y-1">
                 {targets.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg group">
                       <span className="font-bold text-slate-700 text-sm">{t.branch_name}</span>
                       <div className="flex items-center gap-4">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{t.target}</span>
                          <button 
                             onClick={() => handleDelete(t.id)}
                             className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};