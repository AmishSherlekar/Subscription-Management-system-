import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Download, Printer } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useSystemStore } from '@/store';
import { formatPaise } from '@/utils/money';

export const ReportsPage: React.FC = () => {
  const { getMetrics, subscriptions, invoices, payments, products } = useSystemStore();
  const metrics = getMetrics();

  const handlePrint = () => {
    window.print();
  };

  // Product revenue aggregation
  const productRevenueMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    if (inv.status !== 'cancelled') {
      inv.items.forEach((it) => {
        productRevenueMap[it.productName] = (productRevenueMap[it.productName] || 0) + it.lineSubtotal;
      });
    }
  });

  const productBreakdown = Object.entries(productRevenueMap).map(([name, total]) => ({
    name,
    total,
  }));

  // Revenue projection data
  const projectionData = [
    { period: 'Q1', revenue: 145000 },
    { period: 'Q2', revenue: 185000 },
    { period: 'Q3', revenue: 240000 },
    { period: 'Q4 (Projected)', revenue: Math.round((metrics.mrr * 3) / 100) },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 m-0">Quarterly & Annual Financial Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Brightloop executive overview: revenue recognition, receivables aging, and annual run rate.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5" /> Print Financial Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Monthly Recurring Revenue (MRR)
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{formatPaise(metrics.mrr)}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Predictable recurring base</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Annual Run Rate (ARR)
          </span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{formatPaise(metrics.arr)}</span>
          <span className="text-[11px] text-slate-500">MRR × 12 months</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Cash Realized (Paid)
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {formatPaise(metrics.totalRevenueCollected)}
          </span>
          <span className="text-[11px] text-slate-500">Direct settled funds</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Accounts Receivable
          </span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">
            {formatPaise(metrics.outstandingPayments)}
          </span>
          <span className="text-[11px] text-rose-500">Uncollected invoice balance</span>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quarterly Trend Line */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-900 m-0 mb-1">Quarterly Growth Trajectory (₹)</h3>
          <p className="text-xs text-slate-500 mb-4">Historical and projected quarter performance</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Product Module Table */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 m-0 mb-1">Revenue by Software Module</h3>
            <p className="text-xs text-slate-500 mb-3">Gross billed volume per product family</p>
            <div className="divide-y divide-slate-100 text-xs">
              {productBreakdown.length === 0 ? (
                <p className="text-slate-400 py-4">No product sales data yet.</p>
              ) : (
                productBreakdown.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <span className="font-bold text-slate-900">{formatPaise(item.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Total Product Invoiced:</span>
            <strong className="text-slate-800 font-bold">{formatPaise(metrics.invoicedRevenue)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
