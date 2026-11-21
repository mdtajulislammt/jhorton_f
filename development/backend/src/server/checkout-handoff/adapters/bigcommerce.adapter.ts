import { AdapterVendorInput, AdapterLineInput, AdapterContext, AdapterResult } from './types';
import { createSignedPayload } from '../signed-payload';
import { HandoffError } from '../types';

/**
 * BigCommerce Adapter:
 * Builds signed payload URL: {cartBaseUrl}/owtlet-cart?payload=...&sig=...
 * Vendor landing script verifies signature and creates BigCommerce cart.
 */
export function buildBigCommerceUrl(
  vendor: AdapterVendorInput,
  lines: AdapterLineInput[],
  context: AdapterContext
): AdapterResult {
  const baseUrl = (vendor.cartBaseUrl || vendor.websiteUrl || '').replace(/\/+$/, '');
  if (!baseUrl) {
    throw new HandoffError('Vendor has no cartBaseUrl or websiteUrl configured', 'VENDOR_NOT_CONFIGURED');
  }

  const items = lines.map((l) => ({
    sku: l.sku,
    vendorSku: l.vendorSku,
    vendorProductId: l.vendorProductId,
    vendorVariantId: l.vendorVariantId,
    quantity: l.quantity,
    name: l.name,
    price: l.price,
  }));

  const { payload, sig } = createSignedPayload(
    vendor.id,
    context.orderNumber,
    items,
    vendor.webhookSecret
  );

  const url = `${baseUrl}/owtlet-cart?payload=${encodeURIComponent(payload)}&sig=${encodeURIComponent(sig)}`;

  return {
    url,
  };
}

