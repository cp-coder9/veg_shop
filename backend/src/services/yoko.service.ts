import axios from 'axios';

const YOKO_SECRET_KEY = process.env.YOKO_SECRET_KEY || '';
const YOKO_API_URL = 'https://online.yoko.co.za/v1';

export interface YokoChargeResult {
    success: boolean;
    chargeId?: string;
    errorMessage?: string;
    status?: string;
}

interface YokoResponse {
    status: string;
    id?: string;
    errorMessage?: string;
    displayMessage?: string;
}

export class YokoService {
    /**
     * Create a charge via Yoko API
     */
    async createCharge(token: string, amountInCents: number, currency = 'ZAR'): Promise<YokoChargeResult> {
        if (!YOKO_SECRET_KEY) {
            console.warn('[DEV MODE] Yoko Secret Key not configured, simulating successful charge');
            return { success: true, chargeId: 'mock_charge_' + Date.now(), status: 'successful' };
        }

        try {
            const response = await axios.post<YokoResponse>(
                `${YOKO_API_URL}/charges`,
                {
                    token,
                    amountInCents,
                    currency,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${YOKO_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = response.data;

            if (data.status === 'successful') {
                return {
                    success: true,
                    chargeId: data.id,
                    status: data.status,
                };
            } else {
                return {
                    success: false,
                    errorMessage: data.errorMessage || 'Charge failed',
                    status: data.status,
                };
            }
        } catch (error) {
            console.error('Yoko Charge Error:', error);
            if (axios.isAxiosError<YokoResponse>(error) && error.response) {
                return {
                    success: false,
                    errorMessage: error.response.data.displayMessage || 'Payment gateway error',
                };
            }
            return {
                success: false,
                errorMessage: 'Connection to payment gateway failed',
            };
        }
    }

    /**
     * Generate a payment page URL for an invoice
     * Since we might not have a dynamic link capability configured, we'll route to our frontend payment page.
     */
    getPaymentPageUrl(invoiceId: string, _amount: number): string {
        // Construct a URL to the frontend payment page
        // Ensure VITE_APP_URL is set in environment, or fallback to localhost
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return `${baseUrl}/payment/${invoiceId}`;
    }
}

export const yokoService = new YokoService();
