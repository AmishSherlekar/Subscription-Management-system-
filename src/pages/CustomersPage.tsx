import React, { useState } from 'react';
import { Plus, Search, Building2, Mail, Phone, MapPin, Eye, FileText, Repeat } from 'lucide-react';
import { useSystemStore } from '@/store';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/Badge';
import { formatPaise } from '@/utils/money';
import { formatDate } from '@/utils/date';
import type { Customer } from '@/types';

export const CustomersPage: React.FC = () => {
  const { customers, subscriptions, invoices, addCustomer, updateCustomer, currentUser } = useSystemStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      name,
      companyName,
      email,
      phone,
      gstin: gstin || undefined,
      billingAddress: {
        street,
        city,
        state,
        postalCode,
        country: 'India',
      },
      status: 'active',
    });

    // Reset form
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setGstin('');
    setStreet('');
    setCity('');
    setState('');
    setPostalCode('');
    setIsAddModalOpen(false);
  };

  const customerSubs = selectedCustomer
    ? subscriptions.filter((s) => s.customerId === selectedCustomer.id)
    : [];

  const customerInvs = selectedCustomer
    ? invoices.filter((i) => i.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, company, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {currentUser.role !== 'customer' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs self-start"
          >
            <Plus className="w-4 h-4" />
            Add New Customer
          </button>
        )}
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-3 px-4 font-semibold">Customer No</th>
                <th className="py-3 px-4 font-semibold">Contact & Company</th>
                <th className="py-3 px-4 font-semibold">Billing Details</th>
                <th className="py-3 px-4 font-semibold">GSTIN</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{cust.customerNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{cust.name}</p>
                      <p className="text-[11px] text-slate-500">{cust.companyName}</p>
                      <p className="text-[11px] text-slate-400">{cust.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p>{cust.phone}</p>
                      <p className="text-[11px] text-slate-400">
                        {cust.billingAddress.city}, {cust.billingAddress.state}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {cust.gstin || <span className="text-slate-400 italic">Unregistered</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={cust.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Account
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Customer">
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Retail Pvt Ltd"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@apexretail.in"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">GSTIN Number (Optional)</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="e.g. 29ABCDE1234F1Z5"
              className="w-full p-2 rounded border border-slate-300 font-mono"
            />
          </div>

          {/* Billing Address */}
          <div className="pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-700 block mb-2">Billing Address</span>
            <div className="space-y-2">
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street Address, Building, Suite"
                className="w-full p-2 rounded border border-slate-300"
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full p-2 rounded border border-slate-300"
                  required
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="w-full p-2 rounded border border-slate-300"
                  required
                />
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="PIN Code"
                  className="w-full p-2 rounded border border-slate-300"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer: ${selectedCustomer.companyName} (${selectedCustomer.customerNumber})`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-xs">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <p className="text-slate-500 font-medium">Primary Contact</p>
                <p className="font-semibold text-slate-900 text-sm">{selectedCustomer.name}</p>
                <p className="text-slate-600">{selectedCustomer.email}</p>
                <p className="text-slate-600">{selectedCustomer.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 font-medium">Billing Address & Tax</p>
                <p className="text-slate-700">
                  {selectedCustomer.billingAddress.street}, {selectedCustomer.billingAddress.city},{' '}
                  {selectedCustomer.billingAddress.state} - {selectedCustomer.billingAddress.postalCode}
                </p>
                <p className="font-mono text-slate-800 font-medium mt-1">
                  GSTIN: {selectedCustomer.gstin || 'Unregistered'}
                </p>
              </div>
            </div>

            {/* Subscriptions section */}
            <div>
              <div className="flex items-center gap-2 mb-2 font-semibold text-slate-900">
                <Repeat className="w-4 h-4 text-blue-600" />
                <span>Associated Subscriptions ({customerSubs.length})</span>
              </div>
              {customerSubs.length === 0 ? (
                <p className="p-3 bg-slate-50 text-slate-400 rounded">No active subscriptions found.</p>
              ) : (
                <div className="space-y-2">
                  {customerSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-800">
                            {sub.subscriptionNumber}
                          </span>
                          <StatusBadge status={sub.status} />
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          {sub.planName} • Next Bill: {formatDate(sub.nextBillingDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-900">{formatPaise(sub.totalAmount)}</span>
                        <span className="text-[11px] text-slate-400 block capitalize">
                          {sub.billingFrequency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices section */}
            <div>
              <div className="flex items-center gap-2 mb-2 font-semibold text-slate-900">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Invoices & Billing History ({customerInvs.length})</span>
              </div>
              {customerInvs.length === 0 ? (
                <p className="p-3 bg-slate-50 text-slate-400 rounded">No invoices generated yet.</p>
              ) : (
                <div className="space-y-2">
                  {customerInvs.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-800">
                            {inv.invoiceNumber}
                          </span>
                          <StatusBadge status={inv.status} />
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          Date: {formatDate(inv.invoiceDate)} • Due: {formatDate(inv.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-900">{formatPaise(inv.grandTotal)}</span>
                        {inv.outstandingBalance > 0 && (
                          <span className="text-[11px] text-rose-600 block">
                            Bal: {formatPaise(inv.outstandingBalance)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
