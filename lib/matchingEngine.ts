import { prisma } from "@/lib/prisma";
import { calculateLandedCostINR } from "@/lib/normalization";

export interface ScoreBreakdown {
  sinovaScore: number;
  qualityScore: number | null;
  priceFitScore: number;
  moqFitScore: number | null;
  deliveryScore: number | null;
  reliabilityScore: number | null;
  estimatedLandedCost: number;
}

/**
 * Calculates multi-factor SINOVA Score (0-100) for a product match.
 * Gracefully handles nullable/missing catalog fields without inventing data.
 */
export function calculateSinovaScore(params: {
  requestQuantity: number;
  targetBudgetINR: number;
  maxLeadTimeDays: number;
  productUnitPriceINR: number;
  productMOQ?: number | null;
  productLeadTimeDays?: number | null;
  manufacturerQualityScore?: number | null;
  manufacturerReliabilityScore?: number | null;
}): ScoreBreakdown {
  const {
    requestQuantity,
    targetBudgetINR,
    maxLeadTimeDays,
    productUnitPriceINR,
    productMOQ,
    productLeadTimeDays,
    manufacturerQualityScore,
    manufacturerReliabilityScore,
  } = params;

  // Calculate Estimated Landed Cost in INR
  const landedCostInfo = calculateLandedCostINR(productUnitPriceINR, requestQuantity);
  const estimatedLandedCost = landedCostInfo.totalLandedCostINR;

  // 1. Price Fit Score (Primary Catalog Metric)
  let priceFitScore = 100;
  if (targetBudgetINR > 0) {
    const ratio = estimatedLandedCost / targetBudgetINR;
    if (ratio <= 1.0) {
      priceFitScore = Math.min(100, Math.round(90 + (1.0 - ratio) * 25));
    } else {
      const penalty = Math.round((ratio - 1.0) * 120);
      priceFitScore = Math.max(20, 100 - penalty);
    }
  }

  // 2. Quality Score (Nullable)
  const qualityScore =
    typeof manufacturerQualityScore === "number"
      ? Math.min(100, Math.max(0, Math.round(manufacturerQualityScore)))
      : null;

  // 3. MOQ Fit Score (Nullable)
  let moqFitScore: number | null = null;
  if (typeof productMOQ === "number" && productMOQ > 0) {
    if (requestQuantity < productMOQ) {
      const shortfallRatio = (productMOQ - requestQuantity) / productMOQ;
      moqFitScore = Math.max(30, Math.round(95 - shortfallRatio * 75));
    } else {
      moqFitScore = Math.min(100, Math.round(95 + Math.min(5, (requestQuantity / productMOQ) * 2)));
    }
  }

  // 4. Delivery / Lead Time Score (Nullable)
  let deliveryScore: number | null = null;
  if (typeof productLeadTimeDays === "number" && productLeadTimeDays > 0) {
    if (productLeadTimeDays > maxLeadTimeDays && maxLeadTimeDays > 0) {
      const excessDays = productLeadTimeDays - maxLeadTimeDays;
      deliveryScore = Math.max(40, 92 - excessDays * 4);
    } else if (maxLeadTimeDays > 0) {
      const savingsDays = maxLeadTimeDays - productLeadTimeDays;
      deliveryScore = Math.min(100, 92 + savingsDays * 2);
    }
  }

  // 5. Reliability Score (Nullable)
  const reliabilityScore =
    typeof manufacturerReliabilityScore === "number"
      ? Math.min(100, Math.max(0, Math.round(manufacturerReliabilityScore)))
      : null;

  // Calculate Weighted SINOVA Score dynamically based on available signals
  let totalScore = priceFitScore;
  let weights = 1.0;

  if (qualityScore !== null) {
    totalScore += qualityScore * 0.5;
    weights += 0.5;
  }
  if (moqFitScore !== null) {
    totalScore += moqFitScore * 0.4;
    weights += 0.4;
  }
  if (deliveryScore !== null) {
    totalScore += deliveryScore * 0.2;
    weights += 0.2;
  }
  if (reliabilityScore !== null) {
    totalScore += reliabilityScore * 0.2;
    weights += 0.2;
  }

  const sinovaScore = Math.round(totalScore / weights);

  return {
    sinovaScore,
    qualityScore,
    priceFitScore,
    moqFitScore,
    deliveryScore,
    reliabilityScore,
    estimatedLandedCost,
  };
}

/**
 * Runs the matching engine for a specific SourcingRequest
 */
export async function runMatchingEngineForRequest(sourcingRequestId: string) {
  const request = await prisma.sourcingRequest.findUnique({
    where: { id: sourcingRequestId },
    include: { category: true },
  });

  if (!request) {
    throw new Error(`Sourcing request ${sourcingRequestId} not found.`);
  }

  // Fetch all products under this category with manufacturer details
  const products = await prisma.product.findMany({
    where: { categoryId: request.categoryId },
    include: { manufacturer: true },
  });

  // Fallback if category has no products
  const candidateProducts =
    products.length > 0
      ? products
      : await prisma.product.findMany({
          take: 10,
          include: { manufacturer: true },
        });

  const matches = [];

  for (const product of candidateProducts) {
    const scoreBreakdown = calculateSinovaScore({
      requestQuantity: request.quantity,
      targetBudgetINR: request.targetBudgetINR,
      maxLeadTimeDays: request.maxLeadTimeDays,
      productUnitPriceINR: product.unitPriceINR,
      productMOQ: product.moq,
      productLeadTimeDays: product.leadTimeDays,
      manufacturerQualityScore: product.manufacturer.qualityScore,
      manufacturerReliabilityScore: product.manufacturer.reliabilityScore,
    });

    const matchRecord = await prisma.supplierMatch.upsert({
      where: {
        sourcingRequestId_manufacturerId_productId: {
          sourcingRequestId: request.id,
          manufacturerId: product.manufacturerId,
          productId: product.id,
        },
      },
      update: {
        sinovaScore: scoreBreakdown.sinovaScore,
        qualityScore: scoreBreakdown.qualityScore,
        priceFitScore: scoreBreakdown.priceFitScore,
        moqFitScore: scoreBreakdown.moqFitScore,
        deliveryScore: scoreBreakdown.deliveryScore,
        reliabilityScore: scoreBreakdown.reliabilityScore,
        estimatedLandedCost: scoreBreakdown.estimatedLandedCost,
      },
      create: {
        sourcingRequestId: request.id,
        manufacturerId: product.manufacturerId,
        productId: product.id,
        sinovaScore: scoreBreakdown.sinovaScore,
        qualityScore: scoreBreakdown.qualityScore,
        priceFitScore: scoreBreakdown.priceFitScore,
        moqFitScore: scoreBreakdown.moqFitScore,
        deliveryScore: scoreBreakdown.deliveryScore,
        reliabilityScore: scoreBreakdown.reliabilityScore,
        estimatedLandedCost: scoreBreakdown.estimatedLandedCost,
      },
      include: {
        manufacturer: true,
        product: true,
      },
    });

    matches.push(matchRecord);
  }

  // Update request status to MATCHED
  await prisma.sourcingRequest.update({
    where: { id: sourcingRequestId },
    data: { status: "MATCHED" },
  });

  return matches.sort((a, b) => b.sinovaScore - a.sinovaScore);
}
