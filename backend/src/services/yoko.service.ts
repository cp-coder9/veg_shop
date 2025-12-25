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
     * For online checkout, Yoko often uses a redirect/link. 
     * This method would generate a checkout link if using Yoko Checkout.
     */
    async createCheckoutLink(_amountInCents: number, _currency = 'ZAR', _metadata: Record<string, unknown> = {}): Promise<void> {
        // This would typically involve Yoko's checkout API
        // For now, we'll keep it simple with the charge API if tokens are handled on frontend
        console.log('Checkout link functionality to be implemented if required');
        await Promise.resolve();
    }
}

export const yokoService = new YokoService();
