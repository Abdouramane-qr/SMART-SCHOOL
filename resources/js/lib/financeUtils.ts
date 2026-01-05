/**
 * Utilitaires pour les calculs financiers multi-devises
 */

export type Currency = "XOF" | "USD" | "EUR";

export const CURRENCIES: Record<Currency, { symbol: string; name: string; locale: string }> = {
  XOF: { symbol: "FCFA", name: "Franc CFA", locale: "fr-FR" },
  USD: { symbol: "$", name: "Dollar américain", locale: "en-US" },
  EUR: { symbol: "€", name: "Euro", locale: "fr-FR" },
};

// Taux de change par défaut (vers XOF)
export const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  XOF: 1,
  USD: 615,
  EUR: 656,
};

/**
 * Convertit un montant d'une devise vers XOF
 */
export function convertToXOF(amount: number, currency: Currency, customRate?: number): number {
  const rate = customRate || DEFAULT_EXCHANGE_RATES[currency];
  return amount * rate;
}

/**
 * Convertit un montant de XOF vers une autre devise
 */
export function convertFromXOF(amountXOF: number, targetCurrency: Currency, customRate?: number): number {
  const rate = customRate || DEFAULT_EXCHANGE_RATES[targetCurrency];
  return amountXOF / rate;
}

/**
 * Formate un montant selon la devise
 */
export function formatAmount(amount: number, currency: Currency = "XOF"): string {
  const config = CURRENCIES[currency];
  
  if (currency === "XOF") {
    return `${amount.toLocaleString(config.locale, { maximumFractionDigits: 0 })} ${config.symbol}`;
  }
  
  return `${config.symbol}${amount.toLocaleString(config.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calcule le montant TTC à partir du HT et du taux de TVA
 */
export function calculateWithTax(amountHT: number, taxRate: number): number {
  return amountHT * (1 + taxRate / 100);
}

/**
 * Calcule le montant de la TVA
 */
export function calculateTaxAmount(amountHT: number, taxRate: number): number {
  return amountHT * (taxRate / 100);
}

/**
 * Calcule le montant HT à partir du TTC
 */
export function calculateWithoutTax(amountTTC: number, taxRate: number): number {
  return amountTTC / (1 + taxRate / 100);
}

/**
 * Catégories de dépenses
 */
export const EXPENSE_CATEGORIES = [
  { value: "salaires", label: "Salaires" },
  { value: "fournitures", label: "Fournitures scolaires" },
  { value: "maintenance", label: "Maintenance" },
  { value: "electricite", label: "Électricité" },
  { value: "eau", label: "Eau" },
  { value: "internet", label: "Internet/Téléphone" },
  { value: "transport", label: "Transport" },
  { value: "equipement", label: "Équipement" },
  { value: "evenements", label: "Événements" },
  { value: "autre", label: "Autre" },
] as const;

/**
 * Types de paiements
 */
export const PAYMENT_TYPES = {
  inscription: "Frais d'inscription",
  scolarite: "Frais de scolarité",
  autre: "Autre",
} as const;

/**
 * Statuts de paiement
 */
export const PAYMENT_STATUS = {
  paye: { label: "Payé", color: "bg-green-500" },
  partiel: { label: "Partiel", color: "bg-yellow-500" },
  en_retard: { label: "En retard", color: "bg-red-500" },
} as const;
