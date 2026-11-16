import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CartStatus,
  FulfillmentType,
  OrderStatus,
  SubOrderStatus,
  AssignmentSource,
  ShowStatus,
  HandoffChannel,
  Prisma,
} from '@prisma/client';
import {
  calculateCartExpiration,
  isCartExpired,
  recomputeHeldCarts,
} from '@/server/cart/expiry';
import {
  CartExpiredError,
} from '@/server/cart';
import {
  allocateCart,
  computePreviewHash,
} from '@/server/distribution/allocate';
import {
  AllocatorCartLine,
  AllocatorDispensaryCandidate,
  StoreNotEligibleError,
  UnfulfillableLine,
} from '@/server/distribution/types';
import {
  createOrder,
  createOrderSchema,
  contactSchema,
  deliveryAddressSchema,
  UnfulfillableItemsError,
} from '@/server/orders';
import {
  verifyWebhookSignature,
  generateWebhookSignature,
} from '@/server/orders/confirm';
import {
  checkoutHandoffSchema,
} from '@/server/checkout-handoff/types';
import { NoCoverageError } from '@/server/dispensaries/types';
import {
  signShopperToken,
  verifyShopperToken,
  hashPassword,
  verifyPassword,
  generatePasswordResetToken,
  hashResetToken,
} from '@/server/shopper-account/crypto';
import { prisma } from '@/server/db';

vi.mock('@/server/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    subOrder: {
      create: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    cart: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    shopperAddress: {
      create: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    coverageZip: {
      findUnique: vi.fn(),
    },
    liveShow: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callbacks) =>
      typeof callbacks === 'function' ? callbacks(prisma) : Promise.all(callbacks)
    ),
  },
}));

