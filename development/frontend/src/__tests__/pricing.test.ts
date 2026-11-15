import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  determinePriceMode,
  resolveUnitPrice,
  computeCatalogPricing,
} from '../server/pricing';
import { Decimal } from '@prisma/client/runtime/library';

describe('Pricing Engine (REQ-F-015, ADR-011)', () => {
  describe('formatMoney', () => {
    it('formats numbers to 2 decimal places', () => {
      expect(formatMoney(45)).toBe('45.00');
      expect(formatMoney(45.5)).toBe('45.50');
      expect(formatMoney(45.556)).toBe('45.56');
    });

    it('formats Decimal objects', () => {
      expect(formatMoney(new Decimal(50))).toBe('50.00');
      expect(formatMoney(new Decimal('62.50'))).toBe('62.50');
    });

    it('handles null, undefined, and NaN gracefully', () => {
      expect(formatMoney(null)).toBe('0.00');
      expect(formatMoney(undefined)).toBe('0.00');
      expect(formatMoney('invalid')).toBe('0.00');
    });
  });

  describe('determinePriceMode', () => {
    it('returns OWTLET when owtletPrice is set', () => {
      expect(determinePriceMode({ owtletPrice: new Decimal(45) })).toBe('OWTLET');
      expect(determinePriceMode({ owtletPrice: 50 })).toBe('OWTLET');
      expect(determinePriceMode({ owtletPrice: '35.00' })).toBe('OWTLET');
    });

    it('returns PER_STORE when owtletPrice is null or undefined', () => {
      expect(determinePriceMode({ owtletPrice: null })).toBe('PER_STORE');
      expect(determinePriceMode({})).toBe('PER_STORE');
    });
  });

  describe('resolveUnitPrice', () => {
    it('prioritizes owtletPrice for show products over inventory price', () => {
      const product = { owtletPrice: new Decimal('40.00') };
      const inventory = { price: new Decimal('55.00') };
      expect(resolveUnitPrice(product, inventory)).toBe('40.00');
    });

    it('uses inventory price when owtletPrice is null', () => {
      const product = { owtletPrice: null };
      const inventory = { price: new Decimal('48.00') };
      expect(resolveUnitPrice(product, inventory)).toBe('48.00');
    });

    it('returns 0.00 when neither price is available', () => {
      expect(resolveUnitPrice({ owtletPrice: null }, null)).toBe('0.00');
      expect(resolveUnitPrice({ owtletPrice: null }, { price: null })).toBe('0.00');
    });
  });

  describe('computeCatalogPricing', () => {
    it('returns OWTLET price mode and identical owtletPrice & fromPrice for show products', () => {
      const product = { owtletPrice: new Decimal('50.00') };
      const inventories = [
        { price: new Decimal('55.00'), stockQty: 10 },
        { price: new Decimal('60.00'), stockQty: 5 },
      ];
      const result = computeCatalogPricing(product, inventories);
      expect(result.priceMode).toBe('OWTLET');
      expect(result.owtletPrice).toBe('50.00');
      expect(result.fromPrice).toBe('50.00');
    });

    it('returns lowest in-stock store price for PER_STORE products', () => {
      const product = { owtletPrice: null };
      const inventories = [
        { price: new Decimal('65.00'), stockQty: 0 }, // out of stock, cheaper
        { price: new Decimal('70.00'), stockQty: 5 },  // in stock
        { price: new Decimal('75.00'), stockQty: 8 },  // in stock
      ];
      const result = computeCatalogPricing(product, inventories);
      expect(result.priceMode).toBe('PER_STORE');
      expect(result.owtletPrice).toBeNull();
      expect(result.fromPrice).toBe('70.00');
    });

    it('falls back to out-of-stock price if no stores have active stock', () => {
      const product = { owtletPrice: null };
      const inventories = [
        { price: new Decimal('52.00'), stockQty: 0 },
        { price: new Decimal('58.00'), stockQty: 0 },
      ];
      const result = computeCatalogPricing(product, inventories);
      expect(result.priceMode).toBe('PER_STORE');
      expect(result.owtletPrice).toBeNull();
      expect(result.fromPrice).toBe('52.00');
    });

    it('returns null fromPrice if no inventories exist', () => {
      const product = { owtletPrice: null };
      const result = computeCatalogPricing(product, []);
      expect(result.priceMode).toBe('PER_STORE');
      expect(result.owtletPrice).toBeNull();
      expect(result.fromPrice).toBeNull();
    });
  });
});

