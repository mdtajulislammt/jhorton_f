import { z } from 'zod';
import { HandoffChannel } from '@prisma/client';

export interface HandoffPayload {
  subOrder: {
    id: string;
    orderId: string;
    orderNumber: string;
    dispensaryId: string;
    subtotal: string | number;
    fulfillmentType: string;
  };
  dispensary: {
    id: string;
    name: string;
    slug: string;
    handoffChannel: HandoffChannel;
    handoffUrlTemplate: string | null;
    leaflyStoreId: string | null;
  };
  order?: {
    id: string;
    orderNumber: string;
    zip: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
}

export interface HandoffProvider {
  readonly channel: HandoffChannel;
  buildUrl(payload: HandoffPayload): Promise<string> | string;
}

export interface HandoffResultItem {
  subOrderId: string;
  channel: HandoffChannel;
  url: string;
  dispensaryName: string;
}

export interface CheckoutHandoffResult {
  handoffs: HandoffResultItem[];
}

export interface ExecuteHandoffOptions {
  orderId: string;
  subOrderId?: string;
  session?: {
    cartSessionToken?: string | null;
    shopperId?: string | null;
    isAdmin?: boolean;
  };
}

/**
 * Strict validation schema for checkout handoff payload.
 * Enforces AC-SEC-01 / ADR-005: any extra properties (such as payment, credit card,
 * DOB, or ID numbers) trigger an immediate validation error.
 */
export const checkoutHandoffSchema = z
  .object({
    orderId: z.string().uuid({ message: 'orderId must be a valid UUID' }),
    subOrderId: z.string().uuid({ message: 'subOrderId must be a valid UUID' }).optional(),
  })
  .strict({
    message: 'Unexpected fields provided. Payment and government ID fields are strictly forbidden.',
  });

export type CheckoutHandoffInput = z.infer<typeof checkoutHandoffSchema>;

export class HandoffError extends Error {
  constructor(message: string, public code: string = 'HANDOFF_ERROR') {
    super(message);
    this.name = 'HandoffError';
  }
}

export class ProviderConfigurationError extends HandoffError {
  constructor(message: string) {
    super(message, 'PROVIDER_CONFIGURATION_ERROR');
    this.name = 'ProviderConfigurationError';
  }
}

export class OrderNotFoundError extends HandoffError {
  constructor(message: string = 'Order not found') {
    super(message, 'NOT_FOUND');
    this.name = 'OrderNotFoundError';
  }
}

export class ForbiddenOrderAccessError extends HandoffError {
  constructor(message: string = 'Access to order denied') {
    super(message, 'FORBIDDEN');
    this.name = 'ForbiddenOrderAccessError';
  }
}

export class SubOrderNotFoundError extends HandoffError {
  constructor(message: string = 'Sub-order not found in this order') {
    super(message, 'SUB_ORDER_NOT_FOUND');
    this.name = 'SubOrderNotFoundError';
  }
}

