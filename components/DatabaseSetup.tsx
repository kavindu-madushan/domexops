import React from 'react';
import { Database, Copy, Check, ExternalLink, ArrowLeft } from 'lucide-react';

interface DatabaseSetupProps {
  onBack?: () => void;
}

export const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onBack }) => {
  const [copied, setCopied] = React.useState(false);

  const sql = `-- Run this in your Supabase SQL Editor to fix Admin Permissions & Schema

-- 1. Ensure tables exist
create table if not exists public.reports (
  id text not null primary key,
  user_id uuid not null default auth.uid(),
  date text not null,
  "yesterdayResend" numeric default 0,
  "yesterdayBranchHold" numeric default 0,
  "todayInward" numeric default 0,
  "todayTemuInward" numeric default 0,
  "yesterdayTemuHold" numeric default 0,
  "todayTotalParcel" numeric default 0,
  "yesterdayOnRoute" numeric default 0,
  "yesterdayDelivered" numeric default 0,
  "todayRtnToSender" numeric default 0,
  "todayBranchHold" numeric default 0,
  "deliveryPercentage" numeric default 0,
  "yesterdayDispatch" numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- New Columns Update
alter table public.reports add column if not exists "todayTemuInward" numeric default 0;
alter table public.reports add column if not exists "yesterdayTemuHold" numeric default 0;
alter table public.reports add column if not exists "yesterdayOnRoute" numeric default 0;
alter table public.reports add column if not exists "yesterdayDelivered" numeric default 0;
alter table public.reports add column if not exists "yesterdayDispatch" numeric default 0;

-- NEW 2.2 COLUMNS
alter table public.reports add column if not exists "pendingChecking" numeric default 0;
alter table public.reports add column if not exists "missedRoute" numeric default 0;
alter table public.reports add column if not exists "temuReschedule" numeric default 0;
alter table public.reports add column if not exists "eveningMissedRoute" numeric default 0;

create table if not exists public.settings (
  user_id uuid not null primary key references auth.users(id),
  "branchName" text,
  "role" text default 'user',
  "region" text default null,
  "is_approved" boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.settings add column if not exists "role" text default 'user';
alter table public.settings add column if not exists "region" text default null;
alter table public.settings add column if not exists "is_approved" boolean default true;

create table if not exists public.notices (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  target_branch_id uuid,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.developer_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid(),
  sender_name text,
  message text,
  image_data text,
  is_dev_reply boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.cash_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid(),
  date text not null, 
  "courierName" text not null,
  "resendStatus" text default 'No', -- 'Yes' or 'No'
  "ecomCash" numeric default 0,
  "receivedCash" numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.saved_couriers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- NEW: Dispatch Targets (Config for Auto-Dispatch)
create table if not exists public.dispatch_targets (
  id uuid default gen_random_uuid() primary key,
  branch_name text not null unique,
  target numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NEW: Dispatch Reports History
create table if not exists public.dispatch_history (
  id uuid default gen_random_uuid() primary key,
  date text not null,
  items jsonb not null, -- Stores the calculated array
  created_by uuid not null default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NEW: System Config (API Keys)
create table if not exists public.system_config (
  key text not null primary key,
  value text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid
);

-- 2. Enable RLS
alter table public.reports enable row level security;
alter table public.settings enable row level security;
alter table public.notices enable row level security;
alter table public.developer_messages enable row level security;
alter table public.cash_records enable row level security;
alter table public.saved_couriers enable row level security;
alter table public.dispatch_targets enable row level security;
alter table public.dispatch_history enable row level security;
alter table public.system_config enable row level security;

-- 3. HELPER FUNCTION
create or replace function public.is_approved_rm()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.settings
    where user_id = auth.uid()
    and role = 'rm'
    and is_approved = true
  );
$$;

-- 4. RESET POLICIES
drop policy if exists "Users can access own reports" on public.reports;
drop policy if exists "Users can access own settings" on public.settings;
drop policy if exists "Admins can view all reports" on public.reports;
drop policy if exists "Admins can update all reports" on public.reports;
drop policy if exists "Admins can delete all reports" on public.reports;
drop policy if exists "Admins can insert reports" on public.reports;
drop policy if exists "Admins can view all settings" on public.settings;
drop policy if exists "Admins can update settings" on public.settings; 
drop policy if exists "Admins can delete settings" on public.settings; 
drop policy if exists "Users can view notices" on public.notices;
drop policy if exists "Admins can manage notices" on public.notices;
drop policy if exists "RMs can view all settings" on public.settings;
drop policy if exists "RMs can view all reports" on public.reports;
drop policy if exists "RMs can view all cash" on public.cash_records; 
drop policy if exists "Admins can use dev chat" on public.developer_messages;
drop policy if exists "Users can manage own cash" on public.cash_records;
drop policy if exists "Admins can view all cash" on public.cash_records;
drop policy if exists "Users can manage saved couriers" on public.saved_couriers;
drop policy if exists "Admins and RMs manage targets" on public.dispatch_targets;
drop policy if exists "Admins and RMs manage dispatch history" on public.dispatch_history;
drop policy if exists "Allow read for authenticated" on public.system_config;
drop policy if exists "Allow full access for superadmin" on public.system_config;

-- 5. USER POLICIES
create policy "Users can access own reports" on public.reports for all using (auth.uid() = user_id);
create policy "Users can access own settings" on public.settings for all using (auth.uid() = user_id);
create policy "Users can manage own cash" on public.cash_records for all using (auth.uid() = user_id);
create policy "Users can manage saved couriers" on public.saved_couriers for all using (auth.uid() = user_id);

-- 6. ADMIN POLICIES
create policy "Admins can view all reports" on public.reports for select using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );
create policy "Admins can update all reports" on public.reports for update using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );
create policy "Admins can delete all reports" on public.reports for delete using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );
create policy "Admins can insert reports" on public.reports for insert with check ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );

create policy "Admins can view all settings" on public.settings for select using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );
create policy "Admins can update settings" on public.settings for update using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );
create policy "Admins can delete settings" on public.settings for delete using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );

create policy "Admins can view all cash" on public.cash_records for select using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );

-- 7. RM POLICIES
create policy "RMs can view all settings" on public.settings for select using ( public.is_approved_rm() );
create policy "RMs can view all reports" on public.reports for select using ( public.is_approved_rm() );
create policy "RMs can view all cash" on public.cash_records for select using ( public.is_approved_rm() );

-- 8. NOTICE & DEV CHAT
create policy "Users can view notices" on public.notices for select using ( is_active = true AND (target_branch_id is null OR target_branch_id = auth.uid() OR lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local')) );
create policy "Admins can manage notices" on public.notices for all using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );
create policy "Admins can use dev chat" on public.developer_messages for all using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') );

-- 9. DISPATCH POLICIES (Admin & RM Only)
create policy "Admins and RMs manage targets" on public.dispatch_targets for all 
using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') OR public.is_approved_rm() );

create policy "Admins and RMs manage dispatch history" on public.dispatch_history for all 
using ( lower(auth.jwt() ->> 'email') in ('admin@logipro.local', 'superadmin@logipro.local') OR public.is_approved_rm() );

-- 10. SYSTEM CONFIG POLICIES
create policy "Allow read for authenticated" on public.system_config for select using ( auth.role() = 'authenticated' );
create policy "Allow full access for superadmin" on public.system_config for all using ( lower(auth.jwt() ->> 'email') = 'superadmin@logipro.local' );

-- 11. FUNCTIONS
create extension if not exists pgcrypto;

create or replace function admin_reset_password(target_user_id uuid, new_password text) returns void language plpgsql security definer as $$
begin
  if lower(auth.jwt() ->> 'email') not in ('admin@logipro.local', 'superadmin@logipro.local') then raise exception 'Unauthorized'; end if;
  update auth.users set encrypted_password = crypt(new_password, gen_salt('bf')) where id = target_user_id;
end;
$$;

create or replace function admin_delete_user(target_user_id uuid) returns void language plpgsql security definer as $$
begin
  if lower(auth.jwt() ->> 'email') not in ('admin@logipro.local', 'superadmin@logipro.local') then raise exception 'Unauthorized'; end if;
  delete from public.reports where user_id = target_user_id;
  delete from public.settings where user_id = target_user_id;
  delete from public.notices where target_branch_id = target_user_id;
  delete from public.cash_records where user_id = target_user_id;
  delete from public.saved_couriers where user_id = target_user_id;
  delete from auth.users where id = target_user_id;
end;
$$;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
             <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
               <Database size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">Database Setup Required</h2>
               <p className="text-sm text-slate-500">Run this SQL script to configure permissions.</p>
             </div>
          </div>
          {onBack && (
            <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
               <ArrowLeft size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative group bg-slate-900">
           <pre className="h-full overflow-auto p-6 text-xs md:text-sm font-mono text-blue-100 leading-relaxed custom-scrollbar selection:bg-blue-500 selection:text-white">
              {sql}
           </pre>
           <button 
             onClick={handleCopy}
             className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border border-white/10"
           >
             {copied ? <Check size={16} /> : <Copy size={16} />}
             {copied ? 'Copied!' : 'Copy SQL'}
           </button>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="text-xs text-slate-500 max-w-lg">
              <strong>Instructions:</strong> Copy the SQL above, open your Supabase project dashboard, go to the <strong>SQL Editor</strong>, paste the script, and click <strong>Run</strong>.
           </div>
           <a 
             href="https://supabase.com/dashboard/project/_/sql" 
             target="_blank" 
             rel="noopener noreferrer"
             className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-95 whitespace-nowrap"
           >
              Open Supabase SQL <ExternalLink size={16} />
           </a>
        </div>

      </div>
    </div>
  );
};