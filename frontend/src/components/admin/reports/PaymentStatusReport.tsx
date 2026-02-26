import { usePaymentStatusReport } from '../../../hooks/useReports';
import { formatCurrency } from '../../../lib/utils';

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
          {/* Summary Card */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 mb-1">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-900">
              {formatCurrency(report.totalOutstanding)}
            </p>
          </div>

          {/* Customer Balances Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Payment Status
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
                      Last Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No outstanding balances
                      </td>
                    </tr>
                  ) : (
                    report.customers.map((customer) => (
                      <tr key={customer.customerId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.outstandingBalance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.lastPaymentDate
                            ? new Date(customer.lastPaymentDate).toLocaleDateString()
                            : 'No payments'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              customer.outstandingBalance > 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {customer.outstandingBalance > 0 ? 'Outstanding' : 'Paid'}
                          </span>
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
