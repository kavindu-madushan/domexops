import React, { useState, useEffect } from 'react';
import { OperationTable } from './OperationTable';
import { DashboardStats } from './DashboardStats';
import { ReportsView } from './ReportsView';
import { SettingsModal } from './SettingsModal';
import { DeveloperContactModal } from './DeveloperContactModal';
import { NotificationDropdown } from './NotificationDropdown';
import { CashManagement } from './CashManagement';
import { ReportRow } from '../types';
import { LayoutDashboard, BarChart3, Settings, Bell, LogOut, ArrowLeft, Wifi, Code2, Wallet } from 'lucide-react';
import { fetchUserReports, saveUserReport, deleteUserReport, saveUserSettings, fetchUserSettings, updateOwnPassword } from '../services/db';
import { toast } from '../services/toast';

interface BranchDashboardProps {
  userId: string;
  initialBranchName: string;
  onDbError: () => void;
  isReadOnly?: boolean;
  onLogout?: () => void;
  onBack?: () => void;
}

export const BranchDashboard: React.FC<BranchDashboardProps> = ({ userId, initialBranchName, onDbError, isReadOnly = false, onLogout, onBack }) => {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [branchName, setBranchName] = useState<string>(initialBranchName);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'cash'>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // New States
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    loadData();
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, [userId]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [fetchedRows, settings] = await Promise.all([
        fetchUserReports(userId),
        fetchUserSettings(userId)
      ]);
      
      setRows(fetchedRows || []);
      
      if (settings?.branchName) {
        setBranchName(settings.branchName);
      } else {
        if (initialBranchName) {
          await saveUserSettings(userId, initialBranchName);
        }
      }
    } catch (error: any) {
      console.error("Failed to load data", error);
      if (error.code === 'PGRST205' || error.code === '42P01') {
        onDbError();
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleBranchNameSave = async (newName: string) => {
    setBranchName(newName);
    try {
      await saveUserSettings(userId, newName);
      toast.success("Branch name updated!");
    } catch (error: any) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          onDbError();
        } else {
          toast.error("Failed to update settings");
        }
    }
  };

  const handlePasswordUpdate = async (newPassword: string) => {
    try {
      await updateOwnPassword(newPassword);
      toast.success("Your password has been changed successfully.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update password");
    }
  };

  const handleSaveRow = async (row: ReportRow) => {
    if (isReadOnly) return;
    setRows(prev => {
      const index = prev.findIndex(r => r.id === row.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = row;
        return copy;
      }
      return [row, ...prev];
    });

    try {
      await saveUserReport(userId, row);
      toast.success("Entry saved successfully!");
    } catch (error: any) {
      console.error("Sync failed", error);
      if (error.code === 'PGRST205' || error.code === '42P01') {
        onDbError();
      } else {
        toast.error("Failed to save to database.");
      }
    }
  };

  const handleDeleteRow = async (id: string) => {
    if (isReadOnly) return;
    setRows(prev => prev.filter(r => r.id !== id));
    try {
      await deleteUserReport(userId, id);
      toast.success("Record deleted");
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete record.");
    }
  };

  // Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 print:hidden z-10">
      <div className="p-6 border-b border-slate-100 flex justify-center">
          <img src="https://domex.lk/public/image/domex_logo.png" alt="Domex" className="h-10 w-auto object-contain" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
            <LayoutDashboard size={20} /> Dashboard
        </button>
        <button 
          onClick={() => setCurrentView('reports')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${currentView === 'reports' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
            <BarChart3 size={20} /> Analytics
        </button>
        <button 
          onClick={() => setCurrentView('cash')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${currentView === 'cash' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
        >
            <Wallet size={20} /> Cash Management
        </button>
        {!isReadOnly && (
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium transition-colors text-left"
          >
              <Settings size={20} /> Settings
          </button>
        )}
      </nav>
      <div className="p-4 space-y-2">
          {/* Developer Support Button */}
          <button 
            onClick={() => setIsDevModalOpen(true)}
            className="w-full flex items-center gap-3 text-emerald-600 hover:bg-emerald-50 px-4 py-3 rounded-xl text-sm font-bold transition-colors border border-transparent hover:border-emerald-100"
          >
             <Code2 size={18} /> Developer Help
          </button>

          <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg shadow-slate-200 mt-2">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Current Branch</p>
            <p className="font-semibold truncate" title={branchName}>{branchName}</p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-400">
               <Wifi size={10} /> Online
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          )}
          
          <div className="text-center pt-2">
             <a href="https://wa.me/94772411839" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-blue-500 transition-colors">
                Dev: A. Kavindu Madushan
             </a>
          </div>
      </div>
    </aside>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50 w-full overflow-hidden relative">
       <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentBranchName={branchName}
        onSaveName={handleBranchNameSave}
        onSavePassword={handlePasswordUpdate}
      />

      <DeveloperContactModal 
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
        currentUser={branchName}
      />

      {onLogout && <Sidebar />}

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Network Status Banner */}
        {!isOnline && (
          <div className="bg-rose-500 text-white text-xs font-bold text-center py-1 flex-none">
            You are currently offline. Changes may not save.
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible scroll-smooth pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 relative">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden relative z-30">
              <div className="w-full md:w-auto flex items-center gap-3">
                {onBack && (
                  <button onClick={onBack} className="p-2 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-slate-500 transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div className="flex-1">
                  <h1 className="text-xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
                    {currentView === 'dashboard' ? `${getGreeting()}` : currentView === 'cash' ? 'Cash Reporting' : 'Analytics'}
                  </h1>
                  <p className="text-slate-500 text-xs md:text-sm flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                     {branchName} {isReadOnly && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">Read Only</span>}
                  </p>
                </div>
                
                {/* Mobile Logout / Profile Icon */}
                {onLogout && (
                   <button onClick={onLogout} className="lg:hidden p-2 bg-white rounded-full border border-slate-200 text-rose-500 shadow-sm">
                     <LogOut size={18} />
                   </button>
                )}
              </div>
              
              {/* Desktop Tabs */}
              {!onLogout && (
                 <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button 
                      onClick={() => setCurrentView('dashboard')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => setCurrentView('reports')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'reports' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Analytics
                    </button>
                    <button 
                      onClick={() => setCurrentView('cash')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentView === 'cash' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Cash
                    </button>
                    {!isReadOnly && (
                      <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-3 py-2 text-slate-400 hover:text-slate-600"
                        title="Settings"
                      >
                        <Settings size={18} />
                      </button>
                    )}
                 </div>
              )}

              <div className="hidden md:flex items-center gap-3 text-sm relative">
                 {/* Notification Bell */}
                 <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors relative"
                 >
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                 </button>
                 
                 {/* Notification Dropdown */}
                 <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />

                 <span className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm text-slate-600">
                   {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                 </span>
              </div>
            </header>
            
            {/* Announcement Banner */}
            {!isReadOnly && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-0.5 shadow-sm print:hidden">
                <div className="bg-white/95 backdrop-blur-sm rounded-[10px] px-4 py-2 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-sm font-medium text-slate-700 truncate">
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">New</span>
                      <span className="truncate text-xs md:text-sm">Domex Pro Suite tools are now live!</span>
                   </div>
                </div>
              </div>
            )}

            {currentView === 'dashboard' ? (
              <>
                <DashboardStats rows={rows} />
                <section className="print:hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-700">Daily Records</h2>
                  </div>
                  <OperationTable 
                    rows={rows} 
                    branchName={branchName}
                    onSaveRow={handleSaveRow}
                    onDeleteRow={handleDeleteRow}
                    loading={dataLoading}
                    readOnly={isReadOnly}
                  />
                </section>
              </>
            ) : currentView === 'reports' ? (
               <ReportsView rows={rows} branchName={branchName} />
            ) : (
               <CashManagement userId={userId} branchName={branchName} />
            )}

            <footer className="border-t border-slate-200 pt-8 text-center text-slate-400 text-xs md:text-sm print:hidden pb-4">
              <p>&copy; {new Date().getFullYear()} Domex Courier. {onLogout ? 'Branch Portal' : 'Admin Console'}.</p>
              <div className="mt-2">
                 <button onClick={() => setIsDevModalOpen(true)} className="text-[10px] text-slate-500 hover:text-blue-500 transition-colors">
                    Developed by A. Kavindu Madushan
                 </button>
              </div>
            </footer>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {onLogout && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 safe-area-pb">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <LayoutDashboard size={24} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">Home</span>
            </button>
            
            <button 
              onClick={() => setCurrentView('cash')}
              className={`flex flex-col items-center gap-1 ${currentView === 'cash' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <Wallet size={24} strokeWidth={currentView === 'cash' ? 2.5 : 2} />
              <span className="text-[10px] font-bold">Cash</span>
            </button>

            {!isReadOnly && (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex flex-col items-center gap-1 text-slate-400"
              >
                <Settings size={24} />
                <span className="text-[10px] font-bold">Settings</span>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};