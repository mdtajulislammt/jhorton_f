import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Prisma Schema & Domain Compliance Verification', () => {
  const schemaPath = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  it('contains all 22 domain models', () => {
    const requiredModels = [
      'User',
      'Brand',
      'BrandDispensary',
      'Category',
      'Strain',
      'Product',
      'Dispensary',
      'DispensaryHours',
      'Inventory',
      'Shopper',
      'ShopperAddress',
      'PasswordResetToken',
      'Cart',
      'CartItem',
      'Order',
      'SubOrder',
      'OrderItem',
      'LiveShow',
      'ShowProduct',
      'AgeVerificationSession',
      'CoverageZip',
      'VendorProductMapping',
    ];

    for (const model of requiredModels) {
      expect(schemaContent).toContain(`model ${model} {`);
    }
  });

  it('contains all 12 domain enums', () => {
    const requiredEnums = [
      'Role',
      'StrainType',
      'CartStatus',
      'OrderStatus',
      'SubOrderStatus',
      'HandoffChannel',
      'ShowStatus',
      'VideoFormat',
      'FulfillmentType',
      'HoursKind',
      'AssignmentSource',
      'VendorPlatform',
    ];

    for (const en of requiredEnums) {
      expect(schemaContent).toContain(`enum ${en} {`);
    }
  });

  it('strictly enforces Zero ID / DOB / Payment fields in compliance with NY cannabis regulations', () => {
    // Prohibited cannabis payment / identity fields
    const prohibitedKeywords = [
      'creditCard',
      'credit_card',
      'cardNumber',
      'card_number',
      'cvv',
      'stripeId',
      'stripe_id',
      'dateOfBirth',
      'date_of_birth',
      'dob',
      'driversLicense',
      'drivers_license',
      'passportNumber',
      'passport_number',
      'ssn',
    ];

    const lines = schemaContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

      for (const keyword of prohibitedKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        expect(regex.test(trimmed)).toBe(false);
      }
    }
  });

  it('verifies coverage ZIP data contains all 5 designated NY regions', () => {
    const zipsPath = path.join(__dirname, '..', '..', 'prisma', 'data', 'coverage-zips.json');
    expect(fs.existsSync(zipsPath)).toBe(true);

    const data: Array<{ zip: string; region: string; latitude: number; longitude: number }> = JSON.parse(
      fs.readFileSync(zipsPath, 'utf8')
    );

    expect(data.length).toBeGreaterThanOrEqual(30);

    const regions = new Set(data.map((item) => item.region));
    expect(regions.has('MANHATTAN')).toBe(true);
    expect(regions.has('BROOKLYN')).toBe(true);
    expect(regions.has('QUEENS')).toBe(true);
    expect(regions.has('BRONX')).toBe(true);
    expect(regions.has('STATEN_ISLAND')).toBe(true);
    expect(regions.has('WESTCHESTER')).toBe(true);
    expect(regions.has('LONG_ISLAND')).toBe(true);

    // Verify valid coordinates for each zip
    for (const item of data) {
      expect(item.zip).toMatch(/^\d{5}$/);
      expect(item.latitude).toBeGreaterThan(40.0);
      expect(item.latitude).toBeLessThan(42.0);
      expect(item.longitude).toBeGreaterThan(-75.0);
      expect(item.longitude).toBeLessThan(-72.0);
    }
  });
});

