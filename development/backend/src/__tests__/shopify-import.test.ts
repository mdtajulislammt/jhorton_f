import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Shopify Test-Data Catalog Audit (f1jc7p-fs → PostgreSQL)', () => {
  const seedScriptPath = path.join(__dirname, '..', '..', 'prisma', 'seed-shopify-import.ts');
  const content = fs.readFileSync(seedScriptPath, 'utf8');

  it('contains the seed script file', () => {
    expect(fs.existsSync(seedScriptPath)).toBe(true);
  });

  it('contains all 22 test cannabis product records with shopifyLegacyId', () => {
    for (let i = 1; i <= 22; i++) {
      const paddedId = String(i).padStart(2, '0');
      const legacyId = `gid://shopify/Product/8920192000${paddedId}`;
      expect(content).toContain(legacyId);
    }
  });

  it('covers all 5 NY cannabis categories with zero accessory references', () => {
    const validCategories = ['flower', 'pre-rolls', 'vapes', 'edibles', 'concentrates'];
    for (const cat of validCategories) {
      expect(content).toContain(`categorySlug: '${cat}'`);
    }

    // Zero accessory items allowed on cannabis-only platform
    expect(content.toLowerCase()).not.toContain('categoryslug: \'accessories\'');
    expect(content.toLowerCase()).not.toContain('categoryslug: \'apparel\'');
    expect(content.toLowerCase()).not.toContain('categoryslug: \'merch\'');
  });

  it('maps inventory to the 3 NY licensed partner dispensaries', () => {
    expect(content).toContain("dispensarySlug: 'gotham-greenery'");
    expect(content).toContain("dispensarySlug: 'kings-county'");
    expect(content).toContain("dispensarySlug: 'empire-express'");
  });

  it('includes one-price Owtlet show pricing for featured live products', () => {
    // Show products should specify owtletPrice
    expect(content).toContain('owtletPrice: 50');
    expect(content).toContain('owtletPrice: 18');
    expect(content).toContain('owtletPrice: 55');
    expect(content).toContain('owtletPrice: 28');
    expect(content).toContain('owtletPrice: 70');
  });
});
