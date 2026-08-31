"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";

export async function toggleSaveSupplierAction(manufacturerId: string) {
  const user = await requireBuyer();

  if (!manufacturerId || typeof manufacturerId !== "string") {
    throw new Error("Manufacturer ID is required.");
  }

  // Verify Manufacturer exists
  const manufacturer = await prisma.manufacturer.findUnique({
    where: { id: manufacturerId },
  });

  if (!manufacturer) {
    throw new Error("Manufacturer not found.");
  }

  // Check if saved record exists for current authenticated user
  const existingSave = await prisma.savedSupplier.findUnique({
    where: {
      userId_manufacturerId: {
        userId: user.id,
        manufacturerId,
      },
    },
  });

  let isSaved = false;

  if (existingSave) {
    // Unsave / remove record
    await prisma.savedSupplier.delete({
      where: {
        id: existingSave.id,
      },
    });
    isSaved = false;
  } else {
    // Save supplier record
    await prisma.savedSupplier.create({
      data: {
        userId: user.id,
        manufacturerId,
      },
    });
    isSaved = true;
  }

  // Revalidate routes
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${manufacturerId}`);
  revalidatePath("/suppliers/saved");
  revalidatePath("/dashboard");

  return { isSaved };
}
