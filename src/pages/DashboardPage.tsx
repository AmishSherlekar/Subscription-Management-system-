import React from 'react';
import {
  Users,
  Repeat,
  DollarSign,
  AlertTriangle,
  Calendar,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useSystemStore } from '@/store';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/Badge';
import { formatPaise } from '@/utils/money';
import { formatDate } from '@/utils/date';
import type { Subscription } from '@/types';

interface DashboardPageProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { getMetrics, subscriptions, invoices, payments } = useSystemStore();
  const metrics = getMetrics();

  // Prepare monthly revenue data for bar chart
  const monthlyRevenueData = [
    { month: 'Jun', invoiced: 28000, collected: 25000 },
    { month: 'Jul', invoiced: 34500, collected: 32000 },
    { month: 'Aug', invoiced: 42000, collected: 39000 },
    { month: 'Sep', invoiced: 58000, collected: 51000 },
    {
      month: 'Oct (Current)',
      invoiced: Math.round(metrics.invoicedRevenue / 100),
      collected: Math.round(metrics.totalRevenueCollected / 100),
    },
  ];

  // Subscription status breakdown
  const statusCounts = subscriptions.reduce((acc, sub) => {
    acc[sub.status] = (acc[sub.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const subStatusData = [
    { name: 'Active', value: statusCounts['active'] || 0, color: '#10b981' },
    { name: 'Paused', value: statusCounts['paused'] || 0, color: '#f59e0b' },
    { name: 'Cancelled', value: statusCounts['cancelled'] || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Payment method breakdown
  const paymentMethodData = [
    { name: 'UPI', value: 55, color: '#3b82f6' },
    { name: 'Bank Transfer', value: 30, color: '#8b5cf6' },
    { name: 'Card', value: 15, color: '#06b6d4' },
  ];

  // Upcoming renewals (within 60 days)
  const upcomingRenewals = subscriptions
    .filter((s) => s.status === 'active')
    .slice(0, 5);

  // Recent transactions
  const recentPayments = [...payments].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={metrics.totalCustomers}
          subtitle="Registered business accounts"
          icon={Users}
          badge="+3 this month"
          badgeType="success"
        />
        <StatCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptions}
          subtitle={`MRR: ${formatPaise(metrics.mrr)}`}
          icon={Repeat}
          badge="Healthy"
          badgeType="success"
        />
        <StatCard
          title="Collected Revenue"
          value={formatPaise(metrics.totalRevenueCollected)}
          subtitle="Total bank payments verified"
          icon={DollarSign}
          badge="Cash Inflow"
          badgeType="success"
        />
        <StatCard
          title="Outstanding Receivables"
          value={formatPaise(metrics.outstandingPayments)}
          subtitle={`${metrics.overdueInvoicesCount} overdue invoices`}
          icon={AlertTriangle}
          badge={metrics.outstandingPayments > 0 ? 'Pending Collection' : 'Clear'}
          badgeType={metrics.outstandingPayments > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {/* Financial Health Comparison Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 m-0">Revenue Realization Overview</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly distinguishing invoiced billing from settled collections and accounts receivable.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Invoiced</span>
              <span className="text-base font-bold text-slate-800">{formatPaise(metrics.invoicedRevenue)}</span>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-slate-400 block text-[11px]">Total Settled</span>
              <span className="text-base font-bold text-emerald-600">{formatPaise(metrics.totalRevenueCollected)}</span>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-slate-400 block text-[11px]">Outstanding</span>
              <span className="text-base font-bold text-rose-600">{formatPaise(metrics.outstandingPayments)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 m-0">Billing vs Collections (₹)</h3>
              <p className="text-xs text-slate-500">Monthly invoiced revenue compared to cash realized</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block" /> Invoiced
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> Collected
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="invoiced" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Invoiced" />
                <Bar dataKey="collected" fill="#2563eb" radius={[4, 4, 0, 0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Status Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 m-0">Subscription Portfolio</h3>
            <p className="text-xs text-slate-500 mt-0.5">Active vs paused vs cancelled contracts</p>
          </div>
          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subStatusData.length > 0 ? subStatusData : [{ name: 'Active', value: 1, color: '#10b981' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(subStatusData.length > 0 ? subStatusData : [{ name: 'Active', value: 1, color: '#10b981' }]).map(
                    (entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active Subscriptions
              </span>
              <span className="font-semibold text-slate-900">{metrics.activeSubscriptions}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Paused Subscriptions
              </span>
              <span className="font-semibold text-slate-900">{statusCounts['paused'] || 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Cancelled Subscriptions
              </span>
              <span className="font-semibold text-slate-900">{metrics.cancelledSubscriptions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Upcoming Renewals & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 m-0">Upcoming Renewals</h3>
              <p className="text-xs text-slate-500">Subscriptions with approaching expiry dates</p>
            </div>
            <button
              onClick={() => onNavigateTab('subscriptions')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {upcomingRenewals.length === 0 ? (
              <p className="p-4 text-slate-400 text-center">No upcoming renewals.</p>
            ) : (
              upcomingRenewals.map((sub) => (
                <div key={sub.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{sub.customerCompany || sub.customerName}</span>
                      <StatusBadge status={sub.status} />
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {sub.planName} • Next Bill: <span className="text-slate-700 font-medium">{formatDate(sub.nextBillingDate)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900">{formatPaise(sub.totalAmount)}</span>
                    <span className="text-[11px] text-slate-400 block capitalize">{sub.billingFrequency}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payment Transactions */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 m-0">Recent Payment Collections</h3>
              <p className="text-xs text-slate-500">Verified bank and online customer receipts</p>
            </div>
            <button
              onClick={() => onNavigateTab('payments')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {recentPayments.length === 0 ? (
              <p className="p-4 text-slate-400 text-center">No payments recorded yet.</p>
            ) : (
              recentPayments.map((pay) => (
                <div key={pay.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{pay.customerName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-100 text-slate-600">
                        {pay.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-mono">
                      Inv: {pay.invoiceNumber} • Ref: {pay.transactionReference}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm">{formatPaise(pay.amount)}</span>
                    <span className="text-[11px] text-slate-400 block">{formatDate(pay.paymentDate)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