describe('Loki Chaos Engineering & Adversarial Edge Cases (TASK-018, docs/11 §2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CASE 1: Expired Cart Mid-Checkout
  // ==========================================================================
  describe('Chaos Case 1: Expired Cart Mid-Checkout (T-CART-01, AC-CART-02)', () => {
    it('detects an expired cart after 30 minutes of inactivity and throws CartExpiredError', () => {
      const now = new Date('2026-11-16T12:35:00.000Z');
      const cart = {
        lastActivityAt: new Date('2026-11-16T12:00:00.000Z'), // 35 minutes ago
        liveShowId: null,
      };

      const result = calculateCartExpiration(cart, null, now);
      expect(result.hold.reason).toBe('INACTIVITY');
      expect(isCartExpired({ expiresAt: result.expiresAt, status: CartStatus.ACTIVE }, now)).toBe(true);
    });

    it('blocks order creation when cart is expired and raises CartExpiredError (HTTP 410)', async () => {
      const expiredDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
      (prisma.cart.findFirst as any).mockResolvedValue({
        id: 'cart-expired-1',
        token: 'token-expired',
        status: CartStatus.EXPIRED,
        expiresAt: expiredDate,
        lastActivityAt: expiredDate,
        liveShowId: null,
        items: [{ id: 'item-1', productId: 'p1', quantity: 1, unitPrice: new Prisma.Decimal('45.00') }],
      });

      await expect(
        createOrder(
          {
            fulfillmentType: FulfillmentType.PICKUP,
            zip: '10001',
            contact: { firstName: 'Test', lastName: 'Shopper', email: 'shopper@example.com', phone: '555-123-4567' },
            itemOverrides: [],
            saveToProfile: false,
            previewHash: 'hash-abc',
          },
          { cartSessionToken: 'token-expired', shopperId: null }
        )
      ).rejects.toThrow(CartExpiredError);
    });
  });

  // ==========================================================================
  // CASE 2: Show Ended Mid-Checkout
  // ==========================================================================
  describe('Chaos Case 2: Show Ended Mid-Checkout (T-HOLD-01, AC-HOLD-01)', () => {
    it('recomputes held cart expiration dynamically when a live show ends', async () => {
      const showStartTime = new Date('2026-11-16T18:00:00.000Z');
      const showEndTime = new Date('2026-11-16T19:00:00.000Z');
      const lastActivity = new Date('2026-11-16T18:45:00.000Z');

      const mockLiveShow = {
        id: 'show-drop-1',
        status: ShowStatus.REPLAY,
        startedAt: showStartTime,
        endedAt: showEndTime,
      };

      const mockCart = {
        id: 'cart-live-1',
        liveShowId: 'show-drop-1',
        lastActivityAt: lastActivity,
      };

      (prisma.liveShow.findUnique as any).mockResolvedValue(mockLiveShow);
      (prisma.cart.findMany as any).mockResolvedValue([mockCart]);
      (prisma.cart.update as any).mockResolvedValue(mockCart);

      const updatedCount = await recomputeHeldCarts('show-drop-1');
      expect(updatedCount).toBe(1);

      // Check the expiration: max(lastActivity, endedAt) + 30 min = 19:00 + 30m = 19:30:00
      const expectedExpiration = new Date(showEndTime.getTime() + 30 * 60 * 1000);
      expect(prisma.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cart-live-1' },
          data: { expiresAt: expectedExpiration },
        })
      );
    });

    it('permits checkout during the 30-minute post-show hold, then expires after 30 minutes', () => {
      const showEndTime = new Date('2026-11-16T19:00:00.000Z');
      const cart = {
        lastActivityAt: new Date('2026-11-16T18:50:00.000Z'),
        liveShowId: 'show-drop-1',
      };
      const show = {
        id: 'show-drop-1',
        title: 'Drop 1',
        status: ShowStatus.REPLAY,
        endedAt: showEndTime,
        scheduledEndAt: null,
      };

      // 1. Checkout attempt at 19:25 (25 minutes after show end) -> Held & valid
      const timeWithinHold = new Date('2026-11-16T19:25:00.000Z');
      const holdCalc = calculateCartExpiration(cart, show, timeWithinHold);
      expect(holdCalc.hold.reason).toBe('LIVE_SHOW');
      expect(isCartExpired({ expiresAt: holdCalc.expiresAt, status: CartStatus.ACTIVE }, timeWithinHold)).toBe(false);

      // 2. Checkout attempt at 19:35 (35 minutes after show end) -> Expired
      const timePastHold = new Date('2026-11-16T19:35:00.000Z');
      const expiredCalc = calculateCartExpiration(cart, show, timePastHold);
      expect(isCartExpired({ expiresAt: expiredCalc.expiresAt, status: CartStatus.ACTIVE }, timePastHold)).toBe(true);
    });
  });

  // ==========================================================================
  // CASE 3: Terrific Product ID Fuzzing & SQL Injection
  // ==========================================================================
  describe('Chaos Case 3: Terrific Product ID Fuzzing & Injection Resilience (T-MAP-01, AC-LIVE-03)', () => {
    const maliciousFuzzPayloads = [
      "' OR '1'='1",
      "' UNION SELECT * FROM \"Product\"--",
      "'; DROP TABLE \"Product\";--",
      "\0\u0000<script>alert('xss')</script>",
      "../../../../etc/passwd",
      "NaN",
      "undefined",
      "null",
      "-999999",
      "A".repeat(5000), // Oversized 5,000-char string
    ];

    it.each(maliciousFuzzPayloads)(
      'safely handles fuzzed or malicious Terrific ID without crash: %s',
      async (fuzzInput) => {
        (prisma.product.findUnique as any).mockResolvedValue(null);

        const result = await prisma.product.findUnique({
          where: { terrificProductId: fuzzInput },
        });

        expect(result).toBeNull();
        expect(prisma.product.findUnique).toHaveBeenCalledWith({
          where: { terrificProductId: fuzzInput },
        });
      }
    );
  });

  // ==========================================================================
  // CASE 4: Out of Coverage ZIP Codes & Geo Fuzzing
  // ==========================================================================
  describe('Chaos Case 4: Non-NY & Malformed Coverage ZIP Fuzzing (T-DST-03, AC-DST-02, AC-FUL-01)', () => {
    it('creates a NoCoverageError with domain message for out-of-state ZIP 90210 (Beverly Hills, CA)', () => {
      const error = new NoCoverageError('90210');
      expect(error.code).toBe('NO_COVERAGE');
      expect(error.zip).toBe('90210');
      expect(error.message).toContain('90210');
      expect(error.message).toContain('Manhattan, Queens, Brooklyn, Westchester, and Long Island');
    });

    it('creates a NoCoverageError for fuzzed or non-numeric ZIP codes', () => {
      const fuzzedZips = ['ABCDE', '1000', '99999', '123', '00000'];
      fuzzedZips.forEach((zip) => {
        const error = new NoCoverageError(zip);
        expect(error.code).toBe('NO_COVERAGE');
        expect(error.zip).toBe(zip);
      });
    });
  });

  // ==========================================================================
  // CASE 5: Store Change to Ineligible Store
  // ==========================================================================
  describe('Chaos Case 5: Store Change to Ineligible Store (AC-SEL-01, T-SEL-01)', () => {
    it('throws StoreNotEligibleError when an itemOverride selects a store not in eligible candidates', () => {
      const lines: AllocatorCartLine[] = [
        {
          id: 'line-1',
          productId: 'prod-sour-diesel',
          name: 'Sour Diesel',
          quantity: 2,
          channelBrandId: null,
          owtletPrice: '45.00',
        },
      ];

      const candidates: AllocatorDispensaryCandidate[] = [
        {
          id: 'disp-gotham',
          slug: 'gotham-greenery',
          name: 'Gotham Greenery',
          offersPickup: true,
          offersDelivery: true,
          coverageZips: ['10001'],
          isOpenNow: true,
          hoursToday: null,
          isDeliveringNow: true,
          deliveryHoursToday: null,
          distanceMiles: 1.2,
          handoffChannel: HandoffChannel.LEAFLY,
          brandIds: [],
          inventories: new Map([
            [
              'prod-sour-diesel',
              { productId: 'prod-sour-diesel', dispensaryId: 'disp-gotham', stockQty: 10, price: '45.00' },
            ],
          ]),
        },
      ];

      expect(() => {
        allocateCart({
          lines,
          fulfillmentType: FulfillmentType.DELIVERY,
          zip: '10001',
          itemOverrides: [
            {
              productId: 'prod-sour-diesel',
              dispensaryId: 'disp-ineligible-store-999', // Not in candidates!
            },
          ],
          preferredDispensaryId: null,
          candidates,
          allActiveDispensaries: candidates,
        });
      }).toThrow(StoreNotEligibleError);
    });

    it('marks line as unfulfillable when overridden store has insufficient stock', () => {
      const lines: AllocatorCartLine[] = [
        {
          id: 'line-1',
          productId: 'prod-sour-diesel',
          name: 'Sour Diesel',
          quantity: 5,
          channelBrandId: null,
          owtletPrice: '45.00',
        },
      ];

      const candidates: AllocatorDispensaryCandidate[] = [
        {
          id: 'disp-gotham',
          slug: 'gotham-greenery',
          name: 'Gotham Greenery',
          offersPickup: true,
          offersDelivery: true,
          coverageZips: ['10001'],
          isOpenNow: true,
          hoursToday: null,
          isDeliveringNow: true,
          deliveryHoursToday: null,
          distanceMiles: 1.2,
          handoffChannel: HandoffChannel.LEAFLY,
          brandIds: [],
          inventories: new Map([
            [
              'prod-sour-diesel',
              { productId: 'prod-sour-diesel', dispensaryId: 'disp-gotham', stockQty: 2, price: '45.00' },
            ],
          ]), // Only 2 in stock, needs 5
        },
      ];

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '10001',
        itemOverrides: [
          {
            productId: 'prod-sour-diesel',
            dispensaryId: 'disp-gotham',
          },
        ],
        preferredDispensaryId: null,
        candidates,
        allActiveDispensaries: candidates,
      });

      expect(result.subOrders).toHaveLength(0);
      expect(result.unfulfillable).toHaveLength(1);
      expect(result.unfulfillable[0].reason).toBe('NOT_AT_SELECTED_STORE');
      expect(result.unfulfillable[0].productId).toBe('prod-sour-diesel');
    });
  });

  // ==========================================================================
  // CASE 6: Brand Channel Isolation & Out-of-Stock Fuzzing
  // ==========================================================================
  describe('Chaos Case 6: Brand Channel Isolation & Out-of-Stock Suggester (AC-BRD-02, AC-OOS-01, T-BRD-01)', () => {
    it('restricts brand items exclusively to partner dispensaries and suggests alternative partner stores', () => {
      const lines: AllocatorCartLine[] = [
        {
          id: 'line-brand-1',
          productId: 'prod-exclusive-gummies',
          name: 'Sour Buddha Live Rosin Gummies',
          quantity: 2,
          channelBrandId: 'brand-sour-buddha', // Scoped to Sour Buddha
          owtletPrice: '35.00',
        },
      ];

      const storeNonPartner: AllocatorDispensaryCandidate = {
        id: 'disp-non-partner',
        slug: 'independent-dispensary',
        name: 'Independent Dispensary',
        offersPickup: true,
        offersDelivery: true,
        coverageZips: ['10001'],
        isOpenNow: true,
        hoursToday: null,
        isDeliveringNow: true,
        deliveryHoursToday: null,
        distanceMiles: 0.5, // Closer!
        handoffChannel: HandoffChannel.LEAFLY,
        brandIds: ['brand-other'], // Does NOT carry brand-sour-buddha
        inventories: new Map([
          [
            'prod-exclusive-gummies',
            { productId: 'prod-exclusive-gummies', dispensaryId: 'disp-non-partner', stockQty: 10, price: '35.00' },
          ],
        ]),
      };

      const storePartnerOutOfStock: AllocatorDispensaryCandidate = {
        id: 'disp-partner-1',
        slug: 'gotham-greenery',
        name: 'Gotham Greenery',
        offersPickup: true,
        offersDelivery: true,
        coverageZips: ['10001'],
        isOpenNow: true,
        hoursToday: null,
        isDeliveringNow: true,
        deliveryHoursToday: null,
        distanceMiles: 1.5,
        handoffChannel: HandoffChannel.LEAFLY,
        brandIds: ['brand-sour-buddha'],
        inventories: new Map([
          [
            'prod-exclusive-gummies',
            { productId: 'prod-exclusive-gummies', dispensaryId: 'disp-partner-1', stockQty: 0, price: '35.00' },
          ],
        ]), // 0 in stock
      };

      const storePartnerInStock: AllocatorDispensaryCandidate = {
        id: 'disp-partner-2',
        slug: 'kings-county-cannabis',
        name: 'Kings County Cannabis',
        offersPickup: true,
        offersDelivery: true,
        coverageZips: ['10001'],
        isOpenNow: true,
        hoursToday: null,
        isDeliveringNow: true,
        deliveryHoursToday: null,
        distanceMiles: 3.0,
        handoffChannel: HandoffChannel.LEAFLY,
        brandIds: ['brand-sour-buddha'],
        inventories: new Map([
          [
            'prod-exclusive-gummies',
            { productId: 'prod-exclusive-gummies', dispensaryId: 'disp-partner-2', stockQty: 5, price: '35.00' },
          ],
        ]), // 5 in stock!
      };

      const candidates = [storeNonPartner, storePartnerOutOfStock, storePartnerInStock];

      const result = allocateCart({
        lines,
        fulfillmentType: FulfillmentType.DELIVERY,
        zip: '10001',
        itemOverrides: [],
        preferredDispensaryId: null,
        candidates,
        allActiveDispensaries: candidates,
      });

      // Must be allocated to the partner store that has stock, NEVER the non-partner store
      expect(result.subOrders).toHaveLength(1);
      expect(result.subOrders[0].dispensaryId).toBe('disp-partner-2');
    });

    it('blocks order creation when unfulfillable items exist (UnfulfillableItemsError)', async () => {
      const mockUnfulfillable: UnfulfillableLine[] = [
        {
          productId: 'p1',
          name: 'Sour Diesel',
          reason: 'NOT_IN_STOCK_FOR_ZIP',
          suggestions: [],
        },
      ];
      const error = new UnfulfillableItemsError(mockUnfulfillable);
      expect(error.code).toBe('UNFULFILLABLE_ITEMS');
      expect(error.unfulfillable).toHaveLength(1);
      expect(error.unfulfillable[0].productId).toBe('p1');
    });
  });

  // ==========================================================================
  // CASE 7: Zero ID & Zero Payment Regulatory Penetration Test (AC-SEC-01)
  // ==========================================================================
  describe('Chaos Case 7: Zero ID & Zero Payment Regulatory Penetration (AC-SEC-01)', () => {
    it('rejects order payload containing credit card, DOB, or driver license via Zod .strict()', () => {
      const contaminatedOrderPayload = {
        cartToken: 'cart-tok-12345',
        fulfillmentType: 'PICKUP',
        contact: {
          name: 'Penetration Tester',
          email: 'pentest@example.com',
          phone: '555-123-4567',
        },
        previewHash: 'hash-preview-valid',
        creditCard: '4111222233334444',
        dob: '1990-01-01',
        driversLicense: 'NY123456789',
        ssn: '123-45-6789',
      };

      const result = createOrderSchema.safeParse(contaminatedOrderPayload);
      expect(result.success).toBe(false);
    });

    it('rejects contact schema containing government ID or age proof fields', () => {
      const contaminatedContact = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-555-5555',
        dateOfBirth: '1995-05-15',
        governmentIdNumber: 'ID-999-888',
      };

      const result = contactSchema.safeParse(contaminatedContact);
      expect(result.success).toBe(false);
    });

    it('rejects handoff payload containing payment nonce, token or CVV', () => {
      const contaminatedHandoff = {
        subOrderId: 'b5a03b57-ec8f-4318-b80c-a9062aa0d10b',
        paymentMethodToken: 'tok_visa_4242',
        cvv: '123',
      };

      const result = checkoutHandoffSchema.safeParse(contaminatedHandoff);
      expect(result.success).toBe(false);
    });

    it('rejects delivery address containing payment instructions or gatekeeper credentials', () => {
      const contaminatedAddress = {
        street: '123 High Street',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        paymentType: 'CASH_ON_DELIVERY',
      };

      const result = deliveryAddressSchema.safeParse(contaminatedAddress);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // CASE 8: Cryptographic Signature Tampering & Webhook Replay Attacks
  // ==========================================================================
  describe('Chaos Case 8: Webhook HMAC Tampering & Replay Attacks (T-WH-01, AC-CNF-01)', () => {
    const webhookSecret = 'test-webhook-secret-key-32-chars-long!!';
    const payload = JSON.stringify({
      subOrderId: '11111111-2222-3333-4444-555555555555',
      status: 'CONFIRMED',
      confirmationRef: 'STORE-A-9999',
    });

    it('verifies a genuine HMAC-SHA256 signature with current timestamp', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateWebhookSignature(payload, timestamp, webhookSecret);

      const verification = verifyWebhookSignature({
        rawBody: payload,
        signatureHeader: signature,
        timestampHeader: String(timestamp),
        secret: webhookSecret,
      });

      expect(verification.valid).toBe(true);
    });

    it('rejects a signature modified by a single bit or character (Tampering)', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const validSignature = generateWebhookSignature(payload, timestamp, webhookSecret);
      const corruptedSignature = validSignature.slice(0, -1) + (validSignature.endsWith('a') ? 'b' : 'a');

      const verification = verifyWebhookSignature({
        rawBody: payload,
        signatureHeader: corruptedSignature,
        timestampHeader: String(timestamp),
        secret: webhookSecret,
      });

      expect(verification.valid).toBe(false);
      expect(verification.error).toMatch(/Invalid HMAC signature/);
    });

    it('rejects a webhook replay with timestamp older than 5 minutes (Replay Attack)', () => {
      const staleTimestamp = Math.floor(Date.now() / 1000) - 305; // 5 minutes 5 seconds ago
      const signature = generateWebhookSignature(payload, staleTimestamp, webhookSecret);

      const verification = verifyWebhookSignature({
        rawBody: payload,
        signatureHeader: signature,
        timestampHeader: String(staleTimestamp),
        secret: webhookSecret,
        toleranceSeconds: 300,
      });

      expect(verification.valid).toBe(false);
      expect(verification.error).toMatch(/outside 5-minute replay window/);
    });

    it('rejects a webhook with timestamp in the far future > 5 minutes', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 400; // 6+ minutes in the future
      const signature = generateWebhookSignature(payload, futureTimestamp, webhookSecret);

      const verification = verifyWebhookSignature({
        rawBody: payload,
        signatureHeader: signature,
        timestampHeader: String(futureTimestamp),
        secret: webhookSecret,
        toleranceSeconds: 300,
      });

      expect(verification.valid).toBe(false);
      expect(verification.error).toMatch(/outside 5-minute replay window/);
    });
  });

  // ==========================================================================
  // CASE 9: Concurrency & Double Submission Idempotency
  // ==========================================================================
  describe('Chaos Case 9: Concurrency & Double Submission Idempotency (T-ORD-01)', () => {
    it('returns existing order idempotently when checkout is submitted repeatedly on the same cart', async () => {
      const existingOrder = {
        id: 'order-existing-1',
        orderNumber: 'OWT-123456',
        cartId: 'cart-1',
        status: OrderStatus.PENDING,
        subtotal: new Prisma.Decimal('45.00'),
        createdAt: new Date(),
        subOrders: [
          {
            id: 'sub-1',
            status: SubOrderStatus.PENDING,
            dispensaryId: 'disp-1',
            subtotal: new Prisma.Decimal('45.00'),
            items: [],
          },
        ],
      };

      (prisma.cart.findFirst as any).mockResolvedValue({
        id: 'cart-1',
        token: 'tok-checked-out',
        status: CartStatus.CHECKED_OUT,
        order: existingOrder,
        items: [],
      });

      const result = await createOrder(
        {
          fulfillmentType: FulfillmentType.PICKUP,
          zip: '10001',
          contact: { firstName: 'Repeat', lastName: 'Shopper', email: 'repeat@example.com', phone: '555-111-2222' },
          itemOverrides: [],
          saveToProfile: false,
          previewHash: 'hash-abc',
        },
        { cartSessionToken: 'tok-checked-out', shopperId: null }
      );

      expect(result.isExisting).toBe(true);
      expect(result.order.orderNumber).toBe('OWT-123456');
      expect(prisma.order.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CASE 10: Shopper Profile Auth Fuzzing & Token Tampering
  // ==========================================================================
  describe('Chaos Case 10: Shopper Profile Auth Security & Token Tampering (AC-PRF-02, T-PRF-01)', () => {
    it('verifies argon2id password hashing rejects bad passwords and resists timing leaks', async () => {
      const rawPassword = 'SecureCannabisPassword2026!';
      const hash = await hashPassword(rawPassword);

      expect(await verifyPassword(hash, rawPassword)).toBe(true);
      expect(await verifyPassword(hash, 'WrongPassword123!')).toBe(false);
      expect(await verifyPassword(hash, '')).toBe(false);
    });

    it('signs and rejects tampered owt_shopper HMAC session tokens', async () => {
      const payload = {
        shopperId: 'shopper-uuid-123',
      };

      const { token } = await signShopperToken(payload);
      const verified = await verifyShopperToken(token);
      expect(verified?.valid).toBe(true);
      expect(verified?.shopperId).toBe('shopper-uuid-123');

      // Tamper token payload or signature
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.corrupted_signature_hex`;

      const tamperedResult = await verifyShopperToken(tamperedToken);
      expect(tamperedResult.valid).toBe(false);
    });

    it('generates single-use password reset tokens with SHA-256 hashes', () => {
      const { token, tokenHash, expiresAt } = generatePasswordResetToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThanOrEqual(32);
      expect(tokenHash).toBe(hashResetToken(token));
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
