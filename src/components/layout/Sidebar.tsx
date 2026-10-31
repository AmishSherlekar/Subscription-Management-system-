import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  CalendarCheck,
  FileSpreadsheet,
  Repeat,
  FileText,
  CreditCard,
  Percent,
  BarChart3,
  UserCircle2,
  Clock,
  Shield,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useSystemStore } from '../../store';
import type { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, switchRole } = useSystemStore();

  const isCustomerRole = currentUser.role === 'customer';

  // Navigation items based on role
  const adminStaffNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products & Variants', icon: Package },
    { id: 'plans', label: 'Subscription Plans', icon: CalendarCheck },
    { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'taxes-discounts', label: 'Taxes & Discounts', icon: Percent },
    { id: 'reports', label: 'Revenue Reports', icon: BarChart3 },
    { id: 'audit-jobs', label: 'Billing Jobs & Audit', icon: Clock },
    { id: 'customer-portal', label: 'Customer Portal Preview', icon: UserCircle2 },
  ];

  const customerNavItems = [
    { id: 'customer-portal', label: 'My Subscriptions & Invoices', icon: UserCircle2 },
  ];

  const navItems = isCustomerRole ? customerNavItems : adminStaffNavItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-3">
        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
          B
        </div>
        <div>
          <span className="font-semibold text-slate-900 text-sm tracking-tight block">
            Brightloop Software
          </span>
          <span className="text-[11px] text-slate-500 block">Subscription Management</span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {isCustomerRole ? 'Customer Area' : 'Main Menu'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 pl-2'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Role Switcher & User Profile Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="mb-3">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Simulate Role Permission:
          </label>
          <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded border border-slate-200">
            {(['admin', 'staff', 'customer'] as UserRole[]).map((r) => {
              const active = currentUser.role === r;
              return (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    if (r === 'customer') {
                      setCurrentTab('customer-portal');
                    } else if (currentTab === 'customer-portal') {
                      setCurrentTab('dashboard');
                    }
                  }}
                  className={`text-[11px] py-1 px-1.5 rounded font-medium capitalize transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold">
            {currentUser.role === 'admin' ? (
              <Shield className="w-4 h-4 text-purple-600" />
            ) : currentUser.role === 'staff' ? (
              <Briefcase className="w-4 h-4 text-blue-600" />
            ) : (
              <UserCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-medium text-slate-900 truncate">{currentUser.displayName}</p>
            <p className="text-[11px] text-slate-500 capitalize">{currentUser.role} Role</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
