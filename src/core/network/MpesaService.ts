import { ErrorHandler } from '../error_handler/ErrorHandler';

/**
 * BIZREEL M-PESA GATEWAY (Safaricom Daraja API)
 * This service communicates with your Supabase Edge Function to trigger STK Push.
 */
export class MpesaService {
  // Use EXPO_PUBLIC_MPESA_MODE to switch between 'sandbox' and 'production'
  private static IS_SANDBOX = process.env.EXPO_PUBLIC_MPESA_MODE === 'sandbox' || true;

  private static BASE_URL = process.env.EXPO_PUBLIC_EDGE_FUNCTION_URL
    ? `${process.env.EXPO_PUBLIC_EDGE_FUNCTION_URL}/mpesa-gateway`
    : 'https://placeholder.supabase.co/functions/v1/mpesa-gateway';

  /**
   * Triggers the M-Pesa PIN prompt on the user's phone.
   */
  static async initiateStkPush(phoneNumber: string, amount: number, reference: string) {
    try {
      console.log(`[MPESA] Initiating ${this.IS_SANDBOX ? 'SANDBOX' : 'LIVE'} STK Push for ${phoneNumber}`);

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Auth header if needed for your edge function
        },
        body: JSON.stringify({
          phone: phoneNumber,
          amount: Math.round(amount), // M-Pesa requires whole numbers in some APIs
          reference: reference,
          isSandbox: this.IS_SANDBOX
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'M-Pesa Gateway Error');
      }

      return result;
    } catch (e: any) {
      ErrorHandler.handle(e, 'MpesaSTK');
      throw e;
    }
  }
}
