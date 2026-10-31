import { create } from 'zustand';
import type {
  Product,
  SubscriptionPlan,
  TaxRule,
  DiscountRule,
  Customer,
  Quotation,
  Subscription,
  Invoice,
  Payment,
  UserProfile,
  UserRole,
  DashboardMetrics,
  QuotationItem,
  SubscriptionItemSnapshot,
  InvoiceLineItemSnapshot,
  BillingExecutionJob,
  PaymentMethod,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_PLANS,
  INITIAL_TAX_RULES,
  INITIAL_DISCOUNT_RULES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_QUOTATIONS,
} from '../services/mockData';
import {
  formatPaise,
  calculatePercentageDiscount,
  calculateTaxAmount,
} from '../utils/money';
import {
  toISODate,
  calculateNextBillingDate,
  calculatePeriodEndDate,
  isDueTodayOrPast,
} from '../utils/date';
import { addDays } from 'date-fns';
import { db } from '../services/firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

function syncDocToFirestore(collectionName: string, id: string, data: any) {
  if (!db) return;
  try {
    setDoc(doc(db, collectionName, id), data, { merge: true }).catch((err) => {
      console.warn(`Firestore sync note for ${collectionName}/${id}:`, err?.message || err);
    });
  } catch (e) {
    console.warn(e);
  }
}

interface SystemState {
  // Sync
  fetchLiveFromFirestore: () => Promise<void>;

  // Auth
  currentUser: UserProfile;
  users: UserProfile[];
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  addUser: (user: Omit<UserProfile, 'uid' | 'createdAt'>) => { success: boolean; error?: string };

