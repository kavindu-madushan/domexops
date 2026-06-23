import React, { useState, useEffect } from 'react';
import { DashboardStats } from './components/DashboardStats';
import { SettingsModal } from './components/SettingsModal';
import { Auth } from './components/Auth';
import { DatabaseSetup } from './components/DatabaseSetup';
import { AdminPanel } from './components/AdminPanel';
import { RMPanel } from './components/RMPanel';
import { BranchDashboard } from './components/BranchDashboard';
import { ToastContainer } from './components/ui/ToastContainer';
import { ToolsOverlay } from './components/ToolsOverlay';
import { NoticePopup } from './components/NoticePopup';
import { User } from './types';
import { Loader2, LogOut, ShieldAlert, Truck, WifiOff } from 'lucide-react';
import { fetchUserSettings } from './services/db';
import { supabase } from './supabaseClient';
import { toast } from './services/toast';

const AUTO_DISPATCH_ONLY_MODE = true;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [dbSetupRequired, setDbSetupRequired] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isRM, setIsRM] = useState(false);
  const [isApproved, setIsApproved] = useState(true);

  // Monitor Auth State (Supabase)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          await handleUserSession(session.user);
        } else {
          setUser(null);
          setAuthLoading(false);
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        setConnectionError(true);
        setAuthLoading(false);
        toast.error("Failed to connect to the server. Please check your internet connection.");
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setUser(null);
        setAuthLoading(false);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsRM(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (supabaseUser: any) => {
    // Basic user info from Auth
    const tempUser: User = {
      uid: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata?.full_name || 'My Branch'
    };
    
    // Fetch Extended Role info from 'settings'
    try {
       const settings = await fetchUserSettings(supabaseUser.id);
       
       if (settings) {
          tempUser.role = settings.role as any;
          tempUser.region = settings.region;
          tempUser.is_approved = settings.is_approved;
          tempUser.displayName = settings.branchName;
       }

       // Determine Role Flags
       if (tempUser.email === 'admin@logipro.local') {
          setIsAdmin(true);
       } else if (tempUser.email === 'superadmin@logipro.local') {
          setIsAdmin(true);
          setIsSuperAdmin(true);
       } else if (tempUser.role === 'admin') {
          setIsAdmin(true);
       } else if (tempUser.role === 'rm') {
          setIsRM(true);
       } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsRM(false);
       }
       
       // Handle Approval Check
       if (settings && settings.is_approved === false) {
          setIsApproved(false);
       } else {
          setIsApproved(true);
       }
       
    } catch (e) {
       console.error("Error fetching user role details", e);
    }
    
    setUser(tempUser);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Logged out successfully");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
           <WifiOff size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Connection Failed</h2>
        <p className="text-slate-500 mb-6 max-w-md">
           We couldn't connect to the database. This usually happens due to a network issue or an invalid API configuration.
        </p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
           Retry Connection
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <ToastContainer />
        <Auth onLogin={() => {}} />
      </>
    );
  }

  // Not Approved Screen
  if (!isApproved) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <ShieldAlert size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Pending Approval</h2>
              <p className="text-slate-500 mb-6">
                 Your account has been created but requires approval from an Administrator before you can access the system.
              </p>
              <button onClick={handleLogout} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">
                 Return to Login
              </button>
           </div>
        </div>
     );
  }

  if (dbSetupRequired) {
    return <DatabaseSetup onBack={() => setDbSetupRequired(false)} />;
  }
  
  // Route to Appropriate Dashboard

  if (isAdmin) {
     return (
       <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col lg:flex-row print:block">
         <ToastContainer />
         <AdminPanel 
           onLogout={handleLogout}
           isSuperAdmin={isSuperAdmin}
           onOpenDbSetup={() => setDbSetupRequired(true)}
           renderBranchView={(targetUserId, targetBranchName) => (
             <BranchDashboard 
               key={targetUserId}
               userId={targetUserId} 
               initialBranchName={targetBranchName} 
               onDbError={() => setDbSetupRequired(true)}
               isReadOnly={false} 
             />
           )}
         />
       </div>
     );
  }

  if (isRM) {
     if (AUTO_DISPATCH_ONLY_MODE) {
        return (
          <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <ToastContainer />
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck size={34} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Auto-Dispatch Only Mode</h2>
                <p className="text-slate-500 mb-6">
                  Other dashboards are temporarily disabled. Please use an admin account to access Auto-Dispatch.
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> Return to Login
                </button>
              </div>
            </div>
          </div>
        );
     }

     return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
           <ToastContainer />
           <RMPanel onLogout={handleLogout} currentUser={user} />
        </div>
     );
  }

  // Regular Branch User
  if (AUTO_DISPATCH_ONLY_MODE) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <ToastContainer />
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck size={34} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Auto-Dispatch Only Mode</h2>
            <p className="text-slate-500 mb-6">
              Other dashboards are temporarily disabled. Please use an admin account to access Auto-Dispatch.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col lg:flex-row print:block">
      <ToastContainer />
      <ToolsOverlay />
      <NoticePopup />
      <BranchDashboard 
        userId={user.uid}
        initialBranchName={user.displayName || ''}
        onDbError={() => setDbSetupRequired(true)}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;
