export type Currency = "EUR" | "JPY";

/**
 * Converts an amount from its own currency into the trip's display currency,
 * using the trip's EUR→JPY rate ("1 EUR = X JPY"). Returns null when the
 * trip hasn't configured a display currency/rate, or the amount's currency
 * isn't one of the two supported ones — callers fall back to showing the
 * raw amount + currency in that case.
 */
export function convertToDisplay(
  amount: number,
  currency: Currency,
  displayCurrency: Currency | null,
  eurToJpyRate: number | null
): number | null {
  if (!displayCurrency || !eurToJpyRate) return null;
  if (currency === displayCurrency) return amount;
  if (currency === "EUR" && displayCurrency === "JPY") return amount * eurToJpyRate;
  if (currency === "JPY" && displayCurrency === "EUR") return amount / eurToJpyRate;
  return null;
}

export function formatCurrency(amount: number, currency: Currency): string {
  return currency === "EUR" ? `${amount.toFixed(2)} €` : `¥${Math.round(amount)}`;
}
