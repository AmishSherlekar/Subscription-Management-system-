import React, { useState } from 'react';
import { Play, RotateCcw, Search, CheckCircle2, AlertCircle, Cloud, KeyRound } from 'lucide-react';
import { useSystemStore } from '@/store';
import { FirebaseAuthModal } from '@/components/auth/FirebaseAuthModal';

interface HeaderProps {
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const { currentUser, runAutomatedRecurringBilling, resetToDefaultSeed } = useSystemStore();
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const titles: Record<string, string> = {
    dashboard: 'Financial & Subscription Overview',
    customers: 'Customer Directory',
    products: 'Product & Variant Catalog',
    plans: 'Subscription Plans & Frequencies',
    quotations: 'Quotations & Proposals',
    subscriptions: 'Subscriptions Lifecycle',
    invoices: 'Invoices & Billing History',
    payments: 'Payment Records & Collections',
    'taxes-discounts': 'Tax Rules & Discount Policies',
    reports: 'Financial & MRR Reports',
    'customer-portal': 'Customer Self-Service Portal',
    'audit-jobs': 'Recurring Billing Audit Jobs',
  };

  const handleRunBilling = () => {
    const job = runAutomatedRecurringBilling();
    setNotification({
      type: 'success',
      message: `Billing batch finished: ${job.subscriptionsEvaluated} subs evaluated, ${job.invoicesCreated} invoices generated.`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all records to initial realistic demo seed data?')) {
      resetToDefaultSeed();
      setNotification({
        type: 'info',
        message: 'System data reset to initial Brightloop seed dataset.',
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-800 m-0">
            {titles[currentTab] || 'Subscription Management'}
          </h1>
          {currentUser.role !== 'customer' && (
            <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              Workspace Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {notification && (
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{notification.message}</span>
            </div>
          )}

          {/* Cloud Database & Auth Sync */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs"
            title="Firebase Cloud Backend: Click for Authentication & Database Sync"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-600" />
            <span>Cloud Database</span>
          </button>

          {/* Automated Billing Trigger (Staff & Admin) */}
          {currentUser.role !== 'customer' && (
            <button
              onClick={handleRunBilling}
              title="Execute scheduled recurring billing engine on all active subscriptions"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Recurring Billing
            </button>
          )}

          {/* Reset Demo Seed Data */}
          <button
            onClick={handleResetData}
            title="Reset database to initial realistic mock data"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </header>

      {/* Auth & Firestore Sync Modal */}
      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
