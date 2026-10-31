import React, { useState } from 'react';
import { Search, Eye, Printer, Download, CreditCard, XCircle, FileText } from 'lucide-react';
import { useSystemStore } from '@/store';
import { StatusBadge } from '@/components/common/Badge';
import { InvoiceViewModal } from '@/components/invoice/InvoiceViewModal';
import { RecordPaymentModal } from '@/components/payment/RecordPaymentModal';
import { formatPaise } from '@/utils/money';
import { formatDate } from '@/utils/date';
import type { Invoice, InvoiceStatus } from '@/types';

export const InvoicesPage: React.FC = () => {
  const { invoices, cancelInvoice, currentUser } = useSystemStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.subscriptionNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCancel = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this invoice?')) {
      cancelInvoice(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice #, customer, sub #..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 rounded-md border border-slate-300 text-xs bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed (Unpaid)</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Fully Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-3 px-4 font-semibold">Invoice No</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Sub Ref</th>
                <th className="py-3 px-4 font-semibold">Invoice Date</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
                <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                <th className="py-3 px-4 font-semibold text-right">Balance Due</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No invoices matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{inv.customerName}</p>
                      <p className="text-[11px] text-slate-500">{inv.customerCompany}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {inv.subscriptionNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {formatPaise(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {inv.outstandingBalance > 0 ? (
                        <span className="text-rose-600">{formatPaise(inv.outstandingBalance)}</span>
                      ) : (
                        <span className="text-emerald-600">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvoiceForView(inv)}
                        className="px-2 py-1 text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                        title="View & Download PDF"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        View
                      </button>

                      {inv.outstandingBalance > 0 &&
                        inv.status !== 'cancelled' &&
                        currentUser.role !== 'customer' && (
                          <button
                            onClick={() => setSelectedInvoiceForPayment(inv)}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-2xs"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5 inline mr-1" />
                            Pay
                          </button>
                        )}

                      {inv.status !== 'paid' &&
                        inv.status !== 'cancelled' &&
                        currentUser.role === 'admin' && (
                          <button
                            onClick={() => handleCancel(inv.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Cancel Invoice"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      <InvoiceViewModal
        isOpen={!!selectedInvoiceForView}
        invoice={selectedInvoiceForView}
        onClose={() => setSelectedInvoiceForView(null)}
        onOpenRecordPayment={(inv) => setSelectedInvoiceForPayment(inv)}
        canRecordPayment={currentUser.role !== 'customer'}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedInvoiceForPayment}
        invoice={selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
      />
    </div>
  );
};
