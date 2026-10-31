import React, { useState } from 'react';
import { Search, CreditCard, Building2, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useSystemStore } from '@/store';
import { formatPaise } from '@/utils/money';
import { formatDate } from '@/utils/date';

export const PaymentsPage: React.FC = () => {
  const { payments } = useSystemStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredPayments = payments.filter((pay) => {
    const matchesSearch =
      pay.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pay.transactionReference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod = methodFilter === 'all' || pay.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const totalCollected = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Top filter and summary bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search payment #, invoice #, customer, UTR ref..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="p-1.5 rounded-md border border-slate-300 text-xs bg-white text-slate-700"
          >
            <option value="all">All Payment Methods</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-md text-xs">
          <span>Total Filtered Collections:</span>
          <strong className="text-emerald-900 font-bold">{formatPaise(totalCollected)}</strong>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-3 px-4 font-semibold">Receipt No</th>
                <th className="py-3 px-4 font-semibold">Invoice Ref</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Payment Method</th>
                <th className="py-3 px-4 font-semibold">UTR / Txn Reference</th>
                <th className="py-3 px-4 font-semibold">Payment Date</th>
                <th className="py-3 px-4 font-semibold">Recorded By</th>
                <th className="py-3 px-4 font-semibold text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {pay.paymentNumber}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-blue-600">
                      {pay.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{pay.customerName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-slate-100 text-slate-700">
                        {pay.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {pay.transactionReference}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(pay.paymentDate)}</td>
                    <td className="py-3 px-4 text-slate-500">{pay.recordedByName}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 text-sm">
                      {formatPaise(pay.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
