import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { HandoffButton } from '@/components/modules/checkout/HandoffButton';

const renderClean = (component: React.ReactElement) => {
  return renderToString(component).replace(/<!--.*?-->/g, '');
};

describe('HandoffButton Component (Single Vendor Checkout Handoff)', () => {
  const baseProps = {
    subOrderId: 'sub-order-uuid-1',
    orderId: 'order-uuid-1',
    dispensaryName: 'Cannablooms',
    handoffChannel: 'WOOCOMMERCE',
    platform: 'WOOCOMMERCE',
    status: 'PENDING',
  };

  it('renders dispensary name and platform badge', () => {
    const html = renderClean(<HandoffButton {...baseProps} />);

    expect(html).toContain('Cannablooms');
    expect(html).toContain('WOOCOMMERCE');
    expect(html).toContain('Ready for Handoff');
    expect(html).toContain('Continue to Cannablooms checkout');
  });

  it('renders Shopify platform badge when platform is SHOPIFY', () => {
    const html = renderClean(
      <HandoffButton
        {...baseProps}
        dispensaryName="Culture House"
        handoffChannel="SHOPIFY"
        platform="SHOPIFY"
      />
    );

    expect(html).toContain('Culture House');
    expect(html).toContain('SHOPIFY');
    expect(html).toContain('Continue to Culture House checkout');
  });

  it('displays the mandatory zero-ID and zero-payment compliance notice', () => {
    const html = renderClean(<HandoffButton {...baseProps} />);

    expect(html).toContain('data-testid="compliance-notice"');
    expect(html).toContain('Zero ID &amp; Zero Payment Policy');
    expect(html).toContain(
      'Physical 21+ photo ID verification and payment occur directly with'
    );
    expect(html).toContain('Owtlet never collects government ID or cannabis payments.');
  });

  it('renders Transferred to Store state when status is HANDED_OFF', () => {
    const html = renderClean(
      <HandoffButton
        {...baseProps}
        status="HANDED_OFF"
      />
    );

    expect(html).toContain('Transferred to Store');
    expect(html).toContain('Reopen Cannablooms Order Page');
  });

  it('renders finalized confirmation badge when status is CONFIRMED', () => {
    const html = renderClean(
      <HandoffButton {...baseProps} status="CONFIRMED" />
    );

    expect(html).toContain('Order Confirmed');
    expect(html).toContain('This sub-order has been finalized and confirmed by Cannablooms.');
    expect(html).not.toContain('Continue to Cannablooms checkout');
  });

  it('enforces min-h-[44px] ergonomic touch target and active compression', () => {
    const html = renderClean(<HandoffButton {...baseProps} />);

    expect(html).toContain('min-h-[44px]');
    expect(html).toContain('active:scale-[0.98]');
  });
});
