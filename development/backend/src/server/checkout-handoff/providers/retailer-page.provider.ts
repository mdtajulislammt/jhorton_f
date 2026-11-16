import { HandoffChannel } from '@prisma/client';
import { HandoffPayload, HandoffProvider } from '../types';

/**
 * RetailerPageProvider
 *
 * Implements direct retailer menu / checkout redirection using the dispensary's
 * configured `handoffUrlTemplate`.
 *
 * Complies with ADR-005: Shopper is handed off to the licensed partner's direct order page.
 * All payment processing and 21+ physical ID verification occur with the retailer.
 */
export class RetailerPageProvider implements HandoffProvider {
  readonly channel = HandoffChannel.RETAILER_PAGE;

  buildUrl(payload: HandoffPayload): string {
    const { subOrder, dispensary, order } = payload;
    const template = dispensary.handoffUrlTemplate?.trim();

    if (!template) {
      // Default fallback if dispensary has not yet set up a custom URL template
      const slug = dispensary.slug || 'retailer';
      return `https://${slug}.ny.retailer.com/order?ref=${encodeURIComponent(subOrder.id)}`;
    }

    const orderNumber = subOrder.orderNumber || order?.orderNumber || '';

    let url = template
      .replace(/\{subOrderId\}/g, encodeURIComponent(subOrder.id))
      .replace(/\{orderId\}/g, encodeURIComponent(subOrder.orderId))
      .replace(/\{orderNumber\}/g, encodeURIComponent(orderNumber))
      .replace(/\{dispensaryId\}/g, encodeURIComponent(dispensary.id))
      .replace(/\{ref\}/g, encodeURIComponent(subOrder.id));

    // If template didn't include reference token placeholders, ensure ref query param is present
    if (!template.includes('{subOrderId}') && !template.includes('{ref}')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}ref=${encodeURIComponent(subOrder.id)}`;
    }

    return url;
  }
}

export const retailerPageProvider = new RetailerPageProvider();

