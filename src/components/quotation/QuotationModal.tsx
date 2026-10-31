import React, { useState } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useSystemStore } from '../../store';
import { formatPaise, paiseToRupees } from '../../utils/money';
import { toISODate } from '../../utils/date';
import { addDays } from 'date-fns';
import type { QuotationItem } from '../../types';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { customers, products, plans, taxRules, discountRules, createQuotation } = useSystemStore();

  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || '');
  const [planId, setPlanId] = useState<string>(plans[0]?.id || '');
  const [discountRuleId, setDiscountRuleId] = useState<string>('');
  const [taxRuleId, setTaxRuleId] = useState<string>(taxRules[0]?.id || '');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30 Days');
  const [validityDate, setValidityDate] = useState<string>(toISODate(addDays(new Date(), 30)));
  const [notes, setNotes] = useState<string>('Standard commercial proposal for Brightloop Software.');

  // Items
  const [items, setItems] = useState<
    {
      productId: string;
      variantId?: string;
      quantity: number;
    }[]
  >([
    {
      productId: products[0]?.id || '',
      variantId: products[0]?.variants[0]?.id || '',
      quantity: 1,
    },
  ]);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Add line item
  const handleAddItem = () => {
    if (products.length > 0) {
      setItems([
        ...items,
        {
          productId: products[0].id,
          variantId: products[0].variants[0]?.id || '',
          quantity: 1,
        },
      ]);
    }
  };

  // Remove line item
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Calculate live preview totals
  let calculatedSubtotal = 0;
  const processedItems: QuotationItem[] = items.map((line) => {
    const prod = products.find((p) => p.id === line.productId);
    const variant = prod?.variants.find((v) => v.id === line.variantId);
    const unitPrice = (prod?.basePrice || 0) + (variant?.additionalPrice || 0);
    const lineTotal = unitPrice * line.quantity;
    calculatedSubtotal += lineTotal;

    return {
      productId: line.productId,
      variantId: line.variantId,
      productName: prod ? prod.name : 'Unknown Product',
      variantName: variant ? `${variant.attributeName}: ${variant.attributeValue}` : undefined,
      unitPrice,
      quantity: line.quantity,
      discountAmount: 0,
      taxRatePercent: 18,
      taxAmount: Math.round((lineTotal * 18) / 100),
      totalAmount: lineTotal + Math.round((lineTotal * 18) / 100),
    };
  });

  // Calculate discount
  let calculatedDiscount = 0;
  if (discountRuleId) {
    const rule = discountRules.find((d) => d.id === discountRuleId && d.isEnabled);
    if (rule && calculatedSubtotal >= rule.minPurchaseAmount) {
      if (rule.type === 'percentage') {
        calculatedDiscount = Math.round((calculatedSubtotal * rule.value) / 100);
      } else {
        calculatedDiscount = Math.min(calculatedSubtotal, rule.value);
      }
    }
  }

  const taxableAmount = Math.max(0, calculatedSubtotal - calculatedDiscount);
  const selectedTax = taxRules.find((t) => t.id === taxRuleId);
  const taxRate = selectedTax ? selectedTax.ratePercent : 0;
  const calculatedTax = Math.round((taxableAmount * taxRate) / 100);
  const calculatedGrandTotal = taxableAmount + calculatedTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (!planId) {
      setError('Please select a subscription plan.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    try {
      createQuotation({
        customerId,
        planId,
        items: processedItems,
        paymentTerms,
        validityDate,
        notes,
        discountRuleId: discountRuleId || undefined,
        taxRuleId: taxRuleId || undefined,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create quotation');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Quotation" maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded">
            {error}
          </div>
        )}

        {/* Customer & Plan Select */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Select Customer <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500 text-xs"
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.companyName} ({c.customerNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Subscription Plan <span className="text-rose-500">*</span>
            </label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500 text-xs"
              required
            >
              <option value="">-- Choose Plan --</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.planName} ({p.billingFrequency} - {formatPaise(p.price)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items Builder */}
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">Quotation Line Items</span>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product Line
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => {
              const prod = products.find((p) => p.id === item.productId);
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-slate-200"
                >
                  <div className="col-span-5">
                    <label className="text-[10px] text-slate-500 uppercase font-medium">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const newProdId = e.target.value;
                        const newProd = products.find((p) => p.id === newProdId);
                        const newItems = [...items];
                        newItems[idx] = {
                          productId: newProdId,
                          variantId: newProd?.variants[0]?.id || '',
                          quantity: 1,
                        };
                        setItems(newItems);
                      }}
                      className="w-full p-1.5 rounded border border-slate-300 text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatPaise(p.basePrice)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4">
                    <label className="text-[10px] text-slate-500 uppercase font-medium">Variant</label>
                    {prod && prod.hasVariants && prod.variants.length > 0 ? (
                      <select
                        value={item.variantId}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].variantId = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-full p-1.5 rounded border border-slate-300 text-xs"
                      >
                        {prod.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.attributeValue} (+{formatPaise(v.additionalPrice)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-1.5 text-slate-400 italic text-xs">Standard (No Variant)</div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-500 uppercase font-medium">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                        setItems(newItems);
                      }}
                      className="w-full p-1.5 rounded border border-slate-300 text-xs text-center"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center pt-3">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Taxes, Discounts, Terms */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Applicable Tax Rule</label>
            <select
              value={taxRuleId}
              onChange={(e) => setTaxRuleId(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 bg-white text-xs"
            >
              {taxRules.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.ratePercent}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Discount Coupon</label>
            <select
              value={discountRuleId}
              onChange={(e) => setDiscountRuleId(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 bg-white text-xs"
            >
              <option value="">No Discount</option>
              {discountRules
                .filter((d) => d.isEnabled)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name} ({d.type === 'percentage' ? `${d.value}%` : formatPaise(d.value)})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Validity Expiry Date</label>
            <input
              type="date"
              value={validityDate}
              onChange={(e) => setValidityDate(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 text-xs"
              required
            />
          </div>
        </div>

        {/* Payment Terms & Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Payment Terms</label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 text-xs"
              placeholder="e.g. Net 15 Days or Immediate"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Notes / Terms</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded border border-slate-300 text-xs"
              placeholder="Customer proposal notes"
            />
          </div>
        </div>

        {/* Financial Calculation Live Preview */}
        <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-xs">Total Preview:</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500">Subtotal: </span>
              <span className="font-semibold text-slate-800">{formatPaise(calculatedSubtotal)}</span>
            </div>
            {calculatedDiscount > 0 && (
              <div>
                <span className="text-emerald-600">Discount: </span>
                <span className="font-semibold text-emerald-700">-{formatPaise(calculatedDiscount)}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Tax ({taxRate}%): </span>
              <span className="font-semibold text-slate-800">{formatPaise(calculatedTax)}</span>
            </div>
            <div className="text-sm font-bold text-blue-700 border-l border-blue-200 pl-4">
              Grand Total: {formatPaise(calculatedGrandTotal)}
            </div>
          </div>
        </div>

        {/* Form Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
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
            Create Quotation
          </button>
        </div>
      </form>
    </Modal>
  );
};
