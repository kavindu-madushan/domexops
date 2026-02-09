
export interface ReportRow {
  id: string;
  date: string;
  // New Fields
  pendingChecking: number;
  missedRoute: number;
  temuReschedule: number;
  eveningMissedRoute: number;
  
  // Existing retained fields
  todayInward: number;
  todayRtnToSender: number;
  todayBranchHold: number; // "Hold"
  deliveryPercentage: number;
  yesterdayDispatch: number; // "Dispatch"
  
  // Legacy fields kept for calculation/history but maybe hidden in main view
  yesterdayResend: number;
  yesterdayBranchHold: number;
  todayTemuInward: number;
  yesterdayTemuHold: number;
  todayTotalParcel: number;
  yesterdayOnRoute: number; 
  yesterdayDelivered: number; 
}

export interface CashRow {
  id: string;
  user_id?: string;
  date: string; // stored as YYYY-MM-DD
  courierName: string;
  resendStatus: 'Yes' | 'No'; // Updated to Yes/No
  ecomCash: number;
  receivedCash: number;
  created_at?: string;
}

export interface SavedCourier {
  id: string;
  user_id: string;
  name: string;
}

// --- Dispatch System Types ---
export interface DispatchTarget {
  id: string;
  branch_name: string;
  target: number;
}

export interface DispatchItem {
  branch: string;
  target: number;
  dispatch: number;
  percentage: number;
  status: 'excellent' | 'good' | 'poor'; // >=100, >=70, <70
}

export interface DispatchReport {
  id: string;
  date: string;
  items: DispatchItem[];
  created_by: string; // user_id
  created_at: string;
}

export type UserRole = 'user' | 'admin' | 'superadmin' | 'rm';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  role?: UserRole;
  region?: string;
  is_approved?: boolean;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  target_branch_id: string | null; // null means "All Branches"
  target_branch_name?: string; // For display purposes
  created_at: string;
  is_active: boolean;
}

export interface DevMessage {
  id: string;
  user_id: string;
  sender_name: string;
  message: string;
  image_data?: string | null; // Base64 string
  is_dev_reply: boolean;
  created_at: string;
}

export const INITIAL_ROWS: ReportRow[] = [];