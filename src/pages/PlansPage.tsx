import React, { useState } from 'react';
import { Plus, Calendar, Check, Repeat, Clock, Archive } from 'lucide-react';
import { useSystemStore } from '@/store';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/Badge';
import { formatPaise, rupeesToPaise, paiseToRupees } from '@/utils/money';
import { toISODate, formatDate } from '@/utils/date';
import type { BillingFrequency, SubscriptionPlan } from '@/types';

export const PlansPage: React.FC = () => {
  const { plans, products, addPlan, updatePlan, archivePlan, currentUser } = useSystemStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('monthly');
  const [priceRupees, setPriceRupees] = useState<number>(1560);
  const [minimumQuantity, setMinimumQuantity] = useState<number>(1);
  const [associatedProductIds, setAssociatedProductIds] = useState<string[]>([]);
  const [availabilityStartDate, setAvailabilityStartDate] = useState(toISODate());
  const [availabilityEndDate, setAvailabilityEndDate] = useState('');
  const [autoClose, setAutoClose] = useState(false);
  const [allowEarlyClosure, setAllowEarlyClosure] = useState(true);
  const [allowPause, setAllowPause] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);

  const isAdmin = currentUser.role === 'admin';

  const handleOpenModal = () => {
    setPlanName('');
    setDescription('');
    setBillingFrequency('monthly');
    setPriceRupees(1560);
    setMinimumQuantity(1);
    setAssociatedProductIds(products[0] ? [products[0].id] : []);
    setAvailabilityStartDate(toISODate());
    setAvailabilityEndDate('');
    setAutoClose(false);
    setAllowEarlyClosure(true);
    setAllowPause(true);
    setAllowRenewal(true);
    setIsModalOpen(true);
  };

  const handleToggleProduct = (prodId: string) => {
    if (associatedProductIds.includes(prodId)) {
      setAssociatedProductIds(associatedProductIds.filter((id) => id !== prodId));
    } else {
      setAssociatedProductIds([...associatedProductIds, prodId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPlan({
      planName,
      description,
      billingFrequency,
      price: rupeesToPaise(priceRupees),
      minimumQuantity,
      associatedProductIds,
      availabilityStartDate,
      availabilityEndDate: availabilityEndDate || undefined,
      autoClose,
      allowEarlyClosure,
      allowPause,
      allowRenewal,
      status: 'active',
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Define recurring subscription terms, billing frequencies, pause rights, and renewal policies.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Subscription Plan
          </button>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const associatedProds = products.filter((p) => plan.associatedProductIds.includes(p.id));

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-lg border p-5 flex flex-col justify-between shadow-2xs transition-all ${
                plan.status === 'archived' ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 m-0">{plan.planName}</h3>
                    <span className="text-[11px] font-medium text-blue-600 capitalize">
                      {plan.billingFrequency} Billing Cycle
                    </span>
                  </div>
                  <StatusBadge status={plan.status} />
                </div>

                <div className="my-4">
                  <span className="text-2xl font-bold text-slate-900">{formatPaise(plan.price)}</span>
                  <span className="text-xs text-slate-500"> / {plan.billingFrequency}</span>
                </div>

                <p className="text-xs text-slate-600 mb-4">{plan.description}</p>

                {/* Policies checklist */}
                <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        plan.allowRenewal ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      ✓
                    </span>
                    <span>Renewal Allowed: {plan.allowRenewal ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        plan.allowPause ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      ✓
                    </span>
                    <span>Pause Contract: {plan.allowPause ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        plan.allowEarlyClosure ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      ✓
                    </span>
                    <span>Early Cancellation: {plan.allowEarlyClosure ? 'Permitted' : 'Locked'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        plan.autoClose ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      •
                    </span>
                    <span>Auto-close on Expiry: {plan.autoClose ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                {/* Bundled Products */}
                <div className="mt-3 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                    Bundled Products:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {associatedProds.map((p) => (
                      <span key={p.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {isAdmin && plan.status === 'active' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => archivePlan(plan.id)}
                    className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    Archive Plan
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Plan Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Subscription Plan">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Plan Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. Business Monthly Plan"
              className="w-full p-2 rounded border border-slate-300 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Billing Frequency <span className="text-rose-500">*</span>
              </label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
                className="w-full p-2 rounded border border-slate-300 bg-white text-xs"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Base Price per Cycle (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceRupees}
                onChange={(e) => setPriceRupees(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded border border-slate-300 text-xs font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Subscription plan features and scope"
              rows={2}
              className="w-full p-2 rounded border border-slate-300 text-xs"
            />
          </div>

          {/* Associated Products Checkboxes */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Associated Products</label>
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded border border-slate-200">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={associatedProductIds.includes(p.id)}
                    onChange={() => handleToggleProduct(p.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Policies Checkboxes */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-700 block">Subscription Lifecycle Policies</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowRenewal}
                  onChange={(e) => setAllowRenewal(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Allow Renewal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPause}
                  onChange={(e) => setAllowPause(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Allow Pausing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowEarlyClosure}
                  onChange={(e) => setAllowEarlyClosure(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Allow Early Closure</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoClose}
                  onChange={(e) => setAutoClose(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Auto-Close on End Date</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
            >
              Create Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
