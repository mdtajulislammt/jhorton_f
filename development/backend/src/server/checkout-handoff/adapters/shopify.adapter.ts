import { AdapterVendorInput, AdapterLineInput, AdapterContext, AdapterResult } from './types';
import { HandoffError } from '../types';

/**
 * Shopify Adapter:
 * Builds URL: {cartBaseUrl}/cart/{variantId}:{qty},{variantId}:{qty}
 * Variant IDs are strictly required. Lines without variant IDs are skipped with warnings.
 * Supports optional ?storefront=true via context/setting.
 * If URL > 2000 chars, returns an error asking shopper to split cart.
 */
export function buildShopifyUrl(
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
    const variantId = line.vendorVariantId;
    if (!variantId) {
      warnings.push(`Item ${line.name} (SKU: ${line.sku}) is missing Shopify variant ID and was skipped`);
      continue;
    }
    parts.push(`${variantId}:${line.quantity}`);
  }

  if (parts.length === 0) {
    throw new HandoffError('No mapped items with Shopify variant IDs found in cart', 'NO_MAPPED_ITEMS');
  }

  const itemsPath = parts.join(',');
  const queryParams: string[] = [];
  if (context.storefront) {
    queryParams.push('storefront=true');
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  const url = `${baseUrl}/cart/${itemsPath}${queryString}`;

  if (url.length > 2000) {
    throw new HandoffError(
      'Cart contains too many items for a direct Shopify checkout link (exceeds 2000 characters). Please split your order into smaller carts.',
      'CART_TOO_LONG'
    );
  }

  return {
    url,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

