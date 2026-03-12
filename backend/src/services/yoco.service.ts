import axios from 'axios';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Yoco API endpoints
const YOCO_CHECKOUT_API_URL = 'https://api.yoco.com/api/v1/checkouts';
const YOCO_REALTIME_API_URL = 'https://api.yoco.com/api/v1/payments';

// Configuration from environment
const YOCO_SECRET_KEY = env.YOCO_SECRET_KEY;
const YOCO_PUBLIC_KEY = env.YOCO_PUBLIC_KEY;
const YOCO_WEBHOOK_SECRET = env.YOCO_WEBHOOK_SECRET;

// Types for Yoco API responses
export interface YocoCheckoutSession {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  redirectUrl?: string;
}

export interface YocoPaymentStatus {
  id: string;
  status: 'succeeded' | 'pending' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  metadata?: {
    invoiceId?: string;
    customerId?: string;
  };
  createdAt: string;
}

export interface CreateCheckoutRequest {
  amount: number; // Amount in cents
  currency: string;
  invoiceId: string;
  customerId?: string;
  redirectUrl: string;
  cancelUrl?: string;
}

export interface CheckoutResponse {
  success: boolean;
  checkoutId?: string;
  redirectUrl?: string;
  errorMessage?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  payment?: YocoPaymentStatus;
  errorMessage?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  payload?: YocoPaymentStatus;
  errorMessage?: string;
}

export class YocoService {
  private getSecretKey(): string {
    if (!YOCO_SECRET_KEY) {
      throw new Error('YOCO_SECRET_KEY is not configured');
    }
    return YOCO_SECRET_KEY;
  }

  /**
   * Create a Yoco checkout session
   * Uses the Yoco Checkout API: https://developer.yoco.com/api-reference/checkout-api
   */
  async createCheckoutSession(request: CreateCheckoutRequest): Promise<CheckoutResponse> {
    // If no Yoco keys configured, return mock response for development
    if (!YOCO_SECRET_KEY || !YOCO_PUBLIC_KEY) {
      console.warn('[DEV MODE] Yoco API keys not configured, simulating checkout');
      return {
        success: true,
        checkoutId: `mock_checkout_${Date.now()}`,
        redirectUrl: `${request.redirectUrl}?checkoutId=mock_checkout_${Date.now()}&status=completed`,
      };
    }

    try {
      const response = await axios.post(
        YOCO_CHECKOUT_API_URL,
        {
          amount: request.amount,
          currency: request.currency,
          payment_method: 'card',
          redirect_url: request.redirectUrl,
          cancel_redirect_url: request.cancelUrl || request.redirectUrl,
          metadata: {
            invoiceId: request.invoiceId,
            customerId: request.customerId,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.getSecretKey()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (data.id) {
        return {
          success: true,
          checkoutId: data.id,
          redirectUrl: data.redirect_url,
        };
      } else {
        return {
          success: false,
          errorMessage: 'Failed to create checkout session',
        };
      }
    } catch (error) {
      console.error('Yoco Checkout API Error:', error);
      
      if (axios.isAxiosError<{ message?: string }>(error) && error.response) {
        return {
          success: false,
          errorMessage: error.response.data?.message || 'Payment gateway error',
        };
      }
      
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Connection to payment gateway failed',
      };
    }
  }

  /**
   * Verify payment status using Yoco Realtime API
   * Uses the Yoco Realtime API: https://developer.yoco.com/api-reference/yoco-api
   */
  async verifyPayment(paymentId: string): Promise<PaymentVerificationResult> {
    // If no Yoco keys configured, return mock response for development
    if (!YOCO_SECRET_KEY) {
      console.warn('[DEV MODE] Yoco Secret Key not configured, simulating payment verification');
      return {
        success: true,
        payment: {
          id: paymentId,
          status: 'succeeded',
          amount: 0,
          currency: 'ZAR',
          createdAt: new Date().toISOString(),
        },
      };
    }

    try {
      const response = await axios.get(
        `${YOCO_REALTIME_API_URL}/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getSecretKey()}`,
          },
        }
      );

      const data = response.data;

      return {
        success: true,
        payment: {
          id: data.id,
          status: data.status,
          amount: data.amount,
          currency: data.currency,
          metadata: data.metadata,
          createdAt: data.created_at || data.createdDate,
        },
      };
    } catch (error) {
      console.error('Yoco Payment Verification Error:', error);
      
      if (axios.isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 404) {
          return {
            success: false,
            errorMessage: 'Payment not found',
          };
        }
        return {
          success: false,
          errorMessage: error.response?.data?.message || 'Failed to verify payment',
        };
      }
      
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Connection to payment gateway failed',
      };
    }
  }

  /**
   * Verify webhook signature and parse webhook payload
   * Yoco uses HMAC-SHA256 for webhook signature verification
   */
  handleWebhook(payload: string, signature: string): WebhookVerificationResult {
    if (!YOCO_WEBHOOK_SECRET) {
      console.warn('[DEV MODE] Yoco Webhook Secret not configured, skipping signature verification');
      // Parse the JSON payload
      try {
        const parsed = JSON.parse(payload);
        return {
          valid: true,
          payload: this.parseWebhookPayload(parsed),
        };
      } catch {
        return {
          valid: false,
          errorMessage: 'Invalid webhook payload',
        };
      }
    }

    // Verify signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', YOCO_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    // Compare signatures using timing-safe comparison
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    
    if (signatureBuffer.length !== expectedBuffer.length || 
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.error('Invalid Yoco webhook signature');
      return {
        valid: false,
        errorMessage: 'Invalid webhook signature',
      };
    }

    // Parse the JSON payload
    try {
      const parsed = JSON.parse(payload);
      return {
        valid: true,
        payload: this.parseWebhookPayload(parsed),
      };
    } catch {
      return {
        valid: false,
        errorMessage: 'Invalid webhook payload',
      };
    }
  }

  /**
   * Parse webhook payload into YocoPaymentStatus
   */
  private parseWebhookPayload(data: any): YocoPaymentStatus {
    return {
      id: data.id || data.paymentId,
      status: data.status,
      amount: data.amount,
      currency: data.currency || 'ZAR',
      metadata: data.metadata,
      createdAt: data.createdDate || data.created_at || new Date().toISOString(),
    };
  }

  /**
   * Generate a payment page URL for an invoice (for payment links)
   */
  getPaymentPageUrl(invoiceId: string, amount: number): string {
    const baseUrl = process.env.CORS_ORIGIN?.replace('http://localhost:5173', 'http://localhost:5173') || 'http://localhost:5173';
    return `${baseUrl}/payment/${invoiceId}?amount=${amount}`;
  }

  /**
   * Check if Yoco is configured
   */
  isConfigured(): boolean {
    return !!(YOCO_SECRET_KEY && YOCO_PUBLIC_KEY);
  }
}

export const yocoService = new YocoService();
