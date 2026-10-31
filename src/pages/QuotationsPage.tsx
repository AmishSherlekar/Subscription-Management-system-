import React, { useState } from 'react';
import { Plus, Check, ArrowRight, Eye, AlertCircle, FileCheck, FileSpreadsheet } from 'lucide-react';
import { useSystemStore } from '@/store';
import { QuotationModal } from '@/components/quotation/QuotationModal';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/Badge';
import { formatPaise } from '@/utils/money';
import { formatDate } from '@/utils/date';
import type { Quotation } from '@/types';

interface QuotationsPageProps {
  onNavigateTab: (tab: string) => void;
}

export const QuotationsPage: React.FC<QuotationsPageProps> = ({ onNavigateTab }) => {
  const {
    quotations,
    updateQuotationStatus,
    convertQuotationToSubscription,
    currentUser,
  } = useSystemStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConvert = (quotationId: string) => {
    const res = convertQuotationToSubscription(quotationId);
    if (res.success) {
      setActionMessage({
        type: 'success',
        text: `Quotation converted successfully! Active subscription & initial invoice created.`,
      });
      setTimeout(() => setActionMessage(null), 5000);
      if (selectedQuotation) {
        setSelectedQuotation(null);
      }
    } else {
      setActionMessage({
        type: 'error',
        text: res.error || 'Failed to convert quotation.',
      });
    }
  };

  const handleConfirm = (quotationId: string) => {
    updateQuotationStatus(quotationId, 'confirmed');
    setActionMessage({
      type: 'success',
      text: 'Quotation confirmed! Ready to convert to subscription.',
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Create commercial proposals, apply discounts, confirm client agreements, and convert to active subscriptions.
          </p>
        </div>
        {currentUser.role !== 'customer' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        )}
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Quotations Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-3 px-4 font-semibold">Quotation No</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Plan</th>
                <th className="py-3 px-4 font-semibold">Validity Date</th>
                <th className="py-3 px-4 font-semibold text-right">Grand Total</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No quotations found. Click "Create Quotation" to start.
                  </td>
                </tr>
              ) : (
                quotations.map((qt) => (
                  <tr key={qt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{qt.quotationNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{qt.customerName}</p>
                      <p className="text-[11px] text-slate-500">{qt.customerCompany}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{qt.planName}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(qt.validityDate)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatPaise(qt.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={qt.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedQuotation(qt)}
                        className="px-2 py-1 text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                      >
                        View
                      </button>

                      {qt.status === 'draft' && (
                        <button
                          onClick={() => handleConfirm(qt.id)}
                          className="px-2 py-1 text-[11px] text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded"
                        >
                          Confirm
                        </button>
                      )}

                      {qt.status === 'confirmed' && (
                        <button
                          onClick={() => handleConvert(qt.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs"
                        >
                          Convert to Sub <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {qt.status === 'converted' && qt.convertedSubscriptionId && (
                        <button
                          onClick={() => onNavigateTab('subscriptions')}
                          className="text-[11px] text-emerald-700 hover:underline"
                        >
                          View Sub →
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

      {/* Create Modal */}
      <QuotationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setActionMessage({
            type: 'success',
            text: 'Quotation created successfully!',
          });
          setTimeout(() => setActionMessage(null), 4000);
        }}
      />

      {/* View Quotation Detail Modal */}
      {selectedQuotation && (
        <Modal
          isOpen={!!selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          title={`Quotation: ${selectedQuotation.quotationNumber}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 text-sm block">
                  {selectedQuotation.customerCompany || selectedQuotation.customerName}
                </span>
                <span className="text-slate-500">Plan: {selectedQuotation.planName}</span>
              </div>
              <StatusBadge status={selectedQuotation.status} />
            </div>

            {/* Line items list */}
            <div>
              <span className="font-semibold text-slate-700 block mb-2">Proposal Items:</span>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedQuotation.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <p className="font-medium text-slate-800">{it.productName}</p>
                          {it.variantName && (
                            <p className="text-[11px] text-slate-500">{it.variantName}</p>
                          )}
                        </td>
                        <td className="p-2 text-center">{it.quantity}</td>
                        <td className="p-2 text-right">{formatPaise(it.unitPrice)}</td>
                        <td className="p-2 text-right font-medium">
                          {formatPaise(it.unitPrice * it.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-56 space-y-1.5 pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatPaise(selectedQuotation.subtotal)}</span>
                </div>
                {selectedQuotation.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatPaise(selectedQuotation.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax:</span>
                  <span>{formatPaise(selectedQuotation.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>{formatPaise(selectedQuotation.grandTotal)}</span>
                </div>
              </div>
            </div>

            {selectedQuotation.notes && (
              <p className="p-2 bg-slate-50 rounded text-slate-600 border border-slate-100">
                <span className="font-semibold text-slate-700">Notes:</span> {selectedQuotation.notes}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedQuotation(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Close
              </button>

              {selectedQuotation.status === 'confirmed' && (
                <button
                  type="button"
                  onClick={() => handleConvert(selectedQuotation.id)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
                >
                  Convert to Active Subscription
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
