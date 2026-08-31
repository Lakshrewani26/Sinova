"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";

export async function createOrderFromQuotationAction(quotationId: string) {
  const user = await requireBuyer();

  if (!quotationId || typeof quotationId !== "string") {
    throw new Error("Quotation ID is required.");
  }

  // Find quotation with RFQ and existing Order
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      rfq: true,
      order: true,
    },
  });

  if (!quotation || quotation.rfq.userId !== user.id) {
    throw new Error("Quotation not found or unauthorized.");
  }

  if (quotation.status !== "ACCEPTED") {
    throw new Error("Orders can only be created from ACCEPTED quotations.");
  }

  // Prevent duplicate orders
  if (quotation.order) {
    redirect(`/orders/${quotation.order.id}`);
  }

  const existingOrder = await prisma.order.findFirst({
    where: { quotationId: quotation.id },
  });

  if (existingOrder) {
    redirect(`/orders/${existingOrder.id}`);
  }

  // Generate unique collision-safe order number SIN-ORD-2026-XXXX
  const totalOrdersCount = await prisma.order.count();
  const sequenceNum = (totalOrdersCount + 1).toString().padStart(4, "0");
  const yearStr = new Date().getFullYear().toString();
  let orderNumber = `SIN-ORD-${yearStr}-${sequenceNum}`;

  // Collision safety check
  const collision = await prisma.order.findUnique({ where: { orderNumber } });
  if (collision) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    orderNumber = `SIN-ORD-${yearStr}-${randomSuffix}`;
  }

  const productCost = quotation.quotedUnitPrice * quotation.quantity;
  const totalAmount = productCost + (quotation.shippingCost || 0);

  // Create internal procurement order record
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      rfqId: quotation.rfqId,
      quotationId: quotation.id,
      manufacturerId: quotation.manufacturerId,
      productId: quotation.productId,
      quantity: quotation.quantity,
      unitPrice: quotation.quotedUnitPrice,
      shippingCost: quotation.shippingCost || 0,
      totalAmount,
      status: "ORDER_CREATED",
      supplierNotes: quotation.supplierNotes,
    },
  });

  // Log initial ORDER_CREATED status history entry
  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      userId: user.id,
      status: "ORDER_CREATED",
      note: "Procurement order created from accepted supplier quotation.",
    },
  });

  revalidatePath("/rfqs");
  revalidatePath(`/rfqs/${quotation.rfqId}`);
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/dashboard");

  redirect(`/orders/${order.id}`);
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: string,
  note?: string
) {
  const user = await requireBuyer();

  if (!orderId || !newStatus) {
    throw new Error("Order ID and new status are required.");
  }

  const validStatuses = [
    "ORDER_CREATED",
    "SUPPLIER_CONFIRMED",
    "IN_PRODUCTION",
    "READY_TO_SHIP",
    "COMPLETED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(newStatus)) {
    throw new Error("Invalid order status value.");
  }

  // Security check: Verify order ownership
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
  });

  if (!order) {
    throw new Error("Order not found or unauthorized.");
  }

  // Enforce legal transition logic
  const currentStatus = order.status;

  if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
    throw new Error(`Orders in status '${currentStatus}' cannot be modified.`);
  }

  if (newStatus === "CANCELLED") {
    // Cancellation is allowed prior to COMPLETED
  } else if (currentStatus === "ORDER_CREATED" && newStatus !== "SUPPLIER_CONFIRMED") {
    throw new Error("Order Created can only transition to Supplier Confirmed or Cancelled.");
  } else if (currentStatus === "SUPPLIER_CONFIRMED" && newStatus !== "IN_PRODUCTION") {
    throw new Error("Supplier Confirmed can only transition to In Production or Cancelled.");
  } else if (currentStatus === "IN_PRODUCTION" && newStatus !== "READY_TO_SHIP") {
    throw new Error("In Production can only transition to Ready to Ship or Cancelled.");
  } else if (currentStatus === "READY_TO_SHIP" && newStatus !== "COMPLETED") {
    throw new Error("Ready to Ship can only transition to Completed or Cancelled.");
  }

  const trimmedNote = note && note.trim() !== "" ? note.trim() : null;

  // Update order status in database
  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  // Create immutable timeline status history entry
  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      userId: user.id,
      status: newStatus,
      note: trimmedNote,
    },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/rfqs");

  return { success: true };
}