  // Data Collections
  customers: Customer[];
  products: Product[];
  plans: SubscriptionPlan[];
  taxRules: TaxRule[];
  discountRules: DiscountRule[];
  quotations: Quotation[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
  billingJobs: BillingExecutionJob[];

  // Customer Actions
  addCustomer: (data: Omit<Customer, 'id' | 'customerNumber' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;

  // Product Actions
  addProduct: (data: Omit<Product, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  archiveProduct: (id: string) => void;

  // Plan Actions
  addPlan: (data: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) => SubscriptionPlan;
  updatePlan: (id: string, data: Partial<SubscriptionPlan>) => void;
  archivePlan: (id: string) => void;

  // Tax & Discount Actions
  addTaxRule: (data: Omit<TaxRule, 'id' | 'createdAt'>) => TaxRule;
  updateTaxRule: (id: string, data: Partial<TaxRule>) => void;
  addDiscountRule: (data: Omit<DiscountRule, 'id' | 'currentUsageCount' | 'createdAt'>) => DiscountRule;
  updateDiscountRule: (id: string, data: Partial<DiscountRule>) => void;

  // Quotation Actions
  createQuotation: (data: {
    customerId: string;
    planId: string;
    items: QuotationItem[];
    paymentTerms: string;
    validityDate: string;
    notes?: string;
    discountRuleId?: string;
    taxRuleId?: string;
  }) => Quotation;
  updateQuotationStatus: (id: string, status: Quotation['status']) => void;
  convertQuotationToSubscription: (quotationId: string) => { success: boolean; subscriptionId?: string; error?: string };

  // Subscription Lifecycle Actions
  createSubscription: (data: {
    customerId: string;
    planId: string;
    items: SubscriptionItemSnapshot[];
    startDate: string;
    paymentTerms: string;
    discountRuleId?: string;
    taxRuleId?: string;
  }) => Subscription;
  pauseSubscription: (id: string, reason?: string) => { success: boolean; error?: string };
  resumeSubscription: (id: string) => { success: boolean; error?: string };
  cancelSubscription: (id: string, reason?: string) => { success: boolean; error?: string };
  renewSubscription: (id: string) => { success: boolean; error?: string };
  submitCustomerRequest: (subscriptionId: string, type: 'renewal' | 'pause' | 'cancellation', reason?: string) => void;

  // Invoicing & Recurring Billing
  generateManualInvoiceForSubscription: (subscriptionId: string) => { success: boolean; invoice?: Invoice; error?: string };
  runAutomatedRecurringBilling: () => BillingExecutionJob;
  cancelInvoice: (invoiceId: string) => void;

  // Payment Actions
  recordPayment: (data: {
    invoiceId: string;
    amount: number; // in paise
    paymentMethod: PaymentMethod;
    transactionReference: string;
    notes?: string;
  }) => { success: boolean; payment?: Payment; error?: string };

  // Metrics
  getMetrics: () => DashboardMetrics;

  // Reset/Seed Data
  resetToDefaultSeed: () => void;
}

// LocalStorage Persistence Keys
const STORAGE_PREFIX = 'brightloop_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export const useSystemStore = create<SystemState>((set, get) => ({
  users: loadFromStorage('users', INITIAL_USERS),
  currentUser: loadFromStorage('currentUser', INITIAL_USERS[0]), // Default Admin
  customers: loadFromStorage('customers', INITIAL_CUSTOMERS),
  products: loadFromStorage('products', INITIAL_PRODUCTS),
  plans: loadFromStorage('plans', INITIAL_PLANS),
  taxRules: loadFromStorage('taxRules', INITIAL_TAX_RULES),
  discountRules: loadFromStorage('discountRules', INITIAL_DISCOUNT_RULES),
  quotations: loadFromStorage('quotations', INITIAL_QUOTATIONS),
  subscriptions: loadFromStorage('subscriptions', INITIAL_SUBSCRIPTIONS),
  invoices: loadFromStorage('invoices', INITIAL_INVOICES),
  payments: loadFromStorage('payments', INITIAL_PAYMENTS),
  billingJobs: loadFromStorage('billingJobs', []),

  fetchLiveFromFirestore: async () => {
    if (!db) return;
    try {
      const custSnap = await getDocs(collection(db, 'customers'));
      const prodSnap = await getDocs(collection(db, 'products'));
      const planSnap = await getDocs(collection(db, 'plans'));
      const subSnap = await getDocs(collection(db, 'subscriptions'));
      const invSnap = await getDocs(collection(db, 'invoices'));
      const paySnap = await getDocs(collection(db, 'payments'));

      if (!custSnap.empty) {
        const liveCust = custSnap.docs.map((d) => d.data() as Customer);
        saveToStorage('customers', liveCust);
        set({ customers: liveCust });
      }
      if (!prodSnap.empty) {
        const liveProd = prodSnap.docs.map((d) => d.data() as Product);
        saveToStorage('products', liveProd);
        set({ products: liveProd });
      }
      if (!planSnap.empty) {
        const livePlans = planSnap.docs.map((d) => d.data() as SubscriptionPlan);
        saveToStorage('plans', livePlans);
        set({ plans: livePlans });
      }
      if (!subSnap.empty) {
        const liveSubs = subSnap.docs.map((d) => d.data() as Subscription);
        saveToStorage('subscriptions', liveSubs);
        set({ subscriptions: liveSubs });
      }
      if (!invSnap.empty) {
        const liveInvs = invSnap.docs.map((d) => d.data() as Invoice);
        saveToStorage('invoices', liveInvs);
        set({ invoices: liveInvs });
      }
      if (!paySnap.empty) {
        const livePays = paySnap.docs.map((d) => d.data() as Payment);
        saveToStorage('payments', livePays);
        set({ payments: livePays });
      }
    } catch (err) {
      console.warn('Firestore live sync note:', err);
    }
  },

  setCurrentUser: (user) => {
    saveToStorage('currentUser', user);
    set({ currentUser: user });
  },

  switchRole: (role) => {
    const { users } = get();
    const matched = users.find((u) => u.role === role);
    if (matched) {
      saveToStorage('currentUser', matched);
      set({ currentUser: matched });
    }
  },

  addUser: (data) => {
    const { users, currentUser } = get();
    if (currentUser.role !== 'admin') {
      return { success: false, error: 'Only administrators can create users or staff accounts.' };
    }
    const emailExists = users.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (emailExists) {
      return { success: false, error: 'An account with this email address already exists.' };
    }
    const newUser: UserProfile = {
      ...data,
      uid: 'user-' + Date.now(),
      createdAt: toISODate(),
    };
    const updated = [...users, newUser];
    saveToStorage('users', updated);
    set({ users: updated });
    return { success: true };
  },

  addCustomer: (data) => {
    const { customers } = get();
    const count = customers.length + 1;
    const customerNumber = `CUST-${String(count).padStart(3, '0')}`;
    const newCustomer: Customer = {
      ...data,
      id: 'cust-' + Date.now(),
      customerNumber,
      createdAt: toISODate(),
      updatedAt: toISODate(),
    };
    const updated = [newCustomer, ...customers];
    saveToStorage('customers', updated);
    set({ customers: updated });
    return newCustomer;
  },

  updateCustomer: (id, data) => {
    const updated = get().customers.map((c) =>
      c.id === id ? { ...c, ...data, updatedAt: toISODate() } : c
    );
    saveToStorage('customers', updated);
    set({ customers: updated });
  },

  addProduct: (data) => {
    const { products } = get();
    const count = products.length + 1;
    const code = `PROD-${String(count).padStart(3, '0')}`;
    const newProduct: Product = {
      ...data,
      id: 'prod-' + Date.now(),
      code,
      createdAt: toISODate(),
      updatedAt: toISODate(),
    };
    const updated = [newProduct, ...products];
    saveToStorage('products', updated);
    set({ products: updated });
    return newProduct;
  },

  updateProduct: (id, data) => {
    const updated = get().products.map((p) =>
      p.id === id ? { ...p, ...data, updatedAt: toISODate() } : p
    );
    saveToStorage('products', updated);
    set({ products: updated });
  },

  archiveProduct: (id) => {
    const updated = get().products.map((p) =>
      p.id === id ? { ...p, status: 'archived' as const, updatedAt: toISODate() } : p
    );
    saveToStorage('products', updated);
    set({ products: updated });
  },

  addPlan: (data) => {
    const { plans } = get();
    const newPlan: SubscriptionPlan = {
      ...data,
      id: 'plan-' + Date.now(),
      createdAt: toISODate(),
      updatedAt: toISODate(),
    };
    const updated = [newPlan, ...plans];
    saveToStorage('plans', updated);
    set({ plans: updated });
    return newPlan;
  },

  updatePlan: (id, data) => {
    const updated = get().plans.map((pl) =>
      pl.id === id ? { ...pl, ...data, updatedAt: toISODate() } : pl
    );
    saveToStorage('plans', updated);
    set({ plans: updated });
  },

  archivePlan: (id) => {
    const updated = get().plans.map((pl) =>
      pl.id === id ? { ...pl, status: 'archived' as const, updatedAt: toISODate() } : pl
    );
    saveToStorage('plans', updated);
    set({ plans: updated });
  },

  addTaxRule: (data) => {
    const { taxRules } = get();
    const newRule: TaxRule = {
      ...data,
      id: 'tax-' + Date.now(),
      createdAt: toISODate(),
    };
    const updated = [newRule, ...taxRules];
    saveToStorage('taxRules', updated);
    set({ taxRules: updated });
    return newRule;
  },

  updateTaxRule: (id, data) => {
    const updated = get().taxRules.map((t) => (t.id === id ? { ...t, ...data } : t));
    saveToStorage('taxRules', updated);
    set({ taxRules: updated });
  },

  addDiscountRule: (data) => {
    const { discountRules } = get();
    const newRule: DiscountRule = {
      ...data,
      id: 'disc-' + Date.now(),
      currentUsageCount: 0,
      createdAt: toISODate(),
    };
    const updated = [newRule, ...discountRules];
    saveToStorage('discountRules', updated);
    set({ discountRules: updated });
    return newRule;
  },

  updateDiscountRule: (id, data) => {
    const updated = get().discountRules.map((d) => (d.id === id ? { ...d, ...data } : d));
    saveToStorage('discountRules', updated);
    set({ discountRules: updated });
  },

  createQuotation: (data) => {
    const { quotations, customers, plans, discountRules, taxRules } = get();
    const customer = customers.find((c) => c.id === data.customerId);
    const plan = plans.find((p) => p.id === data.planId);
    const count = quotations.length + 1;
    const quotationNumber = `QT-2026-${String(count).padStart(4, '0')}`;

    // Calculate subtotal in paise
    let subtotal = 0;
    data.items.forEach((item) => {
      subtotal += item.unitPrice * item.quantity;
    });

    // Calculate discounts
    let discountTotal = 0;
    if (data.discountRuleId) {
      const discountRule = discountRules.find((d) => d.id === data.discountRuleId && d.isEnabled);
      if (discountRule) {
        if (subtotal >= discountRule.minPurchaseAmount) {
          if (discountRule.type === 'percentage') {
            discountTotal = calculatePercentageDiscount(subtotal, discountRule.value);
          } else {
            discountTotal = Math.min(subtotal, discountRule.value);
          }
        }
      }
    }

    const taxableAmount = Math.max(0, subtotal - discountTotal);

    // Calculate tax
    let taxTotal = 0;
    let taxRatePercent = 0;
    if (data.taxRuleId) {
      const taxRule = taxRules.find((t) => t.id === data.taxRuleId && t.isEnabled);
      if (taxRule) {
        taxRatePercent = taxRule.ratePercent;
        taxTotal = calculateTaxAmount(taxableAmount, taxRatePercent);
      }
    }

    const grandTotal = taxableAmount + taxTotal;

    const newQuotation: Quotation = {
      id: 'qt-' + Date.now(),
      quotationNumber,
      customerId: data.customerId,
      customerName: customer ? customer.name : 'Unknown Customer',
      customerEmail: customer ? customer.email : '',
      customerCompany: customer ? customer.companyName : '',
      planId: data.planId,
      planName: plan ? plan.planName : 'Standard Plan',
      items: data.items,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      discountRuleId: data.discountRuleId,
      taxRuleId: data.taxRuleId,
      paymentTerms: data.paymentTerms,
      validityDate: data.validityDate,
      status: 'confirmed', // Created ready for confirmation or conversion
      notes: data.notes,
      createdAt: toISODate(),
      updatedAt: toISODate(),
    };

    const updated = [newQuotation, ...quotations];
    saveToStorage('quotations', updated);
    set({ quotations: updated });
    return newQuotation;
  },

  updateQuotationStatus: (id, status) => {
    const updated = get().quotations.map((q) =>
      q.id === id ? { ...q, status, updatedAt: toISODate() } : q
    );
    saveToStorage('quotations', updated);
    set({ quotations: updated });
  },

  convertQuotationToSubscription: (quotationId) => {
    const { quotations, plans, customers, subscriptions, invoices, currentUser } = get();
    const quotation = quotations.find((q) => q.id === quotationId);
    if (!quotation) {
      return { success: false, error: 'Quotation not found.' };
    }

    if (quotation.status === 'converted') {
      return { success: false, error: 'This quotation has already been converted to a subscription.' };
    }

    // Check validity date
    if (isDueTodayOrPast(quotation.validityDate) && quotation.validityDate < toISODate()) {
      return { success: false, error: 'Cannot convert an expired quotation without revalidation.' };
    }

    const plan = plans.find((p) => p.id === quotation.planId);
    if (!plan) {
      return { success: false, error: 'Associated subscription plan not found.' };
    }

    const customer = customers.find((c) => c.id === quotation.customerId);
    if (!customer) {
      return { success: false, error: 'Associated customer not found.' };
    }

    const count = subscriptions.length + 1;
    const subscriptionNumber = `SUB-2026-${String(count).padStart(4, '0')}`;
    const today = toISODate();
    const periodEnd = calculatePeriodEndDate(today, plan.billingFrequency);
    const nextBilling = calculateNextBillingDate(today, plan.billingFrequency);
    const oneYearExpiry = toISODate(addDays(new Date(), 365));

    const subscriptionItems: SubscriptionItemSnapshot[] = quotation.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineSubtotal: item.unitPrice * item.quantity,
    }));

