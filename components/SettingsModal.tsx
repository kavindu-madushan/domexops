import React, { useState, useEffect } from 'react';
import { X, Save, Building2, Lock, ShieldCheck, User, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from '../services/toast';
import { getSystemConfig, setSystemConfig } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranchName: string;
  onSaveName?: (newName: string) => Promise<void>;
  onSavePassword: (newPassword: string) => Promise<void>;
  showNameInput?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentBranchName, 
  onSaveName,
  onSavePassword,
  showNameInput = true
}) => {
  const isSuperAdmin = currentBranchName === 'Super Admin';
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'system'>('general');
  const [branchName, setBranchName] = useState(currentBranchName);
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // System Config State
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBranchName(currentBranchName);
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab(showNameInput ? 'general' : 'security');
      
      if (isSuperAdmin) {
         fetchApiKey();
      }
    }
  }, [currentBranchName, isOpen, showNameInput, isSuperAdmin]);

  const fetchApiKey = async () => {
     setKeyLoading(true);
     try {
        const k = await getSystemConfig('gemini_api_key');
        if (k) setApiKey(k);
     } catch(e) {
        console.error(e);
     } finally {
        setKeyLoading(false);
     }
  };

  if (!isOpen) return null;

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveName) return;
    
    setLoading(true);
    try {
      await onSaveName(branchName);
      onClose();
    } catch (e) {
      // Error handled by parent usually
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await onSavePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (e) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!apiKey.trim()) return;
     
     setLoading(true);
     try {
        await setSystemConfig('gemini_api_key', apiKey.trim());
        toast.success("API Key updated successfully!");
     } catch (e) {
        toast.error("Failed to save API Key");
     } finally {
        setLoading(false);
     }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-bold text-slate-800">Account Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
           {showNameInput && (
             <button 
               onClick={() => setActiveTab('general')}
               className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'general' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
               <User size={16} /> General
             </button>
           )}
           <button 
             onClick={() => setActiveTab('security')}
             className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'security' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
           >
             <ShieldCheck size={16} /> Security
           </button>
           {isSuperAdmin && (
             <button 
               onClick={() => setActiveTab('system')}
               className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'system' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
               <Key size={16} /> System
             </button>
           )}
        </div>
        
        <div className="p-6">
          {activeTab === 'general' && showNameInput ? (
            <form onSubmit={handleNameSubmit} className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Branch Display Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                    placeholder="Enter branch name"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">This name appears on reports and the dashboard.</p>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                  <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : activeTab === 'security' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 mb-4">
                 <strong>Note:</strong> Changing your password will require you to log in again on other devices.
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                  <ShieldCheck size={18} /> {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          ) : (
             <form onSubmit={handleApiKeySubmit} className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
               <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800 mb-4">
                  <strong>Gemini AI Configuration:</strong> This key enables AI features for all users. Keep it secure.
               </div>

               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Gemini API Key</label>
                 <div className="relative">
                   <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     type={showKey ? "text" : "password"} 
                     value={apiKey}
                     onChange={(e) => setApiKey(e.target.value)}
                     className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 font-mono text-sm"
                     placeholder="AIza..."
                     disabled={keyLoading}
                   />
                   <button 
                     type="button"
                     onClick={() => setShowKey(!showKey)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                   >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                 </div>
               </div>
               
               <div className="pt-4 flex justify-end gap-3">
                 <button 
                   type="submit"
                   disabled={loading}
                   className="w-full px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                 >
                   <Save size={18} /> {loading ? 'Saving...' : 'Save API Key'}
                 </button>
               </div>
             </form>
          )}
        </div>
      </div>
    </div>
  );
};