import { AdapterVendorInput, AdapterLineInput, AdapterContext, AdapterResult } from './types';
import { HandoffError } from '../types';

/**
 * DEEP_LINK Adapter (Default / Fallback):
 * Returns the vendor website (or landing URL) and lists items for shopper to add manually.
 */
export function buildDeepLinkUrl(
  vendor: AdapterVendorInput,
  lines: AdapterLineInput[],
  context: AdapterContext
): AdapterResult {
  const baseUrl = (vendor.websiteUrl || vendor.cartBaseUrl || '').replace(/\/+$/, '');
  if (!baseUrl) {
    throw new HandoffError('Vendor has no websiteUrl or cartBaseUrl configured', 'VENDOR_NOT_CONFIGURED');
  }

  const notes = vendor.handoffNotes || 'Shopper will add items directly on the partner website';

  return {
    url: `${baseUrl}/?ref=${encodeURIComponent(context.subOrderId)}&order=${encodeURIComponent(context.orderNumber)}`,
    notes,
    requiresManualHandoff: true,
  };
}

