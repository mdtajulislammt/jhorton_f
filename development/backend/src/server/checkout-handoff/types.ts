import { z } from 'zod';
import { HandoffChannel } from '@prisma/client';

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

