import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Database, 
  Globe, 
  Trophy, 
  Menu, 
  X, 
  Crown, 
  Megaphone,
  AlertTriangle,
  Code2,
  Truck
} from 'lucide-react';
import { getAllBranches, fetchAllAdminReports, updateOwnPassword } from '../services/db';
import { GlobalReportGenerator } from './GlobalReportGenerator';
import { Leaderboard } from './Leaderboard';
import { UserManagement } from './UserManagement';
import { NoticeManager } from './NoticeManager';
// UPDATED IMPORT
import { DispatchAnalytics } from './DispatchAnalytics';
import { toast } from '../services/toast';
import { SettingsModal } from './SettingsModal';
import { DeveloperContactModal } from './DeveloperContactModal';

interface AdminPanelProps {
  onLogout: () => void;
  renderBranchView: (targetUserId: string, targetBranchName: string) => React.ReactNode;
  isSuperAdmin?: boolean;
  onOpenDbSetup?: () => void;
}

interface Branch {
  user_id: string;
  branchName: string;
}

type AdminView = 'branches' | 'global_reports' | 'leaderboard' | 'notices' | 'dispatch';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, renderBranchView, isSuperAdmin, onOpenDbSetup }) => {
  const [currentView, setCurrentView] = useState<AdminView>('branches');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Developer Modal
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getAllBranches();
      const filtered = data.filter(b => b.branchName.toLowerCase() !== 'admin' && b.branchName.toLowerCase() !== 'super admin');
      setBranches(filtered);
    } catch (err: any) {
      console.error("Failed to load branches", err);
      // Check for specific column error
      if (err.message?.includes('column "role" does not exist') || err.code === '42703') {
        setFetchError("Database update required. Please run the Database Setup script.");
        if (onOpenDbSetup) onOpenDbSetup();
      } else {
        setFetchError("Failed to load user list. Please check your connection or database permissions.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Logic to load leaderboard data on demand
  const loadLeaderboard = async () => {
     setCurrentView('leaderboard');
     setSelectedBranch(null);
     setIsMobileMenuOpen(false);
     toast.info("Calculating rankings...");
     
     try {
       // Quick aggregation for leaderboard
       const allReports = await fetchAllAdminReports();
       const stats = branches.map(b => {
           const bRows = allReports.filter(r => r.user_id === b.user_id);
           if (bRows.length === 0) return { branchName: b.branchName, successRate: 0, volume: 0 };
           
           const avg = Math.round(bRows.reduce((acc, r) => acc + (r.deliveryPercentage || 0), 0) / bRows.length);
           const vol = bRows.reduce((acc, r) => acc + (r.todayInward || 0), 0);
           return { branchName: b.branchName, successRate: avg, volume: vol };
       });
       setLeaderboardData(stats);
     } catch (e) {
       console.error("Leaderboard error", e);
       toast.error("Failed to load leaderboard stats");
     }
  };

  const handleAdminPasswordUpdate = async (newPassword: string) => {
    try {
      await updateOwnPassword(newPassword);
      toast.success("Admin password updated successfully.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update password");
    }
  };

  const filteredBranches = branches.filter(b => 
    b.branchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPageTitle = () => {
    if (selectedBranch) return selectedBranch.branchName;
    if (currentView === 'branches') return 'User Management';
    if (currentView === 'global_reports') return 'Global Reports';
    if (currentView === 'leaderboard') return 'Leaderboard';
    if (currentView === 'notices') return 'Notices';
    if (currentView === 'dispatch') return 'Auto-Dispatch';
    return 'Admin Panel';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentBranchName={isSuperAdmin ? "Super Admin" : "Admin"}
        showNameInput={false} // Admin doesn't change name via this modal usually
        onSavePassword={handleAdminPasswordUpdate}
      />

      <DeveloperContactModal 
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
        currentUser={isSuperAdmin ? "Super Admin" : "Admin"}
      />

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
           className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
           onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* NEW: Floating Mobile Header (The "Next Level" Menu) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-xl text-white rounded-2xl shadow-2xl flex items-center p-1.5 pl-3 pr-2 gap-3 border border-white/10 pointer-events-auto ring-1 ring-black/5 animate-in slide-in-from-top-4 duration-500">
           
           {/* Menu Trigger */}
           <button 
             onClick={() => setIsMobileMenuOpen(true)} 
             className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all text-blue-200"
           >
             <Menu size={20} strokeWidth={2.5} />
           </button>

           {/* Dynamic Title */}
           <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Admin Console</span>
              <span className="font-bold text-sm truncate leading-tight">{getPageTitle()}</span>
           </div>

           {/* Visual Indicator */}
           <div className={`p-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-white ${isSuperAdmin ? 'bg-amber-500' : 'bg-blue-600'}`}>
             {isSuperAdmin ? <Crown size={20} /> : <ShieldCheck size={20} />}
           </div>
        </div>
      </div>

      {/* Admin Sidebar with enhanced transitions */}
      <aside className={`
          absolute lg:relative inset-y-0 left-0 w-[85%] sm:w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800 z-[60] shadow-2xl lg:shadow-none transform transition-transform duration-300 cubic-bezier(0.2, 0, 0, 1)
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800">
           <div className="flex justify-center mb-4">
               <img src="https://domex.lk/public/image/domex_logo.png" alt="Domex" className="h-10 w-auto object-contain bg-white/10 rounded px-2" />
           </div>
           <div className="flex items-center justify-between">
             <div>
                <div className={`flex items-center gap-3 font-extrabold text-lg tracking-tight mb-1 ${isSuperAdmin ? 'text-amber-400' : 'text-blue-400'}`}>
                  {isSuperAdmin ? <Crown size={18} /> : <ShieldCheck size={18} />}
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </div>
                <p className="text-slate-500 text-xs font-medium ml-1">System Management</p>
             </div>
             
             {/* Mobile Close Button */}
             <button 
               onClick={() => setIsMobileMenuOpen(false)}
               className="lg:hidden p-2 bg-white/10 rounded-lg text-slate-400 hover:bg-white/20 hover:text-white transition-colors"
             >
                <X size={20} />
             </button>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-4 flex flex-col gap-2">
           <button 
             onClick={() => { setCurrentView('branches'); setSelectedBranch(null); setIsMobileMenuOpen(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'branches' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
           >
              <Users size={18} /> User Management
           </button>
           <button 
             onClick={() => { setCurrentView('dispatch'); setSelectedBranch(null); setIsMobileMenuOpen(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'dispatch' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
           >
              <Truck size={18} /> Auto-Dispatch
           </button>
           <button 
             onClick={() => { setCurrentView('notices'); setSelectedBranch(null); setIsMobileMenuOpen(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'notices' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
           >
              <Megaphone size={18} /> Notices
           </button>
           <button 
             onClick={() => { setCurrentView('global_reports'); setSelectedBranch(null); setIsMobileMenuOpen(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'global_reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
           >
              <Globe size={18} /> Global Reports
           </button>
           <button 
             onClick={loadLeaderboard}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${currentView === 'leaderboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
           >
              <Trophy size={18} /> Leaderboard
           </button>
           
           {isSuperAdmin && onOpenDbSetup && (
             <button 
               onClick={() => { onOpenDbSetup(); setIsMobileMenuOpen(false); }}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-amber-400 hover:bg-slate-800 hover:text-amber-300 mt-2 border border-dashed border-slate-700"
             >
                <Database size={18} /> Database Setup
             </button>
           )}
        </div>

        {/* Sidebar Branch List (Collapsed View or Quick Access) */}
        {currentView === 'branches' && !selectedBranch && (
          <div className="flex-1 overflow-hidden flex flex-col border-t border-slate-800 pt-4">
             <div className="px-4 mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Access</div>
                <div className="relative mb-2">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                   <input 
                     type="text" 
                     placeholder="Filter list..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                   />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-1">
               {loading ? (
                 <div className="text-center py-8 text-slate-600 text-xs">Loading...</div>
               ) : filteredBranches.length === 0 ? (
                 <div className="p-4 text-center">
                    <p className="text-slate-500 text-xs">No branches found.</p>
                    {fetchError && (
                      <p className="text-rose-400 text-[10px] mt-2 leading-tight">{fetchError}</p>
                    )}
                 </div>
               ) : (
                 filteredBranches.map(branch => (
                   <button
                     key={branch.user_id}
                     onClick={() => { setSelectedBranch(branch); setIsMobileMenuOpen(false); }}
                     className="w-full flex items-center justify-between p-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all group"
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] bg-slate-800 text-slate-500 group-hover:bg-slate-700">
                          {branch.branchName.substring(0, 2).toUpperCase()}
                       </div>
                       <div className="text-left">
                          <div className="font-semibold text-xs truncate w-32">{branch.branchName}</div>
                       </div>
                     </div>
                   </button>
                 ))
               )}
             </div>
          </div>
        )}
        
        {/* Spacer */}
        {(currentView !== 'branches' || selectedBranch) && <div className="flex-1"></div>}

        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
           <button 
              onClick={() => { setIsDevModalOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
           >
              <Code2 size={14} /> Developer Support
           </button>
           <button 
              onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 text-slate-400 hover:bg-slate-800 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
           >
              <Settings size={14} /> Admin Settings
           </button>
           <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
           >
              <LogOut size={14} /> Sign Out Admin
           </button>
           
           <div className="text-center pt-2 pb-1">
              <a href="https://wa.me/94772411839" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-blue-400 transition-colors">
                 Developed by A. Kavindu Madushan
              </a>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-50 transition-all duration-300">
        
        {fetchError ? (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                 <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
              <p className="text-slate-500 max-w-md mt-2 mb-6">{fetchError}</p>
              {onOpenDbSetup && (
                <button 
                   onClick={onOpenDbSetup}
                   className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700"
                >
                   Run Database Fix
                </button>
              )}
              <button 
                 onClick={loadBranches}
                 className="mt-4 text-sm text-slate-400 hover:text-slate-600 underline"
              >
                 Retry
              </button>
           </div>
        ) : currentView === 'dispatch' ? (
           <div className="flex-1 p-6 overflow-hidden pt-24 lg:pt-6">
              {/* UPDATED COMPONENT */}
              <DispatchAnalytics rmName="Administrator" userRole="admin" />
           </div>
        ) : currentView === 'notices' ? (
           <div className="flex-1 p-6 overflow-hidden pt-24 lg:pt-6">
              <NoticeManager onSetupRequired={onOpenDbSetup} />
           </div>
        ) : currentView === 'global_reports' ? (
           <div className="flex-1 p-6 overflow-hidden pt-24 lg:pt-6">
              <GlobalReportGenerator />
           </div>
        ) : currentView === 'leaderboard' ? (
           <div className="flex-1 p-4 md:p-8 overflow-y-auto pt-24 lg:pt-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <Trophy className="text-yellow-500" /> Network Leaderboard
              </h1>
              <div className="max-w-3xl">
                 <Leaderboard data={leaderboardData} branches={branches} />
              </div>
           </div>
        ) : selectedBranch ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
             {/* Admin Context Header */}
             <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex justify-between items-center text-amber-800 text-sm font-medium z-30 shadow-sm flex-none pt-24 lg:pt-2">
                <div className="flex items-center gap-2 truncate">
                   <ShieldCheck size={16} className="shrink-0" />
                   <span className="truncate">Managing: <strong>{selectedBranch.branchName}</strong></span>
                </div>
                <button onClick={() => setSelectedBranch(null)} className="underline hover:text-amber-900 text-xs shrink-0 ml-2">Close View</button>
             </div>
             
             {/* Render the actual App logic for the selected user */}
             <div className="flex-1 overflow-hidden">
                {renderBranchView(selectedBranch.user_id, selectedBranch.branchName)}
             </div>
          </div>
        ) : (
          <div className="pt-24 lg:pt-0 h-full flex flex-col">
            <UserManagement 
               branches={branches}
               onView={(b) => setSelectedBranch(b)}
               onRefresh={loadBranches}
            />
          </div>
        )}
      </main>
    </div>
  );
};