    const newSubscription: Subscription = {
      id: 'sub-' + Date.now(),
      subscriptionNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerCompany: customer.companyName,
      planId: plan.id,
      planName: plan.planName,
      billingFrequency: plan.billingFrequency,
      items: subscriptionItems,
      quantity: quotation.items.reduce((acc, it) => acc + it.quantity, 0),
      unitPrice: quotation.subtotal,
      subtotal: quotation.subtotal,
      discountAmount: quotation.discountTotal,
      taxRatePercent: quotation.taxTotal > 0 ? 18 : 0, // from snapshot
      taxAmount: quotation.taxTotal,
      totalAmount: quotation.grandTotal,
      taxRuleId: quotation.taxRuleId,
      discountRuleId: quotation.discountRuleId,
      startDate: today,
      expiryDate: oneYearExpiry,
      currentPeriodStart: today,
      currentPeriodEnd: periodEnd,
      nextBillingDate: nextBilling,
      status: 'active',
      paymentTerms: quotation.paymentTerms,
      autoClose: plan.autoClose,
      allowEarlyClosure: plan.allowEarlyClosure,
      allowPause: plan.allowPause,
      allowRenewal: plan.allowRenewal,
      renewalCount: 0,
      pauseHistory: [],
      history: [
        {
          id: 'hist-' + Date.now(),
          action: 'Subscription Created from Quotation',
          timestamp: new Date().toISOString(),
          performedBy: currentUser.displayName,
          details: `Converted from Quotation ${quotation.quotationNumber}`,
        },
      ],
      createdAt: today,
      updatedAt: today,
    };

