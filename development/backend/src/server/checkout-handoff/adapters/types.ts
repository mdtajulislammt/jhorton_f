export interface AdapterVendorInput {
  id: string;
  name: string;
  slug: string;
  websiteUrl?: string | null;
  cartBaseUrl?: string | null;
  webhookSecret: string;
  allowedHosts: string[];
  handoffNotes?: string | null;
}

export interface AdapterLineInput {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price?: string | null;
  vendorProductId?: string | null;
  vendorVariantId?: string | null;
  vendorSku?: string | null;
}

export interface AdapterContext {
  orderId?: string;
  orderNumber: string;
  subOrderId: string;
  storefront?: boolean;
}

export interface AdapterResult {
  url: string;
  warnings?: string[];
  notes?: string;
  requiresManualHandoff?: boolean;
}

