import React, { useState } from 'react';
import { Plus, Trash2, Package, Tag, Layers, CheckCircle2, Archive } from 'lucide-react';
import { useSystemStore } from '@/store';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/Badge';
import { formatPaise, rupeesToPaise, paiseToRupees } from '@/utils/money';
import type { Product, ProductType, ProductVariant } from '@/types';

export const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, archiveProduct, currentUser } = useSystemStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('software');
  const [basePriceRupees, setBasePriceRupees] = useState<number>(1000);
  const [costPriceRupees, setCostPriceRupees] = useState<number>(400);
  const [description, setDescription] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<
    {
      attributeName: string;
      attributeValue: string;
      additionalPriceRupees: number;
      sku: string;
    }[]
  >([]);

  const isAdmin = currentUser.role === 'admin';

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setType('software');
    setBasePriceRupees(1000);
    setCostPriceRupees(400);
    setDescription('');
    setHasVariants(false);
    setVariants([]);
    setIsModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setVariants([
      ...variants,
      {
        attributeName: 'Brand',
        attributeValue: 'Odoo Engine',
        additionalPriceRupees: 560,
        sku: `SKU-${Date.now().toString().slice(-4)}`,
      },
    ]);
  };

  const handleRemoveVariantRow = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedVariants: ProductVariant[] = variants.map((v, i) => ({
      id: 'var-' + Date.now() + '-' + i,
      attributeName: v.attributeName,
      attributeValue: v.attributeValue,
      additionalPrice: rupeesToPaise(v.additionalPriceRupees),
      sku: v.sku,
    }));

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        type,
        basePrice: rupeesToPaise(basePriceRupees),
        costPrice: rupeesToPaise(costPriceRupees),
        description,
        hasVariants: hasVariants && formattedVariants.length > 0,
        variants: hasVariants ? formattedVariants : [],
      });
    } else {
      addProduct({
        name,
        type,
        basePrice: rupeesToPaise(basePriceRupees),
        costPrice: rupeesToPaise(costPriceRupees),
        description,
        hasVariants: hasVariants && formattedVariants.length > 0,
        variants: hasVariants ? formattedVariants : [],
        status: 'active',
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Manage your subscription software modules, standalone add-ons, and pricing variants.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        )}
      </div>

      {/* Products Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((prod) => (
          <div
            key={prod.id}
            className={`bg-white rounded-lg border p-5 flex flex-col justify-between shadow-2xs transition-all ${
              prod.status === 'archived' ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {prod.code}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 mt-1.5 m-0">{prod.name}</h3>
                  <span className="text-[11px] text-slate-500 capitalize">{prod.type} Module</span>
                </div>
                <StatusBadge status={prod.status} />
              </div>

              <p className="text-xs text-slate-600 mt-3 line-clamp-2">{prod.description}</p>

              {/* Price Display */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Base Price</span>
                  <span className="text-base font-bold text-slate-800">{formatPaise(prod.basePrice)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Cost Price</span>
                  <span className="text-xs font-medium text-slate-600">{formatPaise(prod.costPrice)}</span>
                </div>
              </div>

              {/* Variants Section */}
              {prod.hasVariants && prod.variants.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                    Configurable Variants ({prod.variants.length}):
                  </span>
                  <div className="space-y-1">
                    {prod.variants.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-50 border border-slate-200/60"
                      >
                        <span className="text-slate-700 font-medium">
                          {v.attributeName}: {v.attributeValue}
                        </span>
                        <span className="text-slate-600 font-mono">
                          +{formatPaise(v.additionalPrice)} ={' '}
                          <strong className="text-blue-600">
                            {formatPaise(prod.basePrice + v.additionalPrice)}
                          </strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Actions */}
            {isAdmin && prod.status === 'active' && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => archiveProduct(prod.id)}
                  className="px-2 py-1 text-slate-500 hover:text-rose-600 rounded transition-colors text-[11px]"
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product & Variants'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Brightloop Business Software"
                className="w-full p-2 rounded border border-slate-300 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Product Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
                className="w-full p-2 rounded border border-slate-300 bg-white text-xs"
              >
                <option value="software">Software System</option>
                <option value="service">Implementation & Support</option>
                <option value="addon">Optional Add-on</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Base Sales Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={basePriceRupees}
                onChange={(e) => setBasePriceRupees(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded border border-slate-300 text-xs font-semibold"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Stored as integer paise</span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Internal Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPriceRupees}
                onChange={(e) => setCostPriceRupees(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Features and capability description"
              rows={2}
              className="w-full p-2 rounded border border-slate-300 text-xs"
            />
          </div>

          {/* Variants Toggle & Rows */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => {
                    setHasVariants(e.target.checked);
                    if (e.target.checked && variants.length === 0) {
                      handleAddVariantRow();
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">
                  Enable Multiple Product Variants (e.g. Brand, Tier, Cloud Edition)
                </span>
              </label>

              {hasVariants && (
                <button
                  type="button"
                  onClick={handleAddVariantRow}
                  className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Variant
                </button>
              )}
            </div>

            {hasVariants && (
              <div className="space-y-2 p-3 bg-slate-50 rounded border border-slate-200">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-slate-200 text-xs"
                  >
                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-400 uppercase">Attribute</label>
                      <input
                        type="text"
                        value={v.attributeName}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].attributeName = e.target.value;
                          setVariants(updated);
                        }}
                        placeholder="e.g. Brand"
                        className="w-full p-1.5 rounded border border-slate-300 text-xs"
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="text-[10px] text-slate-400 uppercase">Option Name</label>
                      <input
                        type="text"
                        value={v.attributeValue}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].attributeValue = e.target.value;
                          setVariants(updated);
                        }}
                        placeholder="e.g. Odoo Engine"
                        className="w-full p-1.5 rounded border border-slate-300 text-xs"
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="text-[10px] text-slate-400 uppercase">Additional Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={v.additionalPriceRupees}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].additionalPriceRupees = parseFloat(e.target.value) || 0;
                          setVariants(updated);
                        }}
                        className="w-full p-1.5 rounded border border-slate-300 text-xs font-semibold"
                        required
                      />
                      <span className="text-[10px] text-blue-600 font-mono">
                        Total: ₹{(basePriceRupees + (v.additionalPriceRupees || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-center pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
