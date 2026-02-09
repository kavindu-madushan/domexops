import { supabase } from "../supabaseClient";
import { ReportRow, Notice, DevMessage, CashRow, SavedCourier, DispatchTarget, DispatchReport } from "../types";

export const fetchUserReports = async (userId: string): Promise<ReportRow[]> => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        throw error;
      }
      console.error("Supabase fetch error:", error);
      return [];
    }
    return data as ReportRow[];
  } catch (error: any) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw error;
    }
    console.error("Error fetching reports:", error);
    return [];
  }
};

export const saveUserReport = async (userId: string, report: ReportRow) => {
  try {
    const { error } = await supabase
      .from('reports')
      .upsert({ ...report, user_id: userId });

    if (error) throw error;
  } catch (error) {
    console.error("Error saving report:", error);
    throw error;
  }
};

export const deleteUserReport = async (userId: string, reportId: string) => {
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting report:", error);
    throw error;
  }
};

// --- Cash Management Services ---

export const fetchCashRecords = async (userId: string, date: string): Promise<CashRow[]> => {
  try {
    const { data, error } = await supabase
      .from('cash_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as CashRow[];
  } catch (error) {
    console.error("Error fetching cash records:", error);
    return [];
  }
};

export const addCashRecord = async (userId: string, record: Omit<CashRow, 'id'>) => {
  try {
    const { error } = await supabase
      .from('cash_records')
      .insert({ ...record, user_id: userId });

    if (error) throw error;
  } catch (error) {
    console.error("Error adding cash record:", error);
    throw error;
  }
};

export const deleteCashRecord = async (recordId: string) => {
  try {
    const { error } = await supabase
      .from('cash_records')
      .delete()
      .eq('id', recordId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting cash record:", error);
    throw error;
  }
};

export const fetchAllAdminCashRecords = async (): Promise<CashRow[]> => {
  try {
    const { data, error } = await supabase
      .from('cash_records')
      .select('*');

    if (error) throw error;
    return data as CashRow[];
  } catch (error) {
    console.error("Error fetching admin cash records:", error);
    return [];
  }
};

// --- Saved Couriers Services ---

export const fetchSavedCouriers = async (userId: string): Promise<SavedCourier[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_couriers')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
       // Ignore error if table doesn't exist yet
       if (error.code === '42P01') return [];
       throw error;
    }
    return data as SavedCourier[];
  } catch (error) {
    console.error("Error fetching saved couriers:", error);
    return [];
  }
};

export const saveCourierName = async (userId: string, name: string) => {
  try {
    const { error } = await supabase
      .from('saved_couriers')
      .upsert({ user_id: userId, name: name.trim() }, { onConflict: 'user_id,name' });

    if (error) throw error;
  } catch (error) {
    console.error("Error saving courier name:", error);
  }
};

export const deleteCourierName = async (id: string) => {
  try {
    const { error } = await supabase
      .from('saved_couriers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting courier name:", error);
    throw error;
  }
};

// --- Dispatch System Services ---

export const fetchDispatchTargets = async (): Promise<DispatchTarget[]> => {
  try {
    const { data, error } = await supabase
      .from('dispatch_targets')
      .select('*')
      .order('branch_name', { ascending: true });

    if (error) {
        if (error.code === '42P01') return [];
        throw error;
    }
    return data as DispatchTarget[];
  } catch (error) {
    console.error("Error fetching dispatch targets:", error);
    return [];
  }
};

export const upsertDispatchTarget = async (branchName: string, target: number) => {
  try {
    const { error } = await supabase
      .from('dispatch_targets')
      .upsert({ branch_name: branchName, target: target }, { onConflict: 'branch_name' });

    if (error) throw error;
  } catch (error) {
    console.error("Error saving dispatch target:", error);
    throw error;
  }
};

export const deleteDispatchTarget = async (id: string) => {
  try {
    const { error } = await supabase
      .from('dispatch_targets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting dispatch target:", error);
    throw error;
  }
};

export const saveDispatchReport = async (date: string, items: any[]) => {
  try {
    // 1. Delete existing for this date/user (Day-by-Day Logic)
    const { error: delError } = await supabase
      .from('dispatch_history')
      .delete()
      .eq('date', date)
      .eq('created_by', (await supabase.auth.getUser()).data.user?.id);

    if (delError) console.warn("Cleanup warning:", delError);

    // 2. Insert new record
    const { error } = await supabase
      .from('dispatch_history')
      .insert({ date, items });

    if (error) throw error;
  } catch (error) {
    console.error("Error saving dispatch report:", error);
    throw error;
  }
};

export const fetchDispatchHistory = async (): Promise<DispatchReport[]> => {
  try {
    const { data, error } = await supabase
      .from('dispatch_history')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data as DispatchReport[];
  } catch (error) {
    console.error("Error fetching dispatch history:", error);
    return [];
  }
};

export const deleteDispatchHistoryEntry = async (id: string) => {
  try {
    const { error } = await supabase
      .from('dispatch_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting dispatch history:", error);
    throw error;
  }
};

// Updated to support role, region, and approved status
export const saveUserSettings = async (userId: string, branchName: string, role: string = 'user', region: string | null = null, is_approved: boolean = true) => {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        user_id: userId, 
        branchName: branchName,
        role: role,
        region: region,
        is_approved: is_approved
      });

    if (error) throw error;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};

export const updateUserMetadata = async (userId: string, updates: { role?: string, region?: string | null, is_approved?: boolean }) => {
  try {
    const { error } = await supabase
      .from('settings')
      .update(updates)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating user metadata:", error);
    throw error;
  }
};

export const fetchUserSettings = async (userId: string): Promise<{ branchName: string, role: string, region: string, is_approved: boolean } | null> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('branchName, role, region, is_approved')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        throw error;
      }
      return null;
    }
    return data;
  } catch (error: any) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw error;
    }
    console.error("Error fetching settings:", error);
    return null;
  }
};

