import { usePaymentStatusReport } from '../../../hooks/useReports';
import { formatCurrency } from '../../../lib/utils';

interface CustomerPaymentStatus {
  customerId: string;
  customerName: string;
  outstandingBalance: number;
  lastPaymentDate: string | null;
}

export default function PaymentStatusReport() {
  const { data: report, isLoading, error } = usePaymentStatusReport();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load payment status report. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {report && (
        <>
          {/* Total Outstanding Card */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-sm font-medium text-red-800 mb-1">
              Total Outstanding Balance
            </p>
            <p className="text-3xl font-bold text-red-900">
              {formatCurrency(report.totalOutstanding)}
            </p>
          </div>

          {/* Outstanding Balances Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Outstanding Balances by Customer
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outstanding Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Payment Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.customers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                        No outstanding balances
                      </td>
                    </tr>
                  ) : (
                    report.customers.map((customer: CustomerPaymentStatus) => (
                      <tr key={customer.customerId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-red-600 font-semibold">
                            {formatCurrency(customer.outstandingBalance)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.lastPaymentDate
                            ? new Date(customer.lastPaymentDate).toLocaleDateString()
                            : 'Never'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
