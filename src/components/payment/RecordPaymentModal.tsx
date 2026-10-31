import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { formatPaise, rupeesToPaise, paiseToRupees } from '../../utils/money';
import { useSystemStore } from '../../store';
import type { Invoice, PaymentMethod } from '../../types';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { recordPayment } = useSystemStore();

  const [amountRupees, setAmountRupees] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form default amount when opened
  React.useEffect(() => {
    if (invoice) {
      setAmountRupees(paiseToRupees(invoice.outstandingBalance));
      setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
      setError(null);
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountInPaise = rupeesToPaise(amountRupees);
    if (amountInPaise <= 0) {
      setError('Please enter a payment amount greater than zero.');
      return;
    }

    if (amountInPaise > invoice.outstandingBalance) {
      setError(
        `Amount cannot exceed outstanding balance of ${formatPaise(invoice.outstandingBalance)}.`
      );
      return;
    }

    const res = recordPayment({
      invoiceId: invoice.id,
      amount: amountInPaise,
      paymentMethod,
      transactionReference: transactionRef,
      notes,
    });

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to record payment.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${invoice.invoiceNumber}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Invoice Summary Box */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Customer:</span>
            <span className="font-semibold text-slate-800">{invoice.customerName}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Invoice Total:</span>
            <span>{formatPaise(invoice.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Already Paid:</span>
            <span className="text-emerald-600 font-medium">{formatPaise(invoice.amountPaid)}</span>
          </div>
          <div className="flex justify-between text-rose-700 font-semibold pt-1 border-t border-slate-200">
            <span>Outstanding Balance:</span>
            <span>{formatPaise(invoice.outstandingBalance)}</span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded">
            {error}
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            Payment Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 font-semibold">₹</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={paiseToRupees(invoice.outstandingBalance)}
              value={amountRupees}
              onChange={(e) => setAmountRupees(parseFloat(e.target.value) || 0)}
              className="w-full pl-7 pr-3 py-2 rounded border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold"
              required
            />
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setAmountRupees(paiseToRupees(invoice.outstandingBalance))}
              className="text-[11px] text-blue-600 hover:underline"
            >
              Pay Full Balance ({formatPaise(invoice.outstandingBalance)})
            </button>
            {invoice.outstandingBalance > 10000 && (
              <button
                type="button"
                onClick={() => setAmountRupees(paiseToRupees(Math.round(invoice.outstandingBalance / 2)))}
                className="text-[11px] text-slate-500 hover:underline"
              >
                Pay 50%
              </button>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            Payment Method <span className="text-rose-500">*</span>
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full p-2 rounded border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
          >
            <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
            <option value="bank_transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
            <option value="card">Credit / Debit Card</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Transaction Reference */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            Transaction / UTR Reference <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. UPI-9988112233"
            className="w-full p-2 rounded border border-slate-300 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block font-medium text-slate-700 mb-1">Internal Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional verification note or bank statement receipt info"
            rows={2}
            className="w-full p-2 rounded border border-slate-300 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
          >
            Confirm & Save Payment
          </button>
        </div>
      </form>
    </Modal>
  );
};
