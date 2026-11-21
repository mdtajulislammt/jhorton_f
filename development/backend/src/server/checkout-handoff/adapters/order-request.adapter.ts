import { AdapterVendorInput, AdapterLineInput, AdapterContext, AdapterResult } from './types';

export interface OrderRequestPayload {
  vendorId: string;
  orderNumber: string;
  subOrderId: string;
  items: Array<{
    sku: string;
    vendorSku?: string | null;
    quantity: number;
    name: string;
  }>;
}

/**
 * ORDER_REQUEST Adapter (Stub with interface + TODO):
 * Prepares direct order submission to vendor via webhook or email.
 * Redirects to /order/[id]?requested=1 instead of fake url.
 */
export async function sendOrderRequest(
  vendor: AdapterVendorInput,
  lines: AdapterLineInput[],
  context: AdapterContext
): Promise<AdapterResult> {
  // TODO: Implement actual email/webhook dispatch when vendor endpoint is configured
  return {
    url: `/order/${encodeURIComponent(context.orderId || context.orderNumber)}?requested=1`,
    notes: 'Order request submitted to partner dispensary for fulfillment.',
  };
}

