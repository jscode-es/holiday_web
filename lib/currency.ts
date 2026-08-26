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

export type CurrencyDisplay = { displayCurrency: Currency | null; eurToJpyRate: number | null };

/**
 * Formats a cost for display: converted to the trip's display currency when
 * configured (with the original amount in the `title` for a hover tooltip),
 * or the raw amount + currency otherwise.
 */
export function costDisplay(
  cost: number,
  currency: Currency,
  currencyDisplay?: CurrencyDisplay
): { value: string; title?: string } {
  const converted = currencyDisplay
    ? convertToDisplay(cost, currency, currencyDisplay.displayCurrency, currencyDisplay.eurToJpyRate)
    : null;
  if (converted == null) return { value: `${cost} ${currency}`, title: undefined };
  return { value: formatCurrency(converted, currencyDisplay!.displayCurrency!), title: `Original: ${cost} ${currency}` };
}
