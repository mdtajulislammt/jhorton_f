import { AdapterVendorInput, AdapterLineInput, AdapterContext, AdapterResult } from './types';
import { HandoffError } from '../types';

/**
 * WooCommerce Adapter:
 * Builds URL: {cartBaseUrl}/cart/?add-to-cart=ID:QTY,ID:QTY
 * Uses vendorVariantId if present else vendorProductId.
 * Vendor must have a multi add-to-cart plugin installed.
 */
export function buildWooCommerceUrl(
  vendor: AdapterVendorInput,
  lines: AdapterLineInput[],
  context: AdapterContext
): AdapterResult {
  const baseUrl = (vendor.cartBaseUrl || vendor.websiteUrl || '').replace(/\/+$/, '');
  if (!baseUrl) {
    throw new HandoffError('Vendor has no cartBaseUrl or websiteUrl configured', 'VENDOR_NOT_CONFIGURED');
  }

  const warnings: string[] = [];
  const parts: string[] = [];

  for (const line of lines) {
    const targetId = line.vendorVariantId || line.vendorProductId;
    if (!targetId) {
      warnings.push(`Item ${line.name} (SKU: ${line.sku}) is missing WooCommerce product ID and was omitted`);
      continue;
    }
    parts.push(`${targetId}:${line.quantity}`);
  }

  if (parts.length === 0) {
    throw new HandoffError('No mapped items could be added to WooCommerce cart', 'NO_MAPPED_ITEMS');
  }

  const addParam = parts.join(',');
  const url = `${baseUrl}/cart/?add-to-cart=${encodeURIComponent(addParam)}`;
  const notes = vendor.handoffNotes || 'Requires WooCommerce multi add-to-cart plugin';

  return {
    url,
    warnings: warnings.length > 0 ? warnings : undefined,
    notes,
  };
}

