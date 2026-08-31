"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBuyer, requireSupplier } from "@/lib/session";

export async function createRfqAction(formData: FormData) {
  const user = await requireBuyer();

  const manufacturerId = (formData.get("manufacturerId") as string)?.trim();
  const productId = (formData.get("productId") as string)?.trim();
  const sourcingRequestId = (formData.get("sourcingRequestId") as string)?.trim() || null;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const targetUnitPrice = parseFloat(formData.get("targetUnitPrice") as string);
  const message = (formData.get("message") as string)?.trim() || "";

  if (!manufacturerId || !productId || isNaN(quantity) || quantity <= 0 || isNaN(targetUnitPrice) || targetUnitPrice <= 0) {
    throw new Error("Please complete all required fields with valid positive numbers.");
  }

  // Verify Manufacturer and Product exist
  const [manufacturer, product] = await Promise.all([
    prisma.manufacturer.findUnique({ where: { id: manufacturerId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ]);

  if (!manufacturer || !product) {
    throw new Error("Specified manufacturer or product was not found in the catalog.");
  }

  // If sourcingRequestId provided, verify it belongs to current buyer
  if (sourcingRequestId) {
    const sourcingReq = await prisma.sourcingRequest.findFirst({
      where: { id: sourcingRequestId, userId: user.id },
    });
    if (!sourcingReq) {
      throw new Error("Invalid or unauthorized sourcing request link.");
    }
  }

  // Create RFQ in database
  const rfq = await prisma.rfq.create({
    data: {
      userId: user.id,
      manufacturerId,
      productId,
      sourcingRequestId,
      quantity,
      targetUnitPrice,
      message,
      status: "SENT",
    },
  });

  revalidatePath("/rfqs");
  revalidatePath("/dashboard");
  if (sourcingRequestId) {
    revalidatePath(`/requirements/${sourcingRequestId}`);
  }

  redirect(`/rfqs/${rfq.id}`);
}

export async function submitSupplierQuotationAction(formData: FormData) {
  const supplier = await requireSupplier();

  const rfqId = (formData.get("rfqId") as string)?.trim();
  const quotedUnitPrice = parseFloat(formData.get("quotedUnitPrice") as string);
  const quantity = parseInt(formData.get("quantity") as string, 10);

  const moqRaw = formData.get("moq") as string;
  const moq = moqRaw && moqRaw.trim() !== "" ? parseInt(moqRaw, 10) : null;

  const leadTimeRaw = formData.get("leadTimeDays") as string;
  const leadTimeDays = leadTimeRaw && leadTimeRaw.trim() !== "" ? parseInt(leadTimeRaw, 10) : null;

  const shippingRaw = formData.get("shippingCost") as string;
  const shippingCost = shippingRaw && shippingRaw.trim() !== "" ? parseFloat(shippingRaw) : 0;

  const validUntilRaw = formData.get("validUntil") as string;
  const validUntil = validUntilRaw && validUntilRaw.trim() !== "" ? new Date(validUntilRaw) : null;

  const supplierNotes = (formData.get("supplierNotes") as string)?.trim() || null;

  if (!rfqId || isNaN(quotedUnitPrice) || quotedUnitPrice <= 0 || isNaN(quantity) || quantity <= 0) {
    throw new Error("Please complete required fields (Quoted Unit Price and Quantity) with positive numbers.");
  }

  if (moq !== null && (isNaN(moq) || moq < 0)) {
    throw new Error("MOQ must be a non-negative number.");
  }

  if (leadTimeDays !== null && (isNaN(leadTimeDays) || leadTimeDays < 0)) {
    throw new Error("Lead time must be a non-negative number.");
  }

  if (isNaN(shippingCost) || shippingCost < 0) {
    throw new Error("Shipping cost must be a non-negative number.");
  }

  // Strict role & security check: Verify RFQ is assigned to supplier's manufacturer
  const rfq = await prisma.rfq.findUnique({
    where: { id: rfqId },
  });

  if (!rfq) {
    throw new Error("RFQ not found.");
  }

  if (!supplier.manufacturerId || rfq.manufacturerId !== supplier.manufacturerId) {
    throw new Error("Unauthorized: RFQ is assigned to a different manufacturer.");
  }

  // Create Quotation record associated with supplier's manufacturer
  await prisma.quotation.create({
    data: {
      rfqId,
      manufacturerId: supplier.manufacturerId,
      productId: rfq.productId,
      quotedUnitPrice,
      quantity,
      moq,
      leadTimeDays,
      shippingCost,
      validUntil,
      supplierNotes,
      status: "RECEIVED",
    },
  });

  // Update RFQ status to QUOTATION_RECEIVED
  if (rfq.status === "SENT" || rfq.status === "DRAFT") {
    await prisma.rfq.update({
      where: { id: rfqId },
      data: { status: "QUOTATION_RECEIVED" },
    });
  }

  revalidatePath("/rfqs");
  revalidatePath(`/rfqs/${rfqId}`);
  revalidatePath("/supplier/rfqs");
  revalidatePath(`/supplier/rfqs/${rfqId}`);
  revalidatePath("/dashboard");

  redirect(`/supplier/rfqs/${rfqId}`);
}

export async function acceptQuotationAction(quotationId: string) {
  const buyer = await requireBuyer();

  if (!quotationId) {
    throw new Error("Quotation ID is required.");
  }

  // Security & ownership verification: Verify buyer owns the target RFQ
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { rfq: true },
  });

  if (!quotation || quotation.rfq.userId !== buyer.id) {
    throw new Error("Quotation not found or unauthorized.");
  }

  // Update quotation status to ACCEPTED
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "ACCEPTED" },
  });

  // Update RFQ status to ACCEPTED
  await prisma.rfq.update({
    where: { id: quotation.rfqId },
    data: { status: "ACCEPTED" },
  });

  revalidatePath("/rfqs");
  revalidatePath(`/rfqs/${quotation.rfqId}`);
  revalidatePath("/supplier/rfqs");
  revalidatePath(`/supplier/rfqs/${quotation.rfqId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function rejectQuotationAction(quotationId: string) {
  const buyer = await requireBuyer();

  if (!quotationId) {
    throw new Error("Quotation ID is required.");
  }

  // Security & ownership verification: Verify buyer owns the target RFQ
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { rfq: true },
  });

  if (!quotation || quotation.rfq.userId !== buyer.id) {
    throw new Error("Quotation not found or unauthorized.");
  }

  // Update quotation status to REJECTED
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/rfqs");
  revalidatePath(`/rfqs/${quotation.rfqId}`);
  revalidatePath("/supplier/rfqs");
  revalidatePath(`/supplier/rfqs/${quotation.rfqId}`);
  revalidatePath("/dashboard");

  return { success: true };
}
