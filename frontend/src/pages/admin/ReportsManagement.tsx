import { useState } from 'react';
import SalesReport from '../../components/admin/reports/SalesReport';
import PaymentStatusReport from '../../components/admin/reports/PaymentStatusReport';
import ProductPopularityReport from '../../components/admin/reports/ProductPopularityReport';
import CustomerActivityReport from '../../components/admin/reports/CustomerActivityReport';

type ReportTab = 'sales' | 'payments' | 'products' | 'customers';

export default function ReportsManagement() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'sales', label: 'Sales' },
    { id: 'payments', label: 'Payments' },
    { id: 'products', label: 'Products' },
    { id: 'customers', label: 'Customers' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'sales' && <SalesReport />}
          {activeTab === 'payments' && <PaymentStatusReport />}
          {activeTab === 'products' && <ProductPopularityReport />}
          {activeTab === 'customers' && <CustomerActivityReport />}
        </div>
      </div>
    </div>
  );
}