export const getAllBranches = async (): Promise<{user_id: string, branchName: string, role: string, region: string, is_approved: boolean}[]> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('user_id, branchName, role, region, is_approved')
      .order('branchName', { ascending: true });

    if (error) {
        throw error;
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching branches:", error);
    throw error;
  }
};

// Admin: Fetch *ALL* reports. We filter by date in client because stored dates are "25-Jan" format
export const fetchAllAdminReports = async (): Promise<{user_id: string, date: string, todayInward: number, yesterdayDelivered: number, deliveryPercentage: number, todayRtnToSender: number}[]> => {
  try {
    // UPDATED: Using yesterdayDelivered instead of todayDelivered
    const { data, error } = await supabase
      .from('reports')
      .select('user_id, date, todayInward, yesterdayDelivered, deliveryPercentage, todayRtnToSender');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all admin reports:", error);
    // Rethrow or return empty depends on strictness, but better to rethrow for admin panel to see error
    throw error;
  }
};

export const deleteBranchData = async (userId: string) => {
  try {
    // Attempt to use the secure RPC function first (deletes from auth + public tables)
    // This is the preferred method as it completely removes the user account.
    const { error: rpcError } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
    
    if (!rpcError) {
      return; // Success, user completely deleted
    }
    
    // If RPC fails (e.g., function doesn't exist in DB yet), fallback to manual table deletion.
    // This allows the UI to update even if the "Account" technically remains in Auth.
    console.log("RPC delete skipped/failed, trying manual delete:", rpcError.message);

    // 1. Delete reports
    const { error: rError } = await supabase
      .from('reports')
      .delete()
      .eq('user_id', userId);
    
    if (rError) throw rError;

    // 2. Delete settings (Requires the new DELETE policy from Database Setup)
    const { error: sError } = await supabase
      .from('settings')
      .delete()
      .eq('user_id', userId);
      
    if (sError) throw sError;
    
  } catch (error) {
    console.error("Error deleting branch data:", error);
    throw error;
  }
};

export const updateBranchPassword = async (userId: string, newPassword: string) => {
  try {
    // Calls the secure Postgres function we created in DatabaseSetup
    const { error } = await supabase.rpc('admin_reset_password', {
      target_user_id: userId,
      new_password: newPassword
    });

    if (error) throw error;
    
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

// Updates the currently logged in user's password
export const updateOwnPassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error updating own password:", error);
    throw error;
  }
};

// --- Notice Service Functions ---

export const createNotice = async (title: string, message: string, targetBranchId: string | null) => {
  try {
    const { error } = await supabase
      .from('notices')
      .insert({
        title,
        message,
        target_branch_id: targetBranchId,
        is_active: true
      });
      
    if (error) throw error;
  } catch (error) {
    console.error("Error creating notice:", error);
    throw error;
  }
};

export const fetchAdminNotices = async (): Promise<Notice[]> => {
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notice[];
  } catch (error) {
    console.error("Error fetching notices:", error);
    throw error;
  }
};

export const deleteNotice = async (id: string) => {
  try {
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting notice:", error);
    throw error;
  }
};

export const fetchActiveNotices = async (): Promise<Notice[]> => {
  try {
    // Policies defined in DatabaseSetup ensure user only gets targeted or global notices
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        // Table might not exist yet if script not run
        return [];
      }
      throw error;
    }
    return data as Notice[];
  } catch (error) {
    console.error("Error fetching user notices:", error);
    return [];
  }
};

// --- Developer Chat Services ---

export const fetchDeveloperMessages = async (): Promise<DevMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('developer_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as DevMessage[];
  } catch (error) {
    console.error("Error fetching dev messages:", error);
    return [];
  }
};

export const sendDeveloperMessage = async (message: string, imageData: string | null, senderName: string) => {
  try {
    const { error } = await supabase
      .from('developer_messages')
      .insert({
        message,
        image_data: imageData,
        sender_name: senderName
      });

    if (error) throw error;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// --- System Config (API Keys) ---

export const getSystemConfig = async (key: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) return null;
    return data?.value || null;
  } catch (e) {
    return null;
  }
};

export const setSystemConfig = async (key: string, value: string) => {
  try {
    const { error } = await supabase
      .from('system_config')
      .upsert({ key, value, updated_by: (await supabase.auth.getUser()).data.user?.id });
    
    if (error) throw error;
  } catch (e) {
    console.error("Error setting config:", e);
    throw e;
  }
};
