import { HandoffChannel } from '@prisma/client';
import { HandoffProvider, ProviderConfigurationError } from '../types';
import { retailerPageProvider, RetailerPageProvider } from './retailer-page.provider';
import { leaflyProvider, LeaflyProvider } from './leafly.provider';

export { RetailerPageProvider, retailerPageProvider } from './retailer-page.provider';
export { LeaflyProvider, leaflyProvider } from './leafly.provider';

const providers: Record<HandoffChannel, HandoffProvider> = {
  [HandoffChannel.RETAILER_PAGE]: retailerPageProvider,
  [HandoffChannel.LEAFLY]: leaflyProvider,
};

/**
 * Returns the HandoffProvider registered for the given channel.
 */
export function getHandoffProvider(channel: HandoffChannel): HandoffProvider {
  const provider = providers[channel];
  if (!provider) {
    throw new ProviderConfigurationError(`No handoff provider registered for channel: ${channel}`);
  }
  return provider;
}

