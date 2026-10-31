import React, { useState } from 'react';
import { Plus, Percent, Tag, Check, X, ShieldAlert } from 'lucide-react';
import { useSystemStore } from '@/store';
import { Modal } from '@/components/common/Modal';
import { formatPaise, rupeesToPaise } from '@/utils/money';
import { formatDate, toISODate } from '@/utils/date';
import type { DiscountType } from '@/types';

export const TaxesDiscountsPage: React.FC = () => {
  const {
    taxRules,
    discountRules,
    products,
    addTaxRule,
    updateTaxRule,
    addDiscountRule,
    updateDiscountRule,
    currentUser,
  } = useSystemStore();

  const [activeTab, setActiveTab] = useState<'taxes' | 'discounts'>('taxes');
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Tax form
  const [taxName, setTaxName] = useState('');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(18);
  const [taxDesc, setTaxDesc] = useState('');

  // Discount form
  const [code, setCode] = useState('');
  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minPurchaseRupees, setMinPurchaseRupees] = useState<number>(1000);
  const [startDate, setStartDate] = useState(toISODate());
  const [endDate, setEndDate] = useState('2026-12-31');
  const [maxLimit, setMaxLimit] = useState<number>(100);

  const isAdmin = currentUser.role === 'admin';

  const handleAddTax = (e: React.FormEvent) => {
    e.preventDefault();
    addTaxRule({
      name: taxName,
      ratePercent: taxRatePercent,
      isEnabled: true,
      description: taxDesc,
    });
    setTaxName('');
    setTaxRatePercent(18);
    setTaxDesc('');
    setIsTaxModalOpen(false);
  };

  const handleAddDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const storedValue =
      discountType === 'fixed' ? rupeesToPaise(discountValue) : discountValue;

    addDiscountRule({
      code: code.toUpperCase().trim(),
      name: discountName,
      type: discountType,
      value: storedValue,
      minPurchaseAmount: rupeesToPaise(minPurchaseRupees),
      minQuantity: 1,
      startDate,
      endDate,
      maxUsageLimit: maxLimit || null,
      applicableProductIds: [],
      isWholeSubscription: true,
      isEnabled: true,
    });

    setCode('');
    setDiscountName('');
    setDiscountValue(10);
    setMinPurchaseRupees(1000);
    setIsDiscountModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('taxes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'taxes'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Configurable Tax Rules ({taxRules.length})
          </button>
          <button
            onClick={() => setActiveTab('discounts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'discounts'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Promotional Discount Codes ({discountRules.length})
          </button>
        </div>

        {isAdmin ? (
          activeTab === 'taxes' ? (
            <button
              onClick={() => setIsTaxModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs"
            >
              <Plus className="w-4 h-4" /> Add Tax Rule
            </button>
          ) : (
            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs"
            >
              <Plus className="w-4 h-4" /> Add Discount Coupon
            </button>
          )
        ) : (
          <span className="text-xs text-slate-400 italic flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Only Admin can modify tax & discount rules
          </span>
        )}
      </div>

      {/* Tax Rules View */}
      {activeTab === 'taxes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {taxRules.map((t) => (
            <div
              key={t.id}
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm m-0">{t.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      t.isEnabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {t.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="my-3">
                  <span className="text-2xl font-bold text-slate-900">{t.ratePercent}%</span>
                  <span className="text-xs text-slate-500 block">Applied to eligible invoice subtotal</span>
                </div>
                <p className="text-xs text-slate-600">{t.description || 'Standard applicable tax bracket.'}</p>
              </div>

              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-[11px] text-slate-400">{t.isDefault ? 'Default Rule' : ''}</span>
                  <button
                    onClick={() => updateTaxRule(t.id, { isEnabled: !t.isEnabled })}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    {t.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Discount Rules View */}
      {activeTab === 'discounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discountRules.map((d) => (
            <div
              key={d.id}
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                    {d.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      d.isEnabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {d.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <h4 className="font-semibold text-slate-900 text-sm mt-2">{d.name}</h4>
                <div className="my-2">
                  <span className="text-xl font-bold text-slate-900">
                    {d.type === 'percentage' ? `${d.value}% OFF` : `${formatPaise(d.value)} FLAT OFF`}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 py-2 border-y border-slate-100">
                  <p>Min Purchase: <strong className="text-slate-800">{formatPaise(d.minPurchaseAmount)}</strong></p>
                  <p>Usage: <strong className="text-slate-800">{d.currentUsageCount}</strong> / {d.maxUsageLimit || '∞'} redemptions</p>
                  <p>Validity: {formatDate(d.startDate)} to {formatDate(d.endDate)}</p>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-3 pt-2 flex justify-end">
                  <button
                    onClick={() => updateDiscountRule(d.id, { isEnabled: !d.isEnabled })}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    {d.isEnabled ? 'Deactivate Coupon' : 'Activate Coupon'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Tax Modal */}
      <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title="Create Tax Rule">
        <form onSubmit={handleAddTax} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Tax Rule Name *</label>
            <input
              type="text"
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              placeholder="e.g. GST 18% or IGST 18%"
              className="w-full p-2 rounded border border-slate-300"
              required
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Percentage Rate (%) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={taxRatePercent}
              onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
              className="w-full p-2 rounded border border-slate-300 font-semibold"
              required
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={taxDesc}
              onChange={(e) => setTaxDesc(e.target.value)}
              placeholder="e.g. Applicable for intrastate software supply"
              rows={2}
              className="w-full p-2 rounded border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsTaxModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
            >
              Save Tax Rule
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Discount Modal */}
      <Modal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Create Discount Coupon">
        <form onSubmit={handleAddDiscount} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20"
                className="w-full p-2 rounded border border-slate-300 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Discount Name *</label>
              <input
                type="text"
                value={discountName}
                onChange={(e) => setDiscountName(e.target.value)}
                placeholder="e.g. Summer Promo 20%"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full p-2 rounded border border-slate-300 bg-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Value ({discountType === 'percentage' ? '%' : '₹'}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded border border-slate-300 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Min Purchase Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={minPurchaseRupees}
                onChange={(e) => setMinPurchaseRupees(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Max Redemptions</label>
              <input
                type="number"
                min="1"
                value={maxLimit}
                onChange={(e) => setMaxLimit(parseInt(e.target.value) || 100)}
                className="w-full p-2 rounded border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Valid From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Valid Until</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
            >
              Save Discount Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
