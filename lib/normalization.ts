/**
 * SINOVA AI Data Normalization & Cost Engine
 * Handles normalization of raw manufacturer data, currency conversions,
 * and estimated landed cost calculations.
 */

export interface SpecAttribute {
  label: string;
  value: string;
}

export interface LandedCostBreakdown {
  factoryUnitPriceINR: number;
  estimatedFreightINR: number;
  estimatedCustomsDutyINR: number;
  estimatedInsuranceINR: number;
  totalLandedCostINR: number;
}

// Fixed conversion rates for standardizing multi-currency supplier quotes
const CURRENCY_RATES_TO_INR: Record<string, number> = {
  INR: 1.0,
  USD: 86.5,
  RMB: 12.0,
  CNY: 12.0,
};

/**
 * Normalizes supplier prices into INR
 */
export function normalizeCurrencyToINR(amount: number, currency = "INR"): number {
  const rate = CURRENCY_RATES_TO_INR[currency.toUpperCase()] || 1.0;
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Calculates estimated landed cost per unit in India based on factory price,
 * logistics, tariffs/duties, and insurance.
 */
export function calculateLandedCostINR(
  factoryUnitPriceINR: number,
  quantity: number
): LandedCostBreakdown {
  // Volume discount factor for freight per unit
  const volumeDiscount = quantity >= 5000 ? 0.07 : quantity >= 2000 ? 0.08 : 0.1;
  
  const estimatedFreightINR = Math.round(factoryUnitPriceINR * volumeDiscount);
  const estimatedCustomsDutyINR = Math.round(factoryUnitPriceINR * 0.15); // ~15% import tariff
  const estimatedInsuranceINR = Math.round(factoryUnitPriceINR * 0.02); // ~2% port & transit insurance

  const totalLandedCostINR = Math.round(
    factoryUnitPriceINR + estimatedFreightINR + estimatedCustomsDutyINR + estimatedInsuranceINR
  );

  return {
    factoryUnitPriceINR: Math.round(factoryUnitPriceINR),
    estimatedFreightINR,
    estimatedCustomsDutyINR,
    estimatedInsuranceINR,
    totalLandedCostINR,
  };
}

/**
 * Safely parses JSON specification string
 */
export function parseSpecifications(specificationsStr?: string | null): Record<string, string> {
  if (!specificationsStr) return {};
  try {
    return JSON.parse(specificationsStr);
  } catch {
    return { Brief: specificationsStr };
  }
}

/**
 * Serializes specification object to JSON string
 */
export function serializeSpecifications(specs: Record<string, string>): string {
  return JSON.stringify(specs);
}
