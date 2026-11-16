import { HandoffChannel } from '@prisma/client';
import { HandoffPayload, HandoffProvider } from '../types';

/**
 * LeaflyProvider
 *
 * Implements the Leafly checkout handoff integration.
 * Gated by Q-001 (Client clarification pending regarding Leafly API / deep-link structure).
 *
 * This provider implements the complete HandoffProvider interface and provides a compliant
 * deep-link stub to the partner dispensary's Leafly menu until official Leafly API
 * credentials / parameters are provided by the client.
 */
export class LeaflyProvider implements HandoffProvider {
  readonly channel = HandoffChannel.LEAFLY;

  buildUrl(payload: HandoffPayload): string {
    const { subOrder, dispensary } = payload;
    const storeId = dispensary.leaflyStoreId?.trim();

    if (storeId) {
      // If storeId is an absolute URL, append ref query
      if (storeId.startsWith('http://') || storeId.startsWith('https://')) {
        const separator = storeId.includes('?') ? '&' : '?';
        return `${storeId}${separator}owtlet_ref=${encodeURIComponent(subOrder.id)}`;
      }

      return `https://www.leafly.com/dispensary-list/${encodeURIComponent(storeId)}?owtlet_ref=${encodeURIComponent(subOrder.id)}`;
    }

    return `https://www.leafly.com/dispensary-list?owtlet_ref=${encodeURIComponent(subOrder.id)}`;
  }
}

export const leaflyProvider = new LeaflyProvider();

