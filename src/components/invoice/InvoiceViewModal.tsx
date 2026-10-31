import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer, Download, CreditCard, Building2, Calendar, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import { formatPaise } from '../../utils/money';
import { formatDate } from '../../utils/date';
import type { Invoice } from '../../types';

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment?: (invoice: Invoice) => void;
  canRecordPayment?: boolean;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onOpenRecordPayment,
  canRecordPayment = true,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('Brightloop Software Solutions Pvt Ltd', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('GSTIN: 29AAACB1234F1Z1 | Support: billing@brightloop.com', 14, 26);
    doc.text('Level 4, Prestige Tech Park, Bengaluru, Karnataka 560103', 14, 31);

    // Invoice Meta
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`INVOICE: ${invoice.invoiceNumber}`, 14, 45);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, 14, 52);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 14, 58);
    doc.text(`Billing Period: ${formatDate(invoice.billingPeriodStart)} to ${formatDate(invoice.billingPeriodEnd)}`, 14, 64);
    doc.text(`Subscription Ref: ${invoice.subscriptionNumber}`, 14, 70);

    // Bill To
    doc.setFontSize(12);
    doc.text('Billed To:', 120, 45);
    doc.setFontSize(10);
    doc.text(invoice.customerCompany || invoice.customerName, 120, 52);
    doc.text(`Attn: ${invoice.customerName}`, 120, 58);
    doc.text(invoice.customerEmail, 120, 64);
    if (invoice.customerGstin) {
      doc.text(`GSTIN: ${invoice.customerGstin}`, 120, 70);
    }

    // Line Items Table
    const tableData = invoice.items.map((it, idx) => [
      String(idx + 1),
      it.variantName ? `${it.productName} (${it.variantName})` : it.productName,
      String(it.quantity),
      formatPaise(it.unitPrice),
      formatPaise(it.lineSubtotal),
      `${it.taxRatePercent}%`,
      formatPaise(it.totalAmount),
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['#', 'Description', 'Qty', 'Unit Price', 'Subtotal', 'Tax', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 9 },
    });

    // Totals Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Subtotal:`, 130, finalY);
    doc.text(formatPaise(invoice.subtotal), 180, finalY, { align: 'right' });

    if (invoice.discountTotal > 0) {
      doc.text(`Discount:`, 130, finalY + 6);
      doc.text(`-${formatPaise(invoice.discountTotal)}`, 180, finalY + 6, { align: 'right' });
    }

    doc.text(`Tax (${invoice.taxRuleName}):`, 130, finalY + 12);
    doc.text(formatPaise(invoice.taxTotal), 180, finalY + 12, { align: 'right' });

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Grand Total:`, 130, finalY + 20);
    doc.text(formatPaise(invoice.grandTotal), 180, finalY + 20, { align: 'right' });

    doc.setFontSize(10);
    doc.text(`Amount Paid:`, 130, finalY + 26);
    doc.text(formatPaise(invoice.amountPaid), 180, finalY + 26, { align: 'right' });

    doc.setFontSize(11);
    doc.setTextColor(225, 29, 72);
    doc.text(`Outstanding Balance:`, 130, finalY + 34);
    doc.text(formatPaise(invoice.outstandingBalance), 180, finalY + 34, { align: 'right' });

    // Save PDF
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice ${invoice.invoiceNumber}`} maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} />
            <span className="text-xs text-slate-500 font-mono">ID: {invoice.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            {canRecordPayment && invoice.outstandingBalance > 0 && onOpenRecordPayment && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(invoice);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-2xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Invoice Printable Document */}
        <div className="border border-slate-200 rounded-lg p-6 bg-white space-y-6 text-sm">
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 m-0">Brightloop Software Solutions Pvt Ltd</h2>
              <p className="text-xs text-slate-500 mt-1">Level 4, Prestige Tech Park, Outer Ring Road</p>
              <p className="text-xs text-slate-500">Bengaluru, Karnataka 560103, India</p>
              <p className="text-xs text-slate-500">GSTIN: 29AAACB1234F1Z1 | contact@brightloop.com</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold tracking-tight text-blue-600 block">TAX INVOICE</span>
              <span className="font-mono text-sm font-semibold text-slate-800">{invoice.invoiceNumber}</span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-6 pb-4 border-b border-slate-100 text-xs">
            <div>
              <p className="font-semibold text-slate-500 uppercase tracking-wider mb-1">Billed To:</p>
              <p className="font-semibold text-slate-900 text-sm">{invoice.customerCompany || invoice.customerName}</p>
              <p className="text-slate-600">Attn: {invoice.customerName}</p>
              <p className="text-slate-600">{invoice.customerEmail}</p>
              {invoice.customerAddress && (
                <p className="text-slate-600">
                  {invoice.customerAddress.street}, {invoice.customerAddress.city}, {invoice.customerAddress.state} - {invoice.customerAddress.postalCode}
                </p>
              )}
              {invoice.customerGstin && (
                <p className="text-slate-700 font-mono mt-1 font-medium">GSTIN: {invoice.customerGstin}</p>
              )}
            </div>

            <div className="space-y-1 text-right">
              <p className="text-slate-600">
                <span className="text-slate-400">Invoice Date:</span> <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
              </p>
              <p className="text-slate-600">
                <span className="text-slate-400">Due Date:</span> <span className="font-medium">{formatDate(invoice.dueDate)}</span>
              </p>
              <p className="text-slate-600">
                <span className="text-slate-400">Subscription Ref:</span>{' '}
                <span className="font-mono font-medium text-blue-600">{invoice.subscriptionNumber}</span>
              </p>
              <p className="text-slate-600">
                <span className="text-slate-400">Billing Period:</span>{' '}
                <span>{formatDate(invoice.billingPeriodStart)} to {formatDate(invoice.billingPeriodEnd)}</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold">Item & Description</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Qty</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Tax Rate</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-800">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-[11px] text-slate-500 font-normal">Variant: {item.variantName}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right">{formatPaise(item.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-right">{item.taxRatePercent}%</td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatPaise(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatPaise(invoice.subtotal)}</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>-{formatPaise(invoice.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax ({invoice.taxRuleName}):</span>
                <span>{formatPaise(invoice.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>{formatPaise(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="text-emerald-700 font-medium">{formatPaise(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-rose-600 pt-1 border-t border-slate-100">
                <span>Outstanding Balance:</span>
                <span>{formatPaise(invoice.outstandingBalance)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Notes: </span>
              {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
