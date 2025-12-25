import { useState } from 'react';
import { useClientPayments, Payment } from '../hooks/useClientDashboard';

const METHOD_ICONS: Record<string, JSX.Element> = {
    eft: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
    ),
    cash: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    card: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    ),
    yoko: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    credit: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

export default function PaymentHistoryPage() {
    const { data: payments, isLoading, isError } = useClientPayments();
    const [filterMethod, setFilterMethod] = useState<string>('all');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="loading-spinner h-12 w-12 mx-auto"></div>
                    <p className="mt-4 text-warm-gray-600 dark:text-warm-gray-400">Loading payment history...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                Failed to load payment history. Please try again later.
            </div>
        );
    }

    const filteredPayments = filterMethod === 'all'
        ? payments
        : payments?.filter(p => p.method === filterMethod);

    const uniqueMethods = [...new Set(payments?.map(p => p.method) || [])];

    const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-display font-bold text-organic-green-900 dark:text-organic-green-400 mb-2">
                Payment History
            </h1>
            <p className="text-warm-gray-600 dark:text-warm-gray-400 mb-8">
                View all your payments and transactions
            </p>

            {/* Summary Card */}
            <div className="card p-6 mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">Total Payments</p>
                        <p className="text-3xl font-bold text-organic-green-600 dark:text-organic-green-400">
                            R {totalPaid.toFixed(2)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">Transactions</p>
                        <p className="text-3xl font-bold text-warm-gray-900 dark:text-warm-gray-100">
                            {payments?.length || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilterMethod('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterMethod === 'all'
                            ? 'bg-organic-green-600 text-white dark:bg-organic-green-500'
                            : 'bg-warm-gray-100 dark:bg-warm-gray-700 text-warm-gray-700 dark:text-warm-gray-300 hover:bg-warm-gray-200 dark:hover:bg-warm-gray-600'
                        }`}
                >
                    All
                </button>
                {uniqueMethods.map(method => (
                    <button
                        key={method}
                        onClick={() => setFilterMethod(method)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize flex items-center gap-2 ${filterMethod === method
                                ? 'bg-organic-green-600 text-white dark:bg-organic-green-500'
                                : 'bg-warm-gray-100 dark:bg-warm-gray-700 text-warm-gray-700 dark:text-warm-gray-300 hover:bg-warm-gray-200 dark:hover:bg-warm-gray-600'
                            }`}
                    >
                        {METHOD_ICONS[method] || METHOD_ICONS.eft}
                        {method}
                    </button>
                ))}
            </div>

            {/* Payment List */}
            {filteredPayments && filteredPayments.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-warm-gray-800 rounded-lg shadow">
                    <svg className="w-16 h-16 text-warm-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="text-xl font-bold text-warm-gray-900 dark:text-warm-gray-100 mb-2">No payments found</h2>
                    <p className="text-warm-gray-600 dark:text-warm-gray-400">Your payment history will appear here</p>
                </div>
            ) : (
                <div className="card divide-y divide-warm-gray-200 dark:divide-warm-gray-700">
                    {filteredPayments?.map((payment: Payment) => (
                        <div key={payment.id} className="p-4 hover:bg-warm-gray-50 dark:hover:bg-warm-gray-700/50 transition">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${payment.method === 'eft' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' :
                                            payment.method === 'cash' ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' :
                                                payment.method === 'card' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' :
                                                    'bg-warm-gray-100 dark:bg-warm-gray-700 text-warm-gray-600 dark:text-warm-gray-400'
                                        }`}>
                                        {METHOD_ICONS[payment.method] || METHOD_ICONS.eft}
                                    </div>
                                    <div>
                                        <p className="font-medium text-warm-gray-900 dark:text-warm-gray-100 capitalize">
                                            {payment.method} Payment
                                        </p>
                                        <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400">
                                            {new Date(payment.paymentDate).toLocaleDateString('en-ZA', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                        {payment.notes && (
                                            <p className="text-sm text-warm-gray-500 dark:text-warm-gray-400 mt-1">{payment.notes}</p>
                                        )}
                                        {payment.invoice && (
                                            <p className="text-xs text-warm-gray-400 dark:text-warm-gray-500 mt-1">
                                                Invoice #{payment.invoice.id.slice(0, 8)} • {payment.invoice.status}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-organic-green-600 dark:text-organic-green-400">
                                        R {payment.amount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
