import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { HandoffButton } from '@/components/modules/checkout/HandoffButton';

const renderClean = (component: React.ReactElement) => {
  return renderToString(component).replace(/<!--.*?-->/g, '');
};

describe('HandoffButton Component (Friday & Jarvis UI Verification - TASK-013, AC-HND-01)', () => {
  const baseProps = {
    subOrderId: 'sub-order-uuid-1',
    orderId: 'order-uuid-1',
    dispensaryName: 'Gotham Greenery',
    handoffChannel: 'RETAILER_PAGE',
    status: 'PENDING',
  };

  it('renders dispensary name and Retailer Menu channel badge', () => {
    const html = renderClean(<HandoffButton {...baseProps} />);

    expect(html).toContain('Gotham Greenery');
    expect(html).toContain('Retailer Menu');
    expect(html).toContain('Ready for Handoff');
    expect(html).toContain('Complete Order at Gotham Greenery');
  });

  it('renders Leafly channel badge when handoffChannel is LEAFLY', () => {
    const html = renderClean(
      <HandoffButton
        {...baseProps}
        dispensaryName="Kings County Botanicals"
        handoffChannel="LEAFLY"
      />
    );

    expect(html).toContain('Kings County Botanicals');
    expect(html).toContain('Leafly Handoff');
    expect(html).toContain('Complete Order on Leafly (Kings County Botanicals)');
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
        initialHandoffUrl="https://gothamgreenery.ny.retailer.com/order?ref=sub-order-uuid-1"
      />
    );

    expect(html).toContain('Transferred to Store');
    expect(html).toContain('Reopen Gotham Greenery Order Page');
  });

  it('renders finalized confirmation badge when status is CONFIRMED', () => {
    const html = renderClean(
      <HandoffButton {...baseProps} status="CONFIRMED" />
    );

    expect(html).toContain('Order Confirmed');
    expect(html).toContain('This sub-order has been finalized and confirmed by Gotham Greenery.');
    expect(html).not.toContain('Complete Order at Gotham Greenery');
  });

  it('enforces min-h-[44px] ergonomic touch target and active compression', () => {
    const html = renderClean(<HandoffButton {...baseProps} />);

    expect(html).toContain('min-h-[44px]');
    expect(html).toContain('active:scale-[0.98]');
  });
});