    // Mark quotation as converted
    const updatedQuotations = quotations.map((q) =>
      q.id === quotationId
        ? {
            ...q,
            status: 'converted' as const,
            convertedSubscriptionId: newSubscription.id,
            updatedAt: today,
          }
        : q
    );

    // CRITICAL: Automatically generate the first invoice for this subscription!
    const invoiceCount = invoices.length + 1;
    const invoiceNumber = `INV-2026-${String(invoiceCount).padStart(4, '0')}`;
    const billingPeriodKey = `${newSubscription.id}_${today}_${periodEnd}`;

    const invoiceLines: InvoiceLineItemSnapshot[] = subscriptionItems.map((item) => {
      const taxable = item.lineSubtotal;
      const taxAmt = calculateTaxAmount(taxable, newSubscription.taxRatePercent);
      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineSubtotal: item.lineSubtotal,
        discountAmount: 0,
        taxableAmount: taxable,
        taxRatePercent: newSubscription.taxRatePercent,
        taxAmount: taxAmt,
        totalAmount: taxable + taxAmt,
      };
    });

    const dueDate = toISODate(addDays(new Date(), 15));

    const initialInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerCompany: customer.companyName,
      customerAddress: customer.billingAddress,
      customerGstin: customer.gstin,
      subscriptionId: newSubscription.id,
      subscriptionNumber: newSubscription.subscriptionNumber,
      billingPeriodKey,
      billingPeriodStart: today,
      billingPeriodEnd: periodEnd,
      invoiceDate: today,
      dueDate,
      items: invoiceLines,
      subtotal: newSubscription.subtotal,
      discountTotal: newSubscription.discountAmount,
      taxableAmount: newSubscription.subtotal - newSubscription.discountAmount,
      taxRatePercent: newSubscription.taxRatePercent,
      taxRuleName: newSubscription.taxRatePercent > 0 ? 'GST 18%' : 'Exempt',
      taxTotal: newSubscription.taxAmount,
      grandTotal: newSubscription.totalAmount,
      amountPaid: 0,
      outstandingBalance: newSubscription.totalAmount,
      status: 'confirmed',
      notes: `Invoice generated for ${plan.planName} (${today} to ${periodEnd})`,
      paymentIds: [],
      createdAt: today,
      updatedAt: today,
    };

    const updatedSubscriptions = [newSubscription, ...subscriptions];
    const updatedInvoices = [initialInvoice, ...invoices];

    saveToStorage('quotations', updatedQuotations);
    saveToStorage('subscriptions', updatedSubscriptions);
    saveToStorage('invoices', updatedInvoices);

    set({
      quotations: updatedQuotations,
      subscriptions: updatedSubscriptions,
      invoices: updatedInvoices,
    });

    return { success: true, subscriptionId: newSubscription.id };
  },

  createSubscription: (data) => {
    const { subscriptions, customers, plans, invoices, currentUser } = get();
    const customer = customers.find((c) => c.id === data.customerId);
    const plan = plans.find((p) => p.id === data.planId);
    const count = subscriptions.length + 1;
    const subscriptionNumber = `SUB-2026-${String(count).padStart(4, '0')}`;
    const today = toISODate();
    const billingFreq = plan ? plan.billingFrequency : 'monthly';
    const periodEnd = calculatePeriodEndDate(data.startDate, billingFreq);
    const nextBilling = calculateNextBillingDate(data.startDate, billingFreq);
    const oneYearExpiry = toISODate(addDays(new Date(), 365));

    let subtotal = 0;
    data.items.forEach((it) => {
      subtotal += it.unitPrice * it.quantity;
    });

    const taxRate = 18;
    const taxAmt = calculateTaxAmount(subtotal, taxRate);
    const totalAmount = subtotal + taxAmt;

    const newSub: Subscription = {
      id: 'sub-' + Date.now(),
      subscriptionNumber,
      customerId: data.customerId,
      customerName: customer ? customer.name : 'Unknown',
      customerEmail: customer ? customer.email : '',
      customerCompany: customer ? customer.companyName : '',
      planId: data.planId,
      planName: plan ? plan.planName : 'Standard Plan',
      billingFrequency: billingFreq,
      items: data.items,
      quantity: data.items.reduce((acc, it) => acc + it.quantity, 0),
      unitPrice: subtotal,
      subtotal,
      discountAmount: 0,
      taxRatePercent: taxRate,
      taxAmount: taxAmt,
      totalAmount,
      taxRuleId: data.taxRuleId,
      discountRuleId: data.discountRuleId,
      startDate: data.startDate,
      expiryDate: oneYearExpiry,
      currentPeriodStart: data.startDate,
      currentPeriodEnd: periodEnd,
      nextBillingDate: nextBilling,
      status: 'active',
      paymentTerms: data.paymentTerms,
      autoClose: plan ? plan.autoClose : false,
      allowEarlyClosure: plan ? plan.allowEarlyClosure : true,
      allowPause: plan ? plan.allowPause : true,
      allowRenewal: plan ? plan.allowRenewal : true,
      renewalCount: 0,
      pauseHistory: [],
      history: [
        {
          id: 'hist-' + Date.now(),
          action: 'Subscription Created Directly',
          timestamp: new Date().toISOString(),
          performedBy: currentUser.displayName,
        },
      ],
      createdAt: today,
      updatedAt: today,
    };

    // Auto-create initial invoice
    const invCount = invoices.length + 1;
    const invoiceNumber = `INV-2026-${String(invCount).padStart(4, '0')}`;
    const billingPeriodKey = `${newSub.id}_${data.startDate}_${periodEnd}`;

    const invoiceLines: InvoiceLineItemSnapshot[] = data.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineSubtotal: item.lineSubtotal,
      discountAmount: 0,
      taxableAmount: item.lineSubtotal,
      taxRatePercent: taxRate,
      taxAmount: calculateTaxAmount(item.lineSubtotal, taxRate),
      totalAmount: item.lineSubtotal + calculateTaxAmount(item.lineSubtotal, taxRate),
    }));

    const initialInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      customerId: customer ? customer.id : '',
      customerName: customer ? customer.name : '',
      customerEmail: customer ? customer.email : '',
      customerCompany: customer ? customer.companyName : '',
      customerAddress: customer ? customer.billingAddress : { street: '', city: '', state: '', postalCode: '', country: 'India' },
      customerGstin: customer?.gstin,
      subscriptionId: newSub.id,
      subscriptionNumber: newSub.subscriptionNumber,
      billingPeriodKey,
      billingPeriodStart: data.startDate,
      billingPeriodEnd: periodEnd,
      invoiceDate: today,
      dueDate: toISODate(addDays(new Date(), 15)),
      items: invoiceLines,
      subtotal,
      discountTotal: 0,
      taxableAmount: subtotal,
      taxRatePercent: taxRate,
      taxRuleName: 'GST 18%',
      taxTotal: taxAmt,
      grandTotal: totalAmount,
      amountPaid: 0,
      outstandingBalance: totalAmount,
      status: 'confirmed',
      notes: `Invoice generated for ${newSub.planName}`,
      paymentIds: [],
      createdAt: today,
      updatedAt: today,
    };

    const updatedSubs = [newSub, ...subscriptions];
    const updatedInvs = [initialInvoice, ...invoices];

    saveToStorage('subscriptions', updatedSubs);
    saveToStorage('invoices', updatedInvs);

    set({ subscriptions: updatedSubs, invoices: updatedInvs });
    return newSub;
  },

  pauseSubscription: (id, reason) => {
    const { subscriptions, currentUser } = get();
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return { success: false, error: 'Subscription not found' };
    if (!sub.allowPause) return { success: false, error: 'This subscription plan does not allow pausing.' };
    if (sub.status !== 'active') return { success: false, error: 'Only active subscriptions can be paused.' };

    const today = toISODate();
    const updated = subscriptions.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          status: 'paused' as const,
          pauseHistory: [...s.pauseHistory, { pausedAt: today, reason: reason || 'Customer requested pause' }],
          history: [
            ...s.history,
            {
              id: 'hist-' + Date.now(),
              action: 'Subscription Paused',
              timestamp: new Date().toISOString(),
              performedBy: currentUser.displayName,
              details: reason,
            },
          ],
          updatedAt: today,
        };
      }
      return s;
    });

    saveToStorage('subscriptions', updated);
    set({ subscriptions: updated });
    return { success: true };
  },

  resumeSubscription: (id) => {
    const { subscriptions, currentUser } = get();
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return { success: false, error: 'Subscription not found' };
    if (sub.status !== 'paused') return { success: false, error: 'Only paused subscriptions can be resumed.' };

    const today = toISODate();
    const nextBilling = calculateNextBillingDate(today, sub.billingFrequency);
    const updated = subscriptions.map((s) => {
      if (s.id === id) {
        const lastPause = s.pauseHistory[s.pauseHistory.length - 1];
        const updatedPauseHistory = lastPause
          ? [
              ...s.pauseHistory.slice(0, -1),
              { ...lastPause, resumedAt: today },
            ]
          : s.pauseHistory;

        return {
          ...s,
          status: 'active' as const,
          nextBillingDate: nextBilling,
          pauseHistory: updatedPauseHistory,
          history: [
            ...s.history,
            {
              id: 'hist-' + Date.now(),
              action: 'Subscription Resumed',
              timestamp: new Date().toISOString(),
              performedBy: currentUser.displayName,
            },
          ],
          updatedAt: today,
        };
      }
      return s;
    });

    saveToStorage('subscriptions', updated);
    set({ subscriptions: updated });
    return { success: true };
  },

  cancelSubscription: (id, reason) => {
    const { subscriptions, currentUser } = get();
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return { success: false, error: 'Subscription not found' };
    if (!sub.allowEarlyClosure && sub.status === 'active') {
      return { success: false, error: 'This subscription plan does not allow early cancellation.' };
    }

    const today = toISODate();
    const updated = subscriptions.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          status: 'cancelled' as const,
          cancellationReason: reason || 'Cancelled by user',
          history: [
            ...s.history,
            {
              id: 'hist-' + Date.now(),
              action: 'Subscription Cancelled',
              timestamp: new Date().toISOString(),
              performedBy: currentUser.displayName,
              details: reason,
            },
          ],
          updatedAt: today,
        };
      }
      return s;
    });

    saveToStorage('subscriptions', updated);
    set({ subscriptions: updated });
    return { success: true };
  },

  renewSubscription: (id) => {
    const { subscriptions, currentUser } = get();
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return { success: false, error: 'Subscription not found' };
    if (!sub.allowRenewal) return { success: false, error: 'This plan does not support renewals.' };

    const today = toISODate();
    const newExpiry = toISODate(addDays(new Date(sub.expiryDate), 365));
    const nextBilling = calculateNextBillingDate(today, sub.billingFrequency);

    const updated = subscriptions.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          status: 'active' as const,
          expiryDate: newExpiry,
          nextBillingDate: nextBilling,
          renewalCount: s.renewalCount + 1,
          history: [
            ...s.history,
            {
              id: 'hist-' + Date.now(),
              action: 'Subscription Renewed',
              timestamp: new Date().toISOString(),
              performedBy: currentUser.displayName,
              details: `Extended expiry to ${newExpiry}`,
            },
          ],
          updatedAt: today,
        };
      }
      return s;
    });

    saveToStorage('subscriptions', updated);
    set({ subscriptions: updated });
    return { success: true };
  },

  submitCustomerRequest: (subscriptionId, type, reason) => {
    const { subscriptions } = get();
    const updated = subscriptions.map((s) => {
      if (s.id === subscriptionId) {
        const reqs = s.customerRequests || [];
        return {
          ...s,
          customerRequests: [
            ...reqs,
            {
              type,
              reason,
              requestedAt: new Date().toISOString(),
              status: 'pending' as const,
            },
          ],
          updatedAt: toISODate(),
        };
      }
      return s;
    });
    saveToStorage('subscriptions', updated);
    set({ subscriptions: updated });
  },

  // Manual generation of invoice for specific billing period
  generateManualInvoiceForSubscription: (subscriptionId) => {
    const { subscriptions, invoices, customers } = get();
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return { success: false, error: 'Subscription not found' };
    if (sub.status !== 'active') return { success: false, error: 'Subscription is not active' };

    const today = toISODate();
    const periodStart = sub.nextBillingDate || today;
    const periodEnd = calculatePeriodEndDate(periodStart, sub.billingFrequency);
    const billingPeriodKey = `${sub.id}_${periodStart}_${periodEnd}`;

    // IDEMPOTENCY CHECK
    const duplicate = invoices.find((inv) => inv.billingPeriodKey === billingPeriodKey);
    if (duplicate) {
      return {
        success: false,
        error: `Duplicate billing prevented: Invoice ${duplicate.invoiceNumber} already exists for period ${periodStart} to ${periodEnd}.`,
      };
    }

    const customer = customers.find((c) => c.id === sub.customerId);
    const invoiceCount = invoices.length + 1;
    const invoiceNumber = `INV-2026-${String(invoiceCount).padStart(4, '0')}`;

    const invoiceLines: InvoiceLineItemSnapshot[] = sub.items.map((item) => {
      const taxable = item.lineSubtotal;
      const taxAmt = calculateTaxAmount(taxable, sub.taxRatePercent);
      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineSubtotal: item.lineSubtotal,
        discountAmount: 0,
        taxableAmount: taxable,
        taxRatePercent: sub.taxRatePercent,
        taxAmount: taxAmt,
        totalAmount: taxable + taxAmt,
      };
    });

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      customerId: sub.customerId,
      customerName: sub.customerName,
      customerEmail: sub.customerEmail,
      customerCompany: sub.customerCompany,
      customerAddress: customer ? customer.billingAddress : { street: '', city: '', state: '', postalCode: '', country: 'India' },
      customerGstin: customer?.gstin,
      subscriptionId: sub.id,
      subscriptionNumber: sub.subscriptionNumber,
      billingPeriodKey,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      invoiceDate: today,
      dueDate: toISODate(addDays(new Date(), 15)),
      items: invoiceLines,
      subtotal: sub.subtotal,
      discountTotal: sub.discountAmount,
      taxableAmount: sub.subtotal - sub.discountAmount,
      taxRatePercent: sub.taxRatePercent,
      taxRuleName: sub.taxRatePercent > 0 ? 'GST 18%' : 'Exempt',
      taxTotal: sub.taxAmount,
      grandTotal: sub.totalAmount,
      amountPaid: 0,
      outstandingBalance: sub.totalAmount,
      status: 'confirmed',
      notes: `Recurring billing for ${sub.planName} (${periodStart} to ${periodEnd})`,
      paymentIds: [],
      createdAt: today,
      updatedAt: today,
    };

    // Advance next billing date
    const nextNextBilling = calculateNextBillingDate(periodStart, sub.billingFrequency);
    const updatedSubs = subscriptions.map((s) =>
      s.id === sub.id ? { ...s, nextBillingDate: nextNextBilling, updatedAt: today } : s
    );

    const updatedInvs = [newInvoice, ...invoices];
    saveToStorage('subscriptions', updatedSubs);
    saveToStorage('invoices', updatedInvs);

    set({ subscriptions: updatedSubs, invoices: updatedInvs });
    return { success: true, invoice: newInvoice };
  },

  // Automated batch recurring billing runner
  runAutomatedRecurringBilling: () => {
    const { subscriptions, invoices, customers, billingJobs } = get();
    const today = toISODate();
    const logs: string[] = [];
    let evaluated = 0;
    let created = 0;
    let errors = 0;

    const newInvoices: Invoice[] = [];
    const updatedSubscriptions = [...subscriptions];

    logs.push(`Recurring billing batch started at ${new Date().toISOString()}`);

    for (let i = 0; i < updatedSubscriptions.length; i++) {
      const sub = updatedSubscriptions[i];
      if (sub.status !== 'active') continue;

      evaluated++;
      // Check if billing date is due
      if (isDueTodayOrPast(sub.nextBillingDate)) {
        const periodStart = sub.nextBillingDate;
        const periodEnd = calculatePeriodEndDate(periodStart, sub.billingFrequency);
        const billingPeriodKey = `${sub.id}_${periodStart}_${periodEnd}`;

        // Idempotency check: don't duplicate invoice
        const alreadyInvoiced =
          invoices.some((inv) => inv.billingPeriodKey === billingPeriodKey) ||
          newInvoices.some((inv) => inv.billingPeriodKey === billingPeriodKey);

        if (alreadyInvoiced) {
          logs.push(`[SKIP] Idempotency: Subscription ${sub.subscriptionNumber} already invoiced for period ${periodStart} - ${periodEnd}.`);
          continue;
        }

        try {
          const customer = customers.find((c) => c.id === sub.customerId);
          const nextInvNum = `INV-2026-${String(invoices.length + newInvoices.length + 1).padStart(4, '0')}`;

          const lineItems: InvoiceLineItemSnapshot[] = sub.items.map((it) => {
            const tax = calculateTaxAmount(it.lineSubtotal, sub.taxRatePercent);
            return {
              productId: it.productId,
              variantId: it.variantId,
              productName: it.productName,
              variantName: it.variantName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              lineSubtotal: it.lineSubtotal,
              discountAmount: 0,
              taxableAmount: it.lineSubtotal,
              taxRatePercent: sub.taxRatePercent,
              taxAmount: tax,
              totalAmount: it.lineSubtotal + tax,
            };
          });

          const generatedInvoice: Invoice = {
            id: 'inv-' + Date.now() + '-' + created,
            invoiceNumber: nextInvNum,
            customerId: sub.customerId,
            customerName: sub.customerName,
            customerEmail: sub.customerEmail,
            customerCompany: sub.customerCompany,
            customerAddress: customer ? customer.billingAddress : { street: '', city: '', state: '', postalCode: '', country: 'India' },
            customerGstin: customer?.gstin,
            subscriptionId: sub.id,
            subscriptionNumber: sub.subscriptionNumber,
            billingPeriodKey,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
            invoiceDate: today,
            dueDate: toISODate(addDays(new Date(), 15)),
            items: lineItems,
            subtotal: sub.subtotal,
            discountTotal: sub.discountAmount,
            taxableAmount: sub.subtotal - sub.discountAmount,
            taxRatePercent: sub.taxRatePercent,
            taxRuleName: sub.taxRatePercent > 0 ? 'GST 18%' : 'Exempt',
            taxTotal: sub.taxAmount,
            grandTotal: sub.totalAmount,
            amountPaid: 0,
            outstandingBalance: sub.totalAmount,
            status: 'confirmed',
            notes: `Automated scheduled billing for period ${periodStart} to ${periodEnd}`,
            paymentIds: [],
            createdAt: today,
            updatedAt: today,
          };

          newInvoices.push(generatedInvoice);
          created++;

          // Advance next billing date
          const nextNextBilling = calculateNextBillingDate(periodStart, sub.billingFrequency);
          updatedSubscriptions[i] = {
            ...sub,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            nextBillingDate: nextNextBilling,
            updatedAt: today,
          };

          logs.push(`[SUCCESS] Generated ${generatedInvoice.invoiceNumber} for ${sub.subscriptionNumber} (${sub.customerName})`);
        } catch (err: any) {
          errors++;
          logs.push(`[ERROR] Processing subscription ${sub.subscriptionNumber}: ${err?.message || err}`);
        }
      }
    }

    logs.push(`Batch finished: ${evaluated} evaluated, ${created} invoices generated, ${errors} errors.`);

    const jobRecord: BillingExecutionJob = {
      id: 'job-' + Date.now(),
      runAt: new Date().toISOString(),
      type: 'scheduled_batch',
      subscriptionsEvaluated: evaluated,
      invoicesCreated: created,
      errorsCount: errors,
      status: errors > 0 ? 'failed' : created > 0 ? 'completed' : 'no_actions_needed',
      details: logs,
    };

    const finalInvoices = [...newInvoices, ...invoices];
    const finalJobs = [jobRecord, ...billingJobs];

    saveToStorage('subscriptions', updatedSubscriptions);
    saveToStorage('invoices', finalInvoices);
    saveToStorage('billingJobs', finalJobs);

    set({
      subscriptions: updatedSubscriptions,
      invoices: finalInvoices,
      billingJobs: finalJobs,
    });

    return jobRecord;
  },

  cancelInvoice: (invoiceId) => {
    const { invoices } = get();
    const updated = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, status: 'cancelled' as const, updatedAt: toISODate() } : inv
    );
    saveToStorage('invoices', updated);
    set({ invoices: updated });
  },

  recordPayment: (data) => {
    const { invoices, payments, currentUser } = get();
    const invoice = invoices.find((inv) => inv.id === data.invoiceId);
    if (!invoice) {
      return { success: false, error: 'Invoice not found.' };
    }
    if (invoice.status === 'paid') {
      return { success: false, error: 'Invoice is already fully paid.' };
    }
    if (invoice.status === 'cancelled') {
      return { success: false, error: 'Cannot record payment for a cancelled invoice.' };
    }
    if (data.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' };
    }
    if (data.amount > invoice.outstandingBalance) {
      return {
        success: false,
        error: `Payment amount (${formatPaise(data.amount)}) exceeds remaining balance (${formatPaise(invoice.outstandingBalance)}).`,
      };
    }

    const today = toISODate();
    const count = payments.length + 1;
    const paymentNumber = `PAY-2026-${String(count).padStart(4, '0')}`;

    const newPayment: Payment = {
      id: 'pay-' + Date.now(),
      paymentNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDate: today,
      transactionReference: data.transactionReference || `TXN-${Date.now()}`,
      notes: data.notes,
      recordedByUid: currentUser.uid,
      recordedByName: currentUser.displayName,
      createdAt: today,
    };

    const newAmountPaid = invoice.amountPaid + data.amount;
    const newOutstanding = Math.max(0, invoice.grandTotal - newAmountPaid);
    const newStatus: Invoice['status'] = newOutstanding === 0 ? 'paid' : 'partially_paid';

    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoice.id) {
        return {
          ...inv,
          amountPaid: newAmountPaid,
          outstandingBalance: newOutstanding,
          status: newStatus,
          paymentIds: [...inv.paymentIds, newPayment.id],
          updatedAt: today,
        };
      }
      return inv;
    });

    const updatedPayments = [newPayment, ...payments];

    saveToStorage('invoices', updatedInvoices);
    saveToStorage('payments', updatedPayments);

    set({
      invoices: updatedInvoices,
      payments: updatedPayments,
    });

    return { success: true, payment: newPayment };
  },

  getMetrics: () => {
    const { customers, subscriptions, invoices, payments } = get();

    const activeCustomersCount = customers.filter((c) => c.status === 'active').length;
    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    const cancelledSubs = subscriptions.filter((s) => s.status === 'cancelled');

    // Revenue collected
    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

    // Invoiced revenue (excluding cancelled invoices)
    const totalInvoiced = invoices
      .filter((inv) => inv.status !== 'cancelled')
      .reduce((acc, inv) => acc + inv.grandTotal, 0);

    // Outstanding balance
    const totalOutstanding = invoices
      .filter((inv) => inv.status !== 'cancelled' && inv.status !== 'paid')
      .reduce((acc, inv) => acc + inv.outstandingBalance, 0);

    // Overdue invoices
    const overdueCount = invoices.filter(
      (inv) =>
        inv.status !== 'paid' &&
        inv.status !== 'cancelled' &&
        inv.dueDate < toISODate()
    ).length;

    // Upcoming renewals in next 30 days
    const upcomingRenewals = subscriptions.filter((s) => {
      if (s.status !== 'active') return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(s.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length;

    // Calculate MRR (Monthly Recurring Revenue in paise)
    let mrr = 0;
    activeSubs.forEach((sub) => {
      if (sub.billingFrequency === 'monthly') {
        mrr += sub.totalAmount;
      } else if (sub.billingFrequency === 'yearly') {
        mrr += Math.round(sub.totalAmount / 12);
      } else if (sub.billingFrequency === 'weekly') {
        mrr += Math.round(sub.totalAmount * 4.33);
      } else if (sub.billingFrequency === 'daily') {
        mrr += Math.round(sub.totalAmount * 30);
      }
    });

    return {
      totalCustomers: activeCustomersCount,
      activeSubscriptions: activeSubs.length,
      newSubscriptionsThisMonth: activeSubs.length,
      cancelledSubscriptions: cancelledSubs.length,
      totalRevenueCollected: totalCollected,
      invoicedRevenue: totalInvoiced,
      outstandingPayments: totalOutstanding,
      overdueInvoicesCount: overdueCount,
      upcomingRenewalsCount: upcomingRenewals,
      mrr,
      arr: mrr * 12,
    };
  },

  resetToDefaultSeed: () => {
    localStorage.clear();
    set({
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
      customers: INITIAL_CUSTOMERS,
      products: INITIAL_PRODUCTS,
      plans: INITIAL_PLANS,
      taxRules: INITIAL_TAX_RULES,
      discountRules: INITIAL_DISCOUNT_RULES,
      quotations: INITIAL_QUOTATIONS,
      subscriptions: INITIAL_SUBSCRIPTIONS,
      invoices: INITIAL_INVOICES,
      payments: INITIAL_PAYMENTS,
      billingJobs: [],
    });
  },
}));
