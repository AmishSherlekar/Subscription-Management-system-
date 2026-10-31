import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { PlansPage } from './pages/PlansPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { TaxesDiscountsPage } from './pages/TaxesDiscountsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { AuditJobsPage } from './pages/AuditJobsPage';
import { useSystemStore } from './store';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const { currentUser, fetchLiveFromFirestore } = useSystemStore();

  React.useEffect(() => {
    fetchLiveFromFirestore();
  }, [fetchLiveFromFirestore]);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigateTab={setCurrentTab} />;
      case 'customers':
        return <CustomersPage />;
      case 'products':
        return <ProductsPage />;
      case 'plans':
        return <PlansPage />;
      case 'quotations':
        return <QuotationsPage onNavigateTab={setCurrentTab} />;
      case 'subscriptions':
        return <SubscriptionsPage onNavigateTab={setCurrentTab} />;
      case 'invoices':
        return <InvoicesPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'taxes-discounts':
        return <TaxesDiscountsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'customer-portal':
        return <CustomerPortalPage />;
      case 'audit-jobs':
        return <AuditJobsPage />;
      default:
        return <DashboardPage onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header currentTab={currentTab} />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
