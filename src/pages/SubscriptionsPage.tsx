import React, { useState } from 'react';
import {
  Repeat,
  Pause,
  Play,
  XCircle,
  RefreshCw,
  FilePlus,
  History,
  Eye,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useSystemStore } from '@/store';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/Badge';
import { formatPaise } from '@/utils/money';
import { formatDate } from '@/utils/date';
import type { Subscription } from '@/types';

interface SubscriptionsPageProps {
  onNavigateTab: (tab: string) => void;
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({ onNavigateTab }) => {
  const {
    subscriptions,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    renewSubscription,
    generateManualInvoiceForSubscription,
    currentUser,
  } = useSystemStore();

  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePause = (id: string) => {
    const reason = prompt('Please enter pause reason:');
    if (reason === null) return;
    const res = pauseSubscription(id, reason);
    if (res.success) {
      setNotification({ type: 'success', text: 'Subscription paused successfully.' });
    } else {
      setNotification({ type: 'error', text: res.error || 'Failed to pause.' });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleResume = (id: string) => {
    const res = resumeSubscription(id);
    if (res.success) {
      setNotification({ type: 'success', text: 'Subscription resumed to active status.' });
    } else {
      setNotification({ type: 'error', text: res.error || 'Failed to resume.' });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCancel = (id: string) => {
    const reason = prompt('Please enter cancellation reason:');
    if (reason === null) return;
    const res = cancelSubscription(id, reason);
    if (res.success) {
      setNotification({ type: 'success', text: 'Subscription has been cancelled.' });
    } else {
      setNotification({ type: 'error', text: res.error || 'Failed to cancel.' });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRenew = (id: string) => {
    const res = renewSubscription(id);
    if (res.success) {
      setNotification({ type: 'success', text: 'Subscription renewed! Expiry extended by 1 year.' });
    } else {
      setNotification({ type: 'error', text: res.error || 'Failed to renew.' });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGenerateInvoice = (id: string) => {
    const res = generateManualInvoiceForSubscription(id);
    if (res.success && res.invoice) {
      setNotification({
        type: 'success',
        text: `Invoice ${res.invoice.invoiceNumber} generated! Idempotency key verified.`,
      });
    } else {
      setNotification({ type: 'error', text: res.error || 'Failed to generate invoice.' });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Manage customer active contracts, billing schedules, pause/resumptions, and automatic renewals.
          </p>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Subscriptions Master Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-3 px-4 font-semibold">Sub No</th>
                <th className="py-3 px-4 font-semibold">Customer & Company</th>
                <th className="py-3 px-4 font-semibold">Plan & Frequency</th>
                <th className="py-3 px-4 font-semibold">Next Billing</th>
                <th className="py-3 px-4 font-semibold">Expiry Date</th>
                <th className="py-3 px-4 font-semibold text-right">Cycle Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No subscriptions found. Convert a quotation or create one directly.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {sub.subscriptionNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{sub.customerName}</p>
                      <p className="text-[11px] text-slate-500">{sub.customerCompany}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium">{sub.planName}</p>
                      <span className="text-[11px] text-blue-600 capitalize">{sub.billingFrequency}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {formatDate(sub.nextBillingDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(sub.expiryDate)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatPaise(sub.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={sub.status} />
                      {sub.customerRequests && sub.customerRequests.some((r) => r.status === 'pending') && (
                        <span className="block text-[10px] text-amber-700 font-semibold mt-0.5 animate-pulse">
                          Req Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* View Details */}
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="px-2 py-1 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                        title="View Subscription"
                      >
                        <Eye className="w-3.5 h-3.5 inline" />
                      </button>

                      {/* Manual Invoice Generation */}
                      {sub.status === 'active' && currentUser.role !== 'customer' && (
                        <button
                          onClick={() => handleGenerateInvoice(sub.id)}
                          className="px-2 py-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded font-medium"
                          title="Generate Next Invoice"
                        >
                          <FilePlus className="w-3.5 h-3.5 inline mr-1" />
                          Invoice
                        </button>
                      )}

                      {/* Pause / Resume */}
                      {sub.status === 'active' && sub.allowPause && currentUser.role !== 'customer' && (
                        <button
                          onClick={() => handlePause(sub.id)}
                          className="px-2 py-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded"
                          title="Pause Subscription"
                        >
                          <Pause className="w-3 h-3 inline" /> Pause
                        </button>
                      )}

                      {sub.status === 'paused' && currentUser.role !== 'customer' && (
                        <button
                          onClick={() => handleResume(sub.id)}
                          className="px-2 py-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded"
                          title="Resume Subscription"
                        >
                          <Play className="w-3 h-3 inline" /> Resume
                        </button>
                      )}

                      {/* Renew */}
                      {sub.allowRenewal && currentUser.role !== 'customer' && (
                        <button
                          onClick={() => handleRenew(sub.id)}
                          className="px-2 py-1 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                          title="Renew Contract"
                        >
                          <RefreshCw className="w-3 h-3 inline" /> Renew
                        </button>
                      )}

                      {/* Cancel */}
                      {sub.status === 'active' && sub.allowEarlyClosure && currentUser.role !== 'customer' && (
                        <button
                          onClick={() => handleCancel(sub.id)}
                          className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded"
                          title="Cancel Subscription"
                        >
                          <XCircle className="w-3.5 h-3.5 inline" />
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

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Subscription: ${selectedSub.subscriptionNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {selectedSub.customerCompany || selectedSub.customerName}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Plan: {selectedSub.planName} • Billing: {selectedSub.billingFrequency}
                </p>
              </div>
              <StatusBadge status={selectedSub.status} />
            </div>

            {/* Dates & Financials */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 p-3 bg-white rounded border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">Contract Period</span>
                <p className="text-slate-600">Start Date: <span className="font-medium text-slate-800">{formatDate(selectedSub.startDate)}</span></p>
                <p className="text-slate-600">Next Billing: <span className="font-semibold text-blue-600">{formatDate(selectedSub.nextBillingDate)}</span></p>
                <p className="text-slate-600">Expiry Date: <span className="font-medium text-slate-800">{formatDate(selectedSub.expiryDate)}</span></p>
                <p className="text-slate-600">Renewals Completed: <span className="font-medium text-slate-800">{selectedSub.renewalCount}</span></p>
              </div>

              <div className="space-y-1 p-3 bg-white rounded border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">Billing Amounts</span>
                <p className="text-slate-600">Subtotal: <span className="font-medium text-slate-800">{formatPaise(selectedSub.subtotal)}</span></p>
                {selectedSub.discountAmount > 0 && (
                  <p className="text-emerald-600">Discount: <span>-{formatPaise(selectedSub.discountAmount)}</span></p>
                )}
                <p className="text-slate-600">Tax ({selectedSub.taxRatePercent}%): <span className="font-medium text-slate-800">{formatPaise(selectedSub.taxAmount)}</span></p>
                <p className="text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                  Total per Cycle: {formatPaise(selectedSub.totalAmount)}
                </p>
              </div>
            </div>

            {/* Line items snapshot */}
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Contract Line Items:</span>
              <div className="border border-slate-200 rounded divide-y divide-slate-100">
                {selectedSub.items.map((it, idx) => (
                  <div key={idx} className="p-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">{it.productName}</p>
                      {it.variantName && <p className="text-[11px] text-slate-500">{it.variantName}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-700 font-semibold">{formatPaise(it.unitPrice)}</span>
                      <span className="text-[11px] text-slate-400 block">Qty: {it.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer portal requests if any */}
            {selectedSub.customerRequests && selectedSub.customerRequests.length > 0 && (
              <div className="p-3 bg-amber-50 rounded border border-amber-200">
                <span className="font-semibold text-amber-800 block mb-1">Customer Portal Requests:</span>
                {selectedSub.customerRequests.map((req, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-800">
                      Request: <strong className="capitalize">{req.type}</strong> ({req.reason || 'No reason provided'})
                    </span>
                    <span className="text-amber-700 font-semibold capitalize">{req.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Audit History Log */}
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Lifecycle Audit Trail:</span>
              <div className="p-2 bg-slate-50 rounded border border-slate-200 space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
                {selectedSub.history.map((hist) => (
                  <div key={hist.id} className="text-slate-600">
                    <span className="text-slate-400">[{new Date(hist.timestamp).toLocaleDateString()}]</span>{' '}
                    <strong className="text-slate-800">{hist.action}</strong> by {hist.performedBy}
                    {hist.details ? ` - ${hist.details}` : ''}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedSub(null);
                  onNavigateTab('invoices');
                }}
                className="text-blue-600 hover:underline"
              >
                View Linked Invoices →
              </button>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
