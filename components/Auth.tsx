import React, { useState } from 'react';
import { Package, ArrowRight, Loader2, Building2, Lock, Briefcase } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { saveUserSettings } from '../services/db';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

type LoginRole = 'branch' | 'rm';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [activeRole, setActiveRole] = useState<LoginRole>('branch');
  const [branchName, setBranchName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to generate a consistent internal email from the branch name
  const getInternalEmail = (name: string, role: LoginRole) => {
    // Super Admin Hardcoded Mapping
    if (name.trim() === 'madu') {
      return 'superadmin@logipro.local';
    }

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Distinguish RM emails to prevent username collision with branches
    if (role === 'rm') {
      return `rm_${cleanName}@logipro.local`;
    }
    
    return `${cleanName}@logipro.local`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const internalEmail = getInternalEmail(branchName, activeRole);

    if (!branchName || branchName.trim().length < 3) {
      setError("Name must be at least 3 characters.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

        if (error) {
           if (error.message.includes("Invalid login credentials")) {
             throw new Error("Incorrect credentials.");
           }
           throw error;
        }
        
        // Session update handled by onAuthStateChange in App.tsx

      } else {
        // Registration
        const { data, error } = await supabase.auth.signUp({
          email: internalEmail,
          password,
          options: {
            data: {
              full_name: branchName === 'madu' ? 'Super Admin' : branchName,
            },
          },
        });

        if (error) {
          // Handle "User already registered" specifically
          if (error.message.includes("User already registered") || error.status === 422) {
            throw new Error("This name is already registered. Please switch to Login.");
          }
          throw error;
        }

        if (data.user) {
          // Save initial settings to DB
          if (data.user.id) {
             const role = branchName === 'madu' ? 'admin' : activeRole === 'rm' ? 'rm' : 'user';
             // RMs need approval, Branches auto-approved for now (or change logic if needed)
             const isApproved = role !== 'rm'; 
             
             await saveUserSettings(data.user.id, branchName === 'madu' ? 'Super Admin' : branchName, role, null, isApproved);
          }
          
          if (!data.session) {
             setError("Registration requires email confirmation. Please disable 'Confirm Email' in Supabase.");
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl w-full max-w-md p-8 rounded-3xl shadow-xl border border-white/50 relative z-10 flex flex-col">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
             <img src="https://domex.lk/public/image/domex_logo.png" alt="Domex" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Operations Portal</h1>
          <p className="text-slate-500 font-medium">Courier Management System</p>
        </div>
        
        {/* Role Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
           <button
             onClick={() => setActiveRole('branch')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${activeRole === 'branch' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <Building2 size={16} /> Branch
           </button>
           <button
             onClick={() => setActiveRole('rm')}
             className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${activeRole === 'rm' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <Briefcase size={16} /> Regional Manager
           </button>
        </div>

        <div className="bg-slate-50 p-1.5 rounded-xl flex mb-6 relative">
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Login
          </button>
          <button 
             onClick={() => { setIsLogin(false); setError(''); }}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Branch Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
               {activeRole === 'branch' ? 'Branch Name' : 'Manager Name'}
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-xl px-4 pl-12 py-3.5 focus:ring-2 focus:ring-yellow-500 font-medium text-slate-700 outline-none transition-all"
                placeholder={activeRole === 'branch' ? "Ex: Embilipitiya" : "Ex: John Doe"}
                required
                minLength={3}
              />
            </div>
            {!isLogin && activeRole === 'rm' && (
               <p className="text-[10px] text-amber-600 mt-1 ml-1 flex items-center gap-1">
                 <Briefcase size={10} /> RM accounts require Admin approval.
               </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-0 rounded-xl px-4 pl-12 py-3.5 focus:ring-2 focus:ring-yellow-500 font-medium text-slate-700 outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-rose-100">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${activeRole === 'rm' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {isLogin ? 'Access Dashboard' : 'Create Account'} <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-auto pt-6 text-center">
           <a href="https://wa.me/94772411839" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-blue-500 transition-colors font-medium">
              Developed by A. Kavindu Madushan
           </a>
        </div>
      </div>
    </div>
  );
};