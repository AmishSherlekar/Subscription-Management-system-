import React, { useState } from 'react';
import {
  UserCircle2,
  Calendar,
  Repeat,
  FileText,
  CreditCard,
  Download,
  Eye,
  AlertCircle,
  Clock,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useSystemStore } from '@/store';
import { StatusBadge } from '@/components/common/Badge';
import { InvoiceViewModal } from '@/components/invoice/InvoiceViewModal';
import { Modal } from '@/components/common/Modal';
import { formatPaise } from '@/utils/money';
import { formatDate } from '@/utils/date';
import type { Invoice, Subscription } from '@/types';

export const CustomerPortalPage: React.FC = () => {
  const {
    currentUser,
    customers,
    subscriptions,
    invoices,
    payments,
    submitCustomerRequest,
  } = useSystemStore();

  // If currently simulated customer or user with customerId
  const activeCustomerId = currentUser.customerId || 'cust-001';
  const customer = customers.find((c) => c.id === activeCustomerId) || customers[0];

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [requestModalSub, setRequestModalSub] = useState<Subscription | null>(null);
  const [requestType, setRequestType] = useState<'renewal' | 'pause' | 'cancellation'>('renewal');
  const [requestReason, setRequestReason] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  // Filter ONLY this customer's data (Strict Isolation!)
  const mySubscriptions = subscriptions.filter((s) => s.customerId === customer?.id);
  const myInvoices = invoices.filter((i) => i.customerId === customer?.id);
  const myPayments = payments.filter((p) => p.customerId === customer?.id);

  const handleOpenRequest = (sub: Subscription, type: 'renewal' | 'pause' | 'cancellation') => {
    setRequestModalSub(sub);
    setRequestType(type);
    setRequestReason('');
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalSub) return;

    submitCustomerRequest(requestModalSub.id, requestType, requestReason);
    setSubmittedMsg(`Your ${requestType} request has been submitted to Brightloop support.`);
    setRequestModalSub(null);
    setTimeout(() => setSubmittedMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Customer Header Welcome Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
              {customer?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 m-0">
                Welcome, {customer?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {customer?.companyName} • Account: <span className="font-mono">{customer?.customerNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Active Plans</span>
              <span className="font-bold text-slate-800 text-sm">
                {mySubscriptions.filter((s) => s.status === 'active').length} Active
              </span>
            </div>
            <div className="text-right border-l border-slate-200 pl-4">
              <span className="text-slate-400 block text-[11px]">Pending Due</span>
              <span className="font-bold text-rose-600 text-sm">
                {formatPaise(myInvoices.reduce((acc, i) => acc + i.outstandingBalance, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {submittedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submittedMsg}</span>
        </div>
      )}

      {/* Subscriptions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 m-0">
            <Repeat className="w-4 h-4 text-blue-600" />
            My Active Subscriptions & Plans
          </h3>
          <span className="text-xs text-slate-400">Total: {mySubscriptions.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mySubscriptions.length === 0 ? (
            <div className="col-span-2 p-8 bg-white rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
              No subscriptions linked to this customer account.
            </div>
          ) : (
            mySubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-slate-500">{sub.subscriptionNumber}</span>
                      <h4 className="text-sm font-semibold text-slate-900 mt-1">{sub.planName}</h4>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  <div className="my-3 py-2 border-y border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Billing Cycle</span>
                      <span className="font-medium text-slate-800 capitalize">{sub.billingFrequency}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Cycle Fee</span>
                      <span className="font-bold text-slate-900">{formatPaise(sub.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Current Period:</span>
                      <span>{formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Next Scheduled Bill:</span>
                      <span className="font-semibold text-blue-600">{formatDate(sub.nextBillingDate)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Subscription Expiry:</span>
                      <span className="font-medium text-slate-800">{formatDate(sub.expiryDate)}</span>
                    </p>
                  </div>
                </div>

                {/* Self Service Request Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Self-Service:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenRequest(sub, 'renewal')}
                      className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                    >
                      Request Renewal
                    </button>
                    {sub.allowPause && sub.status === 'active' && (
                      <button
                        onClick={() => handleOpenRequest(sub, 'pause')}
                        className="px-2.5 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100"
                      >
                        Request Pause
                      </button>
                    )}
                    {sub.allowEarlyClosure && (
                      <button
                        onClick={() => handleOpenRequest(sub, 'cancellation')}
                        className="px-2.5 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoices & Statements Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 m-0">
            <FileText className="w-4 h-4 text-emerald-600" />
            My Invoices & Receipts
          </h3>
          <span className="text-xs text-slate-400">Total: {myInvoices.length}</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-4 font-semibold">Invoice No</th>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Due Date</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Invoice Total</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Balance Due</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No invoices issued yet.
                    </td>
                  </tr>
                ) : (
                  myInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-2.5 px-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="py-2.5 px-4 text-right font-medium text-slate-900">
                        {formatPaise(inv.grandTotal)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        {inv.outstandingBalance > 0 ? (
                          <span className="text-rose-600">{formatPaise(inv.outstandingBalance)}</span>
                        ) : (
                          <span className="text-emerald-600">₹0.00</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2 py-1 text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 rounded font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View / PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      <InvoiceViewModal
        isOpen={!!selectedInvoice}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        canRecordPayment={false}
      />

      {/* Self-service Request Modal */}
      {requestModalSub && (
        <Modal
          isOpen={!!requestModalSub}
          onClose={() => setRequestModalSub(null)}
          title={`Submit ${requestType.toUpperCase()} Request`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
            <p className="text-slate-600">
              You are requesting to <strong>{requestType}</strong> subscription{' '}
              <span className="font-mono font-medium text-slate-800">
                {requestModalSub.subscriptionNumber}
              </span>{' '}
              ({requestModalSub.planName}).
            </p>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Reason or Notes for Operations Team:
              </label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Optional explanation for our billing team"
                rows={3}
                className="w-full p-2 rounded border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRequestModalSub(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit Request
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
