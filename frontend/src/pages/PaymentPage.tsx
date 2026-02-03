import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useInvoice } from '../hooks/useAdminInvoices';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function PaymentPage() {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    // If token is present, we are in public mode.
    // We use a direct axios call to avoid the 401 interceptor redirecting to login on failure.
    const { data: publicInvoice, isLoading: publicLoading, error: publicError } = useQuery({
        queryKey: ['public-invoice', token],
        queryFn: async () => {
            const baseURL = api.defaults.baseURL || '/api';
            const response = await axios.get(`${baseURL}/invoices/public/${token}`);
            return response.data;
        },
        enabled: !!token,
        retry: false
    });

    // Admin/Auth mode (only if no token)
    const { data: adminInvoice, isLoading: adminLoading, error: adminError } = useInvoice(!token ? (invoiceId || '') : '');

    const invoice = token ? publicInvoice : adminInvoice;
    const isLoading = token ? publicLoading : adminLoading;
    const error = token ? publicError : adminError;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {token ? 'Invalid or Expired Payment Link' : 'Invoice Not Found'}
                </h2>
                <p className="text-gray-600 mb-6">
                    {token ? 'Please contact support for a new link.' : "We couldn't find the invoice you're looking for."}
                </p>
                {!token && <button onClick={() => navigate('/dashboard')} className="btn-primary">Back to Dashboard</button>}
            </div>
        );
    }

    const handlePayNow = async () => {
        setIsProcessing(true);
        try {
            toast.loading('Initiating Yoko payment...', { id: 'payment' });

            // Simulating a delay for the payment gateway
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (token) {
                // Public payment endpoint
                await api.post('/payments/public', {
                    token,
                    invoiceId: invoice.id,
                    customerId: invoice.customerId,
                    amount: Number(invoice.total),
                    method: 'yoco',
                    paymentDate: new Date(),
                    notes: 'Paid via online link'
                });
            } else {
                // Admin/Auth endpoint
                await api.post('/payments', {
                    invoiceId: invoice.id,
                    customerId: invoice.customerId,
                    amount: Number(invoice.total),
                    method: 'yoco',
                    paymentDate: new Date(),
                    notes: 'Paid via online link'
                });
            }

            toast.success('Payment successful!', { id: 'payment' });
            navigate('/dashboard?payment_success=true'); // Or a success page for public users?
        } catch (err) {
            toast.error('Payment failed. Please try again.', { id: 'payment' });
        } finally {
            setIsProcessing(false);
        }
    };

    const remainingBalance = Number(invoice.total);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="card overflow-hidden">
                <div className="p-8 bg-organic-green-900 text-white text-center">
                    <h1 className="text-2xl font-bold mb-2">Payment Required</h1>
                    <p className="opacity-80">Invoice #{invoice.id.slice(-8)}</p>
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-center mb-8 pb-8 border-b border-gray-100">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Account</p>
                            <p className="text-lg font-bold text-gray-900">{invoice.customer?.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Due Date</p>
                            <p className="text-lg font-bold text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>R{Number(invoice.subtotal).toFixed(2)}</span>
                        </div>
                        {Number(invoice.creditApplied) > 0 && (
                            <div className="flex justify-between text-green-600 font-medium">
                                <span>Credit Applied</span>
                                <span>-R{Number(invoice.creditApplied).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <span className="text-xl font-bold text-gray-900">Amount Due</span>
                            <span className="text-3xl font-display font-bold text-organic-green-600">
                                R{remainingBalance.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 mb-8">
                        <div className="text-xl">🛡️</div>
                        <p className="text-sm text-amber-800">
                            Payment is processed securely by <strong>Yoko</strong>. We do not store your card details.
                        </p>
                    </div>

                    <button
                        onClick={handlePayNow}
                        disabled={isProcessing || invoice.status === 'paid'}
                        className={`w-full py-4 rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${invoice.status === 'paid'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-organic-green-600 text-white hover:bg-organic-green-700'
                            }`}
                    >
                        {invoice.status === 'paid'
                            ? 'Invoice Already Paid'
                            : isProcessing
                                ? 'Processing...'
                                : `Pay R${remainingBalance.toFixed(2)} Now`
                        }
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        By paying, you agree to our Terms of Service. Need help? <a href="#" className="underline">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
