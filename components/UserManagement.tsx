import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Eye, 
  UserCircle,
  AlertTriangle,
  Users,
  Building2,
  Lock,
  X,
  KeyRound,
  Loader2,
  MapPin,
  Briefcase,
  CheckCircle,
  ShieldAlert
} from 'lucide-react';
import { deleteBranchData, updateBranchPassword, updateUserMetadata } from '../services/db';
import { toast } from '../services/toast';

interface Branch {
  user_id: string;
  branchName: string;
  role: string;
  region: string;
  is_approved: boolean;
}

interface UserManagementProps {
  branches: any[];
  onView: (branch: any) => void;
  onRefresh: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ branches, onView, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Modal States
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Branch | null>(null);
  
  // Edit Form States
  const [newPassword, setNewPassword] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editApproved, setEditApproved] = useState(true);
  
  const [actionLoading, setActionLoading] = useState(false);

  const filteredBranches = branches.filter(b => 
    b.branchName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.region && b.region.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Extract unique existing regions for autocomplete
  const existingRegions = useMemo(() => {
    const regions = new Set<string>();
    branches.forEach(b => {
      if (b.region) regions.add(b.region);
    });
    return Array.from(regions);
  }, [branches]);

  const handleDelete = async (branch: Branch) => {
    if (!window.confirm(`Are you sure you want to delete "${branch.branchName}"?\n\nThis will permanently remove all their report data and settings. This action cannot be undone.`)) {
      return;
    }

    setDeletingId(branch.user_id);
    try {
      await deleteBranchData(branch.user_id);
      toast.success(`User "${branch.branchName}" deleted successfully`);
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete user data");
    } finally {
      setDeletingId(null);
    }
  };

  const openPwdModal = (branch: Branch) => {
    setSelectedUser(branch);
    setNewPassword('');
    setPwdModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setSelectedUser(branch);
    setEditRegion(branch.region || '');
    setEditRole(branch.role || 'user');
    setEditApproved(branch.is_approved);
    setEditModalOpen(true);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setActionLoading(true);
    try {
      await updateBranchPassword(selectedUser.user_id, newPassword);
      toast.success(`Password for ${selectedUser.branchName} updated!`);
      setPwdModalOpen(false);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("function admin_reset_password") && error.message?.includes("does not exist")) {
         toast.error("Database function missing. Please run 'Database Setup' again.");
      } else {
         toast.error(error.message || "Failed to update password");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleMetadataUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(true);
    try {
       await updateUserMetadata(selectedUser.user_id, {
          role: editRole,
          region: editRegion || null,
          is_approved: editApproved
       });
       toast.success(`User settings updated for ${selectedUser.branchName}`);
       setEditModalOpen(false);
       onRefresh();
    } catch (e) {
       toast.error("Failed to update user settings");
    } finally {
       setActionLoading(false);
    }
  };

  const handleQuickApprove = async (branch: Branch) => {
     try {
        await updateUserMetadata(branch.user_id, { is_approved: true });
        toast.success(`${branch.branchName} approved!`);
        onRefresh();
     } catch (e) {
        toast.error("Failed to approve");
     }
  };

  return (
    <div className="flex-1 h-full flex flex-col p-4 md:p-6 overflow-hidden bg-slate-50 relative">
      
      {/* Password Reset Modal */}
      {pwdModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <KeyRound size={18} className="text-blue-600" /> Reset Password
                 </h3>
                 <button onClick={() => setPwdModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
              </div>
              <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
                 <div className="text-sm text-slate-600">
                    Enter a new password for <strong>{selectedUser.branchName}</strong>.
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">New Password</label>
                    <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                         type="text" 
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                         placeholder="Min 6 characters"
                         autoFocus
                       />
                    </div>
                 </div>
                 <div className="pt-2 flex gap-3">
                    <button 
                       type="button" 
                       onClick={() => setPwdModalOpen(false)}
                       className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit"
                       disabled={actionLoading}
                       className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                       {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Update'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit User Modal (Role/Region/Status) */}
      {editModalOpen && selectedUser && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
               <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <Briefcase size={18} className="text-blue-600" /> Assignment & Settings
                  </h3>
                  <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               <form onSubmit={handleMetadataUpdate} className="p-6 space-y-4">
                  
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Role</label>
                     <select 
                        value={editRole} 
                        onChange={e => setEditRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                     >
                        <option value="user">Branch User</option>
                        <option value="rm">Regional Manager</option>
                        <option value="admin">Administrator</option>
                     </select>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Region (Assignment)</label>
                     <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                           type="text" 
                           list="region-suggestions"
                           value={editRegion}
                           onChange={(e) => setEditRegion(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                           placeholder="Type or select Region..."
                        />
                        <datalist id="region-suggestions">
                          {existingRegions.map((region) => (
                             <option key={region} value={region} />
                          ))}
                        </datalist>
                     </div>
                     <p className="text-[10px] text-slate-400 mt-1">
                        Assign this {editRole === 'rm' ? 'RM' : 'branch'} to a region. RMs only see branches in their assigned region.
                     </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                     <input 
                        type="checkbox" 
                        id="chkApproved" 
                        checked={editApproved} 
                        onChange={e => setEditApproved(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                     />
                     <label htmlFor="chkApproved" className="text-sm font-medium text-slate-700 select-none">Account Approved / Active</label>
                  </div>

                  <div className="pt-2 flex gap-3">
                     <button 
                        type="button" 
                        onClick={() => setEditModalOpen(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2"
                     >
                        {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Save Assignment'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Header Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Users className="text-blue-600" /> User Management
          </h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage registered branches, RMs, and approvals.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 w-full md:w-auto">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                 <Building2 size={24} />
              </div>
              <div>
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</div>
                 <div className="text-xl md:text-2xl font-black text-slate-800">{branches.length}</div>
              </div>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="relative w-full md:w-96">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder="Search branches, RMs..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-slate-700"
           />
        </div>
        <div className="text-xs text-slate-400 font-medium whitespace-nowrap">
           Showing {filteredBranches.length} users
        </div>
      </div>

      {/* Table / List Container */}
      <div className="bg-slate-50 md:bg-white md:border md:border-slate-100 md:shadow-sm rounded-xl overflow-hidden flex-1 flex flex-col">
         <div className="overflow-y-auto flex-1 custom-scrollbar pb-20 md:pb-0">
            
            {/* Desktop Table View */}
            <table className="w-full text-left text-sm hidden md:table">
               <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                  <tr>
                     <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs">User Info</th>
                     <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs">Role / Region</th>
                     <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs">Status</th>
                     <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredBranches.length > 0 ? (
                    filteredBranches.map((branch) => (
                      <tr key={branch.user_id} className={`hover:bg-slate-50/50 transition-colors group ${!branch.is_approved ? 'bg-amber-50' : ''}`}>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                  {branch.branchName.substring(0, 2).toUpperCase()}
                               </div>
                               <div>
                                  <div className="font-bold text-slate-800">{branch.branchName}</div>
                                  <div className="text-xs text-slate-400 font-mono">{branch.user_id.split('-')[0]}...</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex flex-col">
                               <span className="font-bold capitalize text-slate-700">{branch.role || 'User'}</span>
                               <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin size={10} /> {branch.region || 'No Region Assigned'}
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            {branch.is_approved ? (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                               </span>
                            ) : (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                  <ShieldAlert size={12} /> Pending Approval
                               </span>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                               {!branch.is_approved && (
                                  <button
                                     onClick={() => handleQuickApprove(branch)}
                                     className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm text-xs font-bold"
                                  >
                                     <CheckCircle size={14} /> Approve
                                  </button>
                               )}
                               <button 
                                 onClick={() => openEditModal(branch)}
                                 className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all shadow-sm text-xs font-bold"
                                 title="Assign Region / Role"
                               >
                                  <Briefcase size={14} /> Assign
                               </button>
                               <button 
                                 onClick={() => openPwdModal(branch)}
                                 className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm text-xs font-bold"
                                 title="Reset Password"
                               >
                                  <KeyRound size={14} /> Pass
                               </button>
                               {branch.role === 'user' && (
                                 <button 
                                    onClick={() => onView(branch)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm text-xs font-bold"
                                 >
                                    <Eye size={14} /> View
                                 </button>
                               )}
                               <button 
                                 onClick={() => handleDelete(branch)}
                                 disabled={deletingId === branch.user_id}
                                 className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm text-xs font-bold disabled:opacity-50"
                               >
                                  {deletingId === branch.user_id ? '...' : <Trash2 size={14} />}
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                             <UserCircle size={48} className="opacity-20" />
                             <p>No users found matching "{searchTerm}"</p>
                          </div>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
      
      {/* Warning Footer */}
      <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs flex-none">
         <AlertTriangle size={16} className="mt-0.5 shrink-0" />
         <div>
            <strong>How to Assign RMs:</strong> Use the "Assign" button above. RMs can only see branches that have the exact same <strong>Region</strong> name (e.g., "South").
         </div>
      </div>
    </div>
  );
};