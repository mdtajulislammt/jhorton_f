import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HandoffChannel, SubOrderStatus, CartStatus } from '@prisma/client';
import { prisma } from '../server/db';
import {
  buildWooCommerceUrl,
  buildShopifyUrl,
  buildBigCommerceUrl,
  buildDeepLinkUrl,
  sendOrderRequest,
} from '../server/checkout-handoff/adapters';
import {
  createSignedPayload,
  verifySignedPayload,
} from '../server/checkout-handoff/signed-payload';
import {
  validateHandoffHost,
  appendUtmParameters,
  generateHandoffRedirect,
} from '../server/checkout-handoff/handoff-service';

vi.mock('../server/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subOrder: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    cart: {
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(prisma);
    }),
  },
}));

describe('Vendor Platform Checkout Handoff & Adapters', () => {
  const vendor = {
    id: 'disp-1',
    name: 'Cannablooms',
    slug: 'cannablooms',
    websiteUrl: 'https://cannablooms.com',
    cartBaseUrl: 'https://cannablooms.com',
    webhookSecret: 'secret_12345678901234567890123456789012',
    allowedHosts: ['cannablooms.com'],
  };

  const lines = [
    {
      productId: 'prod-1',
      sku: 'SKU-01',
      name: 'Blue Dream',
      quantity: 2,
      price: '35.00',
      vendorProductId: '101',
      vendorVariantId: '1001',
      vendorSku: 'V-SKU-01',
    },
    {
      productId: 'prod-2',
      sku: 'SKU-02',
      name: 'Sour Diesel',
      quantity: 1,
      price: '40.00',
      vendorProductId: '102',
      vendorVariantId: '1002',
      vendorSku: 'V-SKU-02',
    },
  ];

  const context = {
    orderNumber: 'OWT-100245',
    subOrderId: 'sub-order-123',
  };

  describe('Adapters', () => {
    it('WooCommerce: builds {cartBaseUrl}/cart/?add-to-cart=ID:QTY,ID:QTY using variantId or productId', () => {
      const res = buildWooCommerceUrl(vendor, lines, context);
      expect(res.url).toBe('https://cannablooms.com/cart/?add-to-cart=1001%3A2%2C1002%3A1');
      expect(res.notes).toContain('WooCommerce');
    });

    it('Shopify: builds {cartBaseUrl}/cart/{variantId}:{qty},{variantId}:{qty}', () => {
      const res = buildShopifyUrl(vendor, lines, context);
      expect(res.url).toBe('https://cannablooms.com/cart/1001:2,1002:1');
    });

    it('Shopify: supports storefront=true query param', () => {
      const res = buildShopifyUrl(vendor, lines, { ...context, storefront: true });
      expect(res.url).toBe('https://cannablooms.com/cart/1001:2,1002:1?storefront=true');
    });

    it('Shopify: skips lines without variant ID and warns', () => {
      const linesWithoutVariant = [
        ...lines,
        {
          productId: 'prod-3',
          sku: 'SKU-03',
          name: 'No Variant Product',
          quantity: 1,
        },
      ];
      const res = buildShopifyUrl(vendor, linesWithoutVariant, context);
      expect(res.url).toBe('https://cannablooms.com/cart/1001:2,1002:1');
      expect(res.warnings).toHaveLength(1);
    });

    it('Shopify: rejects URLs exceeding 2000 characters', () => {
      const hugeLines = Array.from({ length: 250 }, (_, i) => ({
        productId: `prod-${i}`,
        sku: `SKU-${i}`,
        name: `Long Product Name ${i}`,
        quantity: 1,
        vendorVariantId: `very_long_shopify_variant_id_number_${i}_0000000000`,
      }));
      expect(() => buildShopifyUrl(vendor, hugeLines, context)).toThrow(/2000 characters/);
    });

    it('BigCommerce: builds signed payload URL', () => {
      const res = buildBigCommerceUrl(vendor, lines, context);
      expect(res.url).toContain('https://cannablooms.com/owtlet-cart?payload=');
      expect(res.url).toContain('&sig=');
    });

    it('DEEP_LINK: returns vendor website with ref and order params', () => {
      const res = buildDeepLinkUrl(vendor, lines, context);
      expect(res.url).toBe('https://cannablooms.com/?ref=sub-order-123&order=OWT-100245');
      expect(res.requiresManualHandoff).toBe(true);
    });

    it('ORDER_REQUEST: generates stub confirmation URL', async () => {
      const res = await sendOrderRequest(vendor, lines, context);
      expect(res.url).toBe('/order/OWT-100245?requested=1');
    });
  });

  describe('Signed Payloads (HMAC-SHA256)', () => {
    it('generates valid payload and verifies successfully', () => {
      const { payload, sig } = createSignedPayload(
        vendor.id,
        context.orderNumber,
        lines as any,
        vendor.webhookSecret,
        60
      );

      const verification = verifySignedPayload(payload, sig, vendor.webhookSecret);
      expect(verification.valid).toBe(true);
      expect(verification.data?.orderNumber).toBe('OWT-100245');
      expect(verification.data?.items).toHaveLength(2);
    });

    it('fails verification on tampered signature', () => {
      const { payload } = createSignedPayload(
        vendor.id,
        context.orderNumber,
        lines as any,
        vendor.webhookSecret
      );

      const tamperedSig = 'a'.repeat(64);
      const verification = verifySignedPayload(payload, tamperedSig, vendor.webhookSecret);
      expect(verification.valid).toBe(false);
      expect(verification.reason).toBe('INVALID_SIGNATURE');
    });

    it('fails verification on expired payload', () => {
      const { payload, sig } = createSignedPayload(
        vendor.id,
        context.orderNumber,
        lines as any,
        vendor.webhookSecret,
        10 // expires in 10s
      );

      // Verify at timestamp 20s later
      const verification = verifySignedPayload(
        payload,
        sig,
        vendor.webhookSecret,
        Math.floor(Date.now() / 1000) + 20
      );
      expect(verification.valid).toBe(false);
      expect(verification.reason).toBe('EXPIRED');
    });
  });

  describe('Host Whitelist & UTM Tracking', () => {
    it('accepts permitted hosts and subdomains', () => {
      expect(validateHandoffHost('https://cannablooms.com/cart', ['cannablooms.com'])).toBe(true);
      expect(validateHandoffHost('https://shop.cannablooms.com/cart', ['cannablooms.com'])).toBe(true);
    });

    it('rejects disallowed open redirect hosts', () => {
      expect(validateHandoffHost('https://malicious-phishing.com/cart', ['cannablooms.com'])).toBe(false);
      expect(validateHandoffHost('https://evilcannablooms.com', ['cannablooms.com'])).toBe(false);
    });

    it('appends UTM parameters properly', () => {
      const result = appendUtmParameters('https://cannablooms.com/cart?add-to-cart=101', 'OWT-100245');
      expect(result).toContain('utm_source=owtlet');
      expect(result).toContain('utm_medium=referral');
      expect(result).toContain('utm_campaign=cart_handoff');
      expect(result).toContain('utm_content=OWT-100245');
    });
  });

  it('fails closed when allowedHosts is empty', () => {
    expect(validateHandoffHost('https://cannablooms.com/cart', [])).toBe(false);
  });

  describe('generateHandoffRedirect (Full Flow & Cart Retention)', () => {
    it('builds verified redirect URL, marks SubOrder HANDED_OFF and Cart CONVERTED', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'OWT-100245',
        cartId: 'cart-1',
        shopperId: 'shopper-1',
        cart: { sessionToken: 'sess-1' },
        subOrders: [
          {
            id: 'sub-1',
            dispensaryId: 'disp-1',
            handoffChannel: HandoffChannel.WOOCOMMERCE,
            dispensary: {
              ...vendor,
              vendorMappings: [
                { productId: 'prod-1', vendorVariantId: '1001', vendorProductId: '101' },
              ],
            },
            items: [
              {
                productId: 'prod-1',
                name: 'Blue Dream',
                quantity: 2,
                unitPrice: '35.00',
              },
            ],
          },
        ],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.subOrder.findMany).mockResolvedValue([{ status: SubOrderStatus.HANDED_OFF }] as any);

      const res = await generateHandoffRedirect({
        orderId: 'order-1',
        session: { shopperId: 'shopper-1' },
      });

      expect(res.redirectUrl).toContain('https://cannablooms.com/cart/?add-to-cart=1001%3A2');
      expect(res.redirectUrl).toContain('utm_source=owtlet');
      expect(res.redirectUrl).toContain('utm_content=OWT-100245');

      expect(prisma.subOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({ status: SubOrderStatus.HANDED_OFF }),
        })
      );

      expect(prisma.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cart-1' },
          data: expect.objectContaining({ status: CartStatus.CONVERTED }),
        })
      );
    });

    it('allows a verified logged-in shopper to pass handoff ownership check', async () => {
      const mockOrder = {
        id: 'order-shopper-1',
        orderNumber: 'OWT-999',
        cartId: 'cart-999',
        shopperId: 'shopper-verified-uuid',
        cart: { sessionToken: 'diff-sess' },
        subOrders: [
          {
            id: 'sub-999',
            dispensaryId: 'disp-1',
            handoffChannel: HandoffChannel.DEEP_LINK,
            dispensary: {
              ...vendor,
              vendorMappings: [],
            },
            items: [],
          },
        ],
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.subOrder.findMany).mockResolvedValue([{ status: SubOrderStatus.HANDED_OFF }] as any);

      const res = await generateHandoffRedirect({
        orderId: 'order-shopper-1',
        session: { shopperId: 'shopper-verified-uuid' },
      });

      expect(res.redirectUrl).toContain('cannablooms.com');
    });
  });
});
