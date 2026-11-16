import { prisma } from '../db';
import { SubOrderStatus } from '@prisma/client';
import { rollupOrderStatus } from '../orders/status';

export class AdminOrderError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AdminOrderError';
  }
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return 'N/A';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***-****';
  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
}

export async function listAdminOrders(params?: {
  status?: string;
  search?: string;
}) {
  const where: any = {};
  if (params?.status) {
    where.status = params.status;
  }
  if (params?.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: 'insensitive' } },
      { contactEmail: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      subOrders: {
        include: {
          dispensary: { select: { id: true, name: true, slug: true, zip: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((o) => {
    const totalItems = o.subOrders.reduce(
      (sum, so) => sum + so.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      fulfillmentType: o.fulfillmentType,
      contactName: `${o.contactFirstName} ${o.contactLastName}`.trim(),
      contactEmailMasked: maskEmail(o.contactEmail),
      contactPhoneMasked: maskPhone(o.contactPhone),
      subtotal: Number(o.subtotal),
      itemCount: totalItems,
      subOrderCount: o.subOrders.length,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      subOrders: o.subOrders.map((so) => ({
        id: so.id,
        dispensaryId: so.dispensaryId,
        dispensaryName: so.dispensary.name,
        dispensaryZip: so.dispensary.zip,
        status: so.status,
        subtotal: Number(so.subtotal),
        assignmentSource: so.assignment,
        handoffChannel: so.handoffChannel,
        handoffUrl: so.handoffUrl,
        confirmedAt: so.confirmedAt ? so.confirmedAt.toISOString() : null,
        confirmationRef: so.confirmationRef,
        itemsCount: so.items.reduce((sum, item) => sum + item.quantity, 0),
        items: so.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.product.name,
          productSku: it.product.sku,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
          lineTotal: it.quantity * Number(it.unitPrice),
        })),
      })),
    };
  });
}

export async function updateSubOrderStatus(
  subOrderId: string,
  newStatus: SubOrderStatus,
  note?: string
) {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: { order: { include: { subOrders: true } } },
  });

  if (!subOrder) {
    throw new AdminOrderError('NOT_FOUND', 'Sub-order not found', 404);
  }

  // Update sub-order inside transaction and roll up parent order status
  return await prisma.$transaction(async (tx) => {
    const updatedSubOrder = await tx.subOrder.update({
      where: { id: subOrderId },
      data: {
        status: newStatus,
        confirmedAt: newStatus === 'CONFIRMED' ? new Date() : undefined,
      },
    });

    // Fetch sibling sub-orders
    const allSubOrders = await tx.subOrder.findMany({
      where: { orderId: subOrder.orderId },
    });

    const newStatuses = allSubOrders.map((s) =>
      s.id === subOrderId ? newStatus : s.status
    );

    const newParentStatus = rollupOrderStatus(newStatuses);

    const updatedParentOrder = await tx.order.update({
      where: { id: subOrder.orderId },
      data: { status: newParentStatus },
    });

    return {
      subOrder: updatedSubOrder,
      parentOrder: updatedParentOrder,
    };
  });
}
