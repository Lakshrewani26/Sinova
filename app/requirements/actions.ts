"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { runMatchingEngineForRequest } from "@/lib/matchingEngine";

export async function createSourcingRequestAction(formData: FormData) {
  const user = await requireBuyer();

  const title = (formData.get("title") as string)?.trim();
  const categoryId = formData.get("categoryId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const targetBudgetINR = parseFloat(formData.get("targetBudgetINR") as string);
  const maxLeadTimeDays = parseInt(formData.get("maxLeadTimeDays") as string, 10) || 30;
  const specifications = (formData.get("specifications") as string)?.trim() || "";

  if (!title || !categoryId || isNaN(quantity) || quantity <= 0 || isNaN(targetBudgetINR) || targetBudgetINR <= 0 || isNaN(maxLeadTimeDays) || maxLeadTimeDays <= 0) {
    throw new Error("Please complete all required fields with valid positive values.");
  }

  const categoryExists = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!categoryExists) {
    throw new Error("Selected manufacturing category is invalid.");
  }

  // 1. Create SourcingRequest record in SQLite
  const request = await prisma.sourcingRequest.create({
    data: {
      userId: user.id,
      title,
      categoryId,
      quantity,
      targetBudgetINR,
      maxLeadTimeDays,
      specifications,
      status: "NEW",
    },
  });

  // 2. Run the SINOVA Matching Engine & SINOVA Score Algorithm
  await runMatchingEngineForRequest(request.id);

  // 3. Redirect user to the Supplier Comparison view for this request
  redirect(`/requirements/${request.id}`);
}
