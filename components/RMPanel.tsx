import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Map, 
  Search, 
  BarChart3, 
  Loader2,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Code2,
  Bell,
  Truck
} from 'lucide-react';
import { getAllBranches, fetchAllAdminReports } from '../services/db';
import { Leaderboard } from './Leaderboard';
import { BranchDashboard } from './BranchDashboard';
import { DeveloperContactModal } from './DeveloperContactModal';
import { NotificationDropdown } from './NotificationDropdown';
// UPDATED IMPORT
import { DispatchAnalytics } from './DispatchAnalytics';

interface RMPanelProps {
  onLogout: () => void;
  currentUser: any;
}

export const RMPanel: React.FC<RMPanelProps> = ({ onLogout, currentUser }) => {
  const [regionBranches, setRegionBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [regionStats, setRegionStats] = useState({
     totalInward: 0,
     totalDelivered: 0,
     avgSuccess: 0
  });
  
  // Views
  const [currentView, setCurrentView] = useState<'dashboard' | 'dispatch'>('dashboard');

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selection state for viewing specific branch
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);

  // Developer & Notification State
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    loadRegionData();
  }, []);

  const loadRegionData = async () => {
    setLoading(true);
    try {
      // 1. Get all branches
      const allBranches = await getAllBranches();
      
      // 2. Filter by current RM's region
      const myRegion = currentUser.region;
      if (!myRegion) {
        setLoading(false);
        return;
      }

      const filtered = allBranches.filter(b => 
         b.role === 'user' && 
         b.region && 
         b.region.toLowerCase() === myRegion.toLowerCase()
      );
      setRegionBranches(filtered);

      // 3. Get reports for stats
      const allReports = await fetchAllAdminReports();
      const relevantReports = allReports.filter(r => filtered.some(b => b.user_id === r.user_id));

      // Calculate Stats
      if (relevantReports.length > 0) {
         const totalInward = relevantReports.reduce((sum, r) => sum + (r.todayInward || 0), 0);
         const totalDelivered = relevantReports.reduce((sum, r) => sum + (r.yesterdayDelivered || 0), 0);
         const avgSuccess = Math.round(relevantReports.reduce((sum, r) => sum + (r.deliveryPercentage || 0), 0) / relevantReports.length);
         setRegionStats({ totalInward, totalDelivered, avgSuccess });

         // Calculate Leaderboard
         const lb = filtered.map(b => {
            const bRows = relevantReports.filter(r => r.user_id === b.user_id);
            if (bRows.length === 0) return { branchName: b.branchName, successRate: 0, volume: 0 };
            
            const bAvg = Math.round(bRows.reduce((acc, r) => acc + (r.deliveryPercentage || 0), 0) / bRows.length);
            const bVol = bRows.reduce((acc, r) => acc + (r.todayInward || 0), 0);
            return { branchName: b.branchName, successRate: bAvg, volume: bVol };
         });
         setLeaderboardData(lb.sort((a,b) => b.successRate - a.successRate));
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = regionBranches.filter(b => 
    b.branchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If a branch is selected, show the Branch Dashboard View
  if (selectedBranch) {
    return (
      <BranchDashboard 
        userId={selectedBranch.user_id}
        initialBranchName={selectedBranch.branchName}
        onDbError={() => {}}
        isReadOnly={true} // RMs view only by default
        onBack={() => setSelectedBranch(null)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
       
       <DeveloperContactModal 
         isOpen={isDevModalOpen}
         onClose={() => setIsDevModalOpen(false)}
         currentUser={`RM ${currentUser.displayName}`}
       />

       {/* Mobile Backdrop Overlay */}
       {isMobileMenuOpen && (
        <div 
           className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
           onClick={() => setIsMobileMenuOpen(false)}
        />
       )}

       {/* Mobile Floating Header */}
       <div className="lg:hidden fixed top-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white rounded-2xl shadow-2xl flex items-center p-1.5 pl-3 pr-2 gap-3 border border-white/10 pointer-events-auto ring-1 ring-black/5 animate-in slide-in-from-top-4 duration-500">
             <button 
               onClick={() => setIsMobileMenuOpen(true)} 
               className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition-all text-blue-200"
             >
               <Menu size={20} strokeWidth={2.5} />
             </button>

             <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Regional Manager</span>
                <span className="font-bold text-sm truncate leading-tight">{currentUser.region} Region</span>
             </div>

             <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
               <Map size={20} />
             </div>
          </div>
       </div>

       {/* Responsive Sidebar */}
       <aside className={`
          absolute lg:relative inset-y-0 left-0 w-[85%] sm:w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800 z-[60] shadow-2xl lg:shadow-none transform transition-transform duration-300 cubic-bezier(0.2, 0, 0, 1)
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
       `}>
          <div className="p-6 border-b border-slate-800 flex justify-between items-start">
             <div>
                <div className="flex items-center gap-3 font-extrabold text-lg tracking-tight mb-1 text-blue-400">
                    <Map size={24} />
                    Regional Panel
                </div>
                <p className="text-slate-500 text-xs font-medium ml-1">
                    {currentUser.region ? `${currentUser.region} Region` : 'Unassigned Region'}
                </p>
             </div>
             <button 
               onClick={() => setIsMobileMenuOpen(false)}
               className="lg:hidden p-2 bg-white/10 rounded-lg text-slate-400 hover:bg-white/20 hover:text-white transition-colors"
             >
                <X size={20} />
             </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
             <button
               onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} 
               className={`w-full px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
             >
                <LayoutDashboard size={18} /> Dashboard
             </button>
             <button
               onClick={() => { setCurrentView('dispatch'); setIsMobileMenuOpen(false); }} 
               className={`w-full px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${currentView === 'dispatch' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
             >
                <Truck size={18} /> Auto-Dispatch
             </button>

             <div className="px-4 py-2 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
               Overview
             </div>
             <div className="bg-slate-800/50 rounded-xl p-4 mx-2 space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Branches</span>
                  <span className="font-bold text-white">{regionBranches.length}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Vol</span>
                  <span className="font-bold text-blue-400">{regionStats.totalInward}</span>
               </div>
             </div>
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
             <button 
               onClick={() => setIsDevModalOpen(true)}
               className="w-full flex items-center gap-3 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
             >
                <Code2 size={14} /> Developer Support
             </button>
             <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
             >
                <LogOut size={14} /> Sign Out
             </button>
             <div className="text-center pt-2">
                <a href="https://wa.me/94772411839" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-blue-400 transition-colors">
                   Developed by A. Kavindu Madushan
                </a>
             </div>
          </div>
       </aside>

       {/* Main Content */}
       <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24 lg:pt-8 bg-slate-50">
          
          {currentView === 'dispatch' ? (
             // UPDATED: Using DispatchAnalytics instead of DispatchProcessor
             <div className="h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <DispatchAnalytics rmName={currentUser.displayName} userRole="rm" />
             </div>
          ) : (
             <>
               <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                  <div>
                     <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Hello, {currentUser.displayName}
                     </h1>
                     <p className="text-slate-500 text-sm">Here is what's happening in the <span className="font-semibold text-slate-700">{currentUser.region}</span> region today.</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                     {/* Notification Bell */}
                     <div className="relative">
                        <button 
                           onClick={() => setIsNotifOpen(!isNotifOpen)}
                           className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-colors relative"
                        >
                           <Bell size={20} />
                           <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                        </button>
                        <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
                     </div>

                     <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
                        <Building2 className="text-slate-400" size={18} />
                        <span className="font-bold text-slate-700">{regionBranches.length} Branches</span>
                     </div>
                  </div>
               </header>

               {/* Stats Cards - Optimized for Mobile Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-row sm:flex-col items-center sm:items-start justify-between">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mb-0 sm:mb-2">
                        <BarChart3 size={20} />
                     </div>
                     <div className="text-right sm:text-left">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Volume</div>
                        <div className="text-2xl font-black text-slate-800">{regionStats.totalInward.toLocaleString()}</div>
                     </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-row sm:flex-col items-center sm:items-start justify-between">
                     <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-0 sm:mb-2">
                        <TrendingUp size={20} />
                     </div>
                     <div className="text-right sm:text-left">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Delivered</div>
                        <div className="text-2xl font-black text-emerald-600">{regionStats.totalDelivered.toLocaleString()}</div>
                     </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-row sm:flex-col items-center sm:items-start justify-between">
                     <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mb-0 sm:mb-2">
                        <AlertCircle size={20} />
                     </div>
                     <div className="text-right sm:text-left">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Success %</div>
                        <div className="text-2xl font-black text-blue-600">{regionStats.avgSuccess}%</div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Branch List */}
                  <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[600px] md:h-[500px]">
                     <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                           <Users size={18} /> Region Branches
                        </h3>
                        <div className="relative w-full sm:w-56">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                           <input 
                             type="text" 
                             placeholder="Search branches..." 
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                           />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {loading ? (
                           <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
                        ) : filteredBranches.length === 0 ? (
                           <div className="text-center py-10 text-slate-400">No branches found in this region.</div>
                        ) : (
                           <div className="space-y-3">
                              {filteredBranches.map(branch => (
                                 <button 
                                    key={branch.user_id} 
                                    onClick={() => setSelectedBranch(branch)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-blue-100 group text-left"
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors shadow-sm">
                                          {branch.branchName.substring(0, 2).toUpperCase()}
                                       </div>
                                       <div>
                                          <span className="font-bold text-slate-700 text-sm block group-hover:text-blue-700">{branch.branchName}</span>
                                          <span className="text-xs text-slate-400 font-mono">ID: {branch.user_id.split('-')[0]}</span>
                                       </div>
                                    </div>
                                    <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                                       <ChevronRight size={20} />
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Leaderboard */}
                  <div className="h-full">
                     <Leaderboard data={leaderboardData} branches={[]} />
                  </div>
               </div>
             </>
          )}
       </main>
    </div>
  );
};