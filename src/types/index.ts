// Brightloop Subscription Management System - Core Types
// All monetary values are strictly represented in integer paise (1 INR = 100 paise)

export type UserRole = 'admin' | 'staff' | 'customer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  customerId?: string; // Links customer role to their customer record
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id: string;
  customerNumber: string; // e.g. CUST-001
  name: string;
  email: string;
  phone: string;
  companyName: string;
  billingAddress: Address;
  gstin?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  attributeName: string; // e.g. "Brand", "Tier", "Platform"
  attributeValue: string; // e.g. "Odoo", "Enterprise", "Cloud"
  additionalPrice: number; // in paise (e.g. 56000 for ₹560)
  sku?: string;
}

export type ProductType = 'software' | 'service' | 'addon';

export interface Product {
  id: string;
  code: string; // e.g. PROD-001
  name: string;
  type: ProductType;
  basePrice: number; // in paise (e.g. 100000 for ₹1,000)
  costPrice: number; // in paise
  description: string;
  hasVariants: boolean;
  variants: ProductVariant[];
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  planName: string;
  description: string;
  billingFrequency: BillingFrequency;
  price: number; // in paise
  minimumQuantity: number;
  associatedProductIds: string[];
  availabilityStartDate: string;
  availabilityEndDate?: string;
  autoClose: boolean;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface TaxRule {
  id: string;
  name: string; // e.g. "GST 18%", "IGST 18%", "GST 5%"
  ratePercent: number; // e.g. 18
  isEnabled: boolean;
  description?: string;
  isDefault?: boolean;
  createdAt: string;
}

export type DiscountType = 'percentage' | 'fixed';

export interface DiscountRule {
  id: string;
  code: string; // e.g. "SUMMER10"
  name: string;
  type: DiscountType;
  value: number; // percentage (e.g. 10) or paise (e.g. 50000 for ₹500)
  minPurchaseAmount: number; // in paise
  minQuantity: number;
  startDate: string;
  endDate: string;
  maxUsageLimit: number | null; // null for unlimited
  currentUsageCount: number;
  applicableProductIds: string[]; // empty array means applicable to all
  isWholeSubscription: boolean;
  isEnabled: boolean;
  createdAt: string;
}

export interface QuotationItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  unitPrice: number; // in paise snapshot
  quantity: number;
  discountAmount: number; // in paise
  taxRatePercent: number;
  taxAmount: number; // in paise
  totalAmount: number; // in paise
}

export interface QuotationTemplate {
  id: string;
  templateName: string;
  planId: string;
  items: QuotationItem[];
  paymentTerms: string;
  validityDays: number;
  defaultNotes?: string;
  createdAt: string;
}

export type QuotationStatus = 'draft' | 'confirmed' | 'converted' | 'expired' | 'rejected';

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. QT-2026-0001
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  planId: string;
  planName: string;
  items: QuotationItem[];
  subtotal: number; // in paise
  discountTotal: number; // in paise
  taxTotal: number; // in paise
  grandTotal: number; // in paise
  discountRuleId?: string;
  taxRuleId?: string;
  paymentTerms: string;
  validityDate: string;
  status: QuotationStatus;
  convertedSubscriptionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus =
  | 'draft'
  | 'quotation'
  | 'confirmed'
  | 'active'
  | 'paused'
  | 'closed'
  | 'cancelled';

export interface SubscriptionItemSnapshot {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  unitPrice: number; // in paise snapshot
  quantity: number;
  lineSubtotal: number; // in paise
}

export interface SubscriptionHistoryEntry {
  id: string;
  action: string;
  timestamp: string;
  performedBy: string;
  details?: string;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string; // e.g. SUB-2026-0001
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  planId: string;
  planName: string;
  billingFrequency: BillingFrequency;
  items: SubscriptionItemSnapshot[];
  quantity: number;
  unitPrice: number; // in paise
  subtotal: number; // in paise
  discountAmount: number; // in paise
  taxRatePercent: number;
  taxAmount: number; // in paise
  totalAmount: number; // in paise
  taxRuleId?: string;
  discountRuleId?: string;
  startDate: string;
  expiryDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  status: SubscriptionStatus;
  paymentTerms: string;
  autoClose: boolean;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  renewalCount: number;
  pauseHistory: { pausedAt: string; resumedAt?: string; reason?: string }[];
  cancellationReason?: string;
  history: SubscriptionHistoryEntry[];
  customerRequests?: {
    type: 'renewal' | 'pause' | 'cancellation';
    reason?: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItemSnapshot {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number; // in paise snapshot
  lineSubtotal: number; // in paise
  discountAmount: number; // in paise
  taxableAmount: number; // in paise
  taxRatePercent: number;
  taxAmount: number; // in paise
  totalAmount: number; // in paise
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  customerAddress: Address;
  customerGstin?: string;
  subscriptionId: string;
  subscriptionNumber: string;
  billingPeriodKey: string; // SUB_ID + "_" + PERIOD_START + "_" + PERIOD_END (Prevents duplicate billing!)
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceLineItemSnapshot[];
  subtotal: number; // in paise
  discountTotal: number; // in paise
  taxableAmount: number; // in paise
  taxRatePercent: number;
  taxRuleName: string;
  taxTotal: number; // in paise
  grandTotal: number; // in paise
  amountPaid: number; // in paise
  outstandingBalance: number; // in paise
  status: InvoiceStatus;
  notes?: string;
  paymentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'card' | 'other';

export interface Payment {
  id: string;
  paymentNumber: string; // e.g. PAY-2026-0001
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number; // in paise
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionReference: string;
  notes?: string;
  recordedByUid: string;
  recordedByName: string;
  createdAt: string;
}

export interface BillingExecutionJob {
  id: string;
  runAt: string;
  type: 'scheduled_batch' | 'manual_trigger';
  subscriptionsEvaluated: number;
  invoicesCreated: number;
  errorsCount: number;
  status: 'completed' | 'failed' | 'no_actions_needed';
  details: string[];
}

export interface DashboardMetrics {
  totalCustomers: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  cancelledSubscriptions: number;
  totalRevenueCollected: number; // in paise
  invoicedRevenue: number; // in paise
  outstandingPayments: number; // in paise
  overdueInvoicesCount: number;
  upcomingRenewalsCount: number;
  mrr: number; // in paise
  arr: number; // in paise
}
