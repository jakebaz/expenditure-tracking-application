/**
 * Maps raw card-statement descriptions to a clean merchant name and a category.
 *
 * Rules are checked in order and the first match wins, so put more specific
 * rules (e.g. fuel) before broader ones (e.g. a supermarket that also sells
 * fuel). Edit this list to fit your own spending, then re-upload a statement
 * to re-categorise it (transactions are upserted, so nothing is duplicated).
 *
 * Anything that matches no rule keeps its full description as the merchant,
 * with only whitespace tidied, so you can tell what it is and add a rule.
 */
export interface CategoryRule {
  pattern: RegExp;
  /** Clean name to show. Leave empty to keep the tidied description. */
  merchant: string;
  category: string;
}

export const UNCATEGORISED = "Uncategorised";
export const PAYMENT_CATEGORY = "Payment";

export const RULES: CategoryRule[] = [
  // Professional
  { pattern: /AWS\.AMAZON/i, merchant: "AWS", category: "Professional" },

  // Fuel (before supermarkets: Costco/Tesco/Morrisons also sell petrol)
  { pattern: /COSTCO WHOLESALE PETROL/i, merchant: "Costco Petrol", category: "Fuel" },
  { pattern: /TESCO PETROL/i, merchant: "Tesco Petrol", category: "Fuel" },
  { pattern: /\b(SHELL|ESSO)\b|PETROL/i, merchant: "", category: "Fuel" },

  // Groceries
  { pattern: /MORRISONS/i, merchant: "Morrisons", category: "Groceries" },
  { pattern: /ALDI/i, merchant: "Aldi", category: "Groceries" },
  { pattern: /TESCO/i, merchant: "Tesco", category: "Groceries" },
  { pattern: /COSTCO/i, merchant: "Costco", category: "Groceries" },
  { pattern: /SAINSBURY/i, merchant: "Sainsbury's", category: "Groceries" },
  { pattern: /WAITROSE/i, merchant: "Waitrose", category: "Groceries" },
  { pattern: /\bLIDL\b/i, merchant: "Lidl", category: "Groceries" },
  { pattern: /\bASDA\b/i, merchant: "Asda", category: "Groceries" },
  { pattern: /OCADO/i, merchant: "Ocado", category: "Groceries" },
  { pattern: /CO-OP/i, merchant: "Co-op", category: "Groceries" },
  { pattern: /\bM&S\b|MARKS (&|AND) SPENCER/i, merchant: "M&S", category: "Groceries" },

  // Home & DIY
  { pattern: /SCREWFIX/i, merchant: "Screwfix", category: "Home & DIY" },
  { pattern: /TOOLSTATION/i, merchant: "Toolstation", category: "Home & DIY" },
  { pattern: /BANDQ|B&Q/i, merchant: "B&Q", category: "Home & DIY" },
  { pattern: /IKEA/i, merchant: "IKEA", category: "Home & DIY" },
  { pattern: /WICKES/i, merchant: "Wickes", category: "Home & DIY" },
  { pattern: /HOMEBASE/i, merchant: "Homebase", category: "Home & DIY" },
  { pattern: /J\.T\.DOVE/i, merchant: "J T Dove", category: "Home & DIY" },

  // Pets
  { pattern: /PETS AT HOME/i, merchant: "Pets at Home", category: "Pets" },

  // Health & beauty
  { pattern: /BOOTS/i, merchant: "Boots", category: "Health & Beauty" },

  // Kids
  { pattern: /ENTERTAINER/i, merchant: "The Entertainer", category: "Kids" },
  { pattern: /SOCCER STARS/i, merchant: "Soccer Stars", category: "Kids" },

  // Transport
  { pattern: /UBER/i, merchant: "Uber", category: "Transport" },

  { pattern: /\bBOLT\b/i, merchant: "Bolt", category: "Transport" },

  // Eating out
  { pattern: /NANDOS/i, merchant: "Nando's", category: "Eating Out" },
  { pattern: /MCDONAL/i, merchant: "McDonald's", category: "Eating Out" },
  { pattern: /PAPAJOHN/i, merchant: "Papa John's", category: "Eating Out" },
  { pattern: /HOTEL CHOCOLAT/i, merchant: "Hotel Chocolat", category: "Eating Out" },
  { pattern: /\bRESTAURANT\b|\bCAFE\b|\bCOFFEE\b|\bPUB\b/i, merchant: "", category: "Eating Out" },

  // Clothing
  { pattern: /PRIMARK/i, merchant: "Primark", category: "Clothing" },
  { pattern: /\bH&M\b/i, merchant: "H&M", category: "Clothing" },
  { pattern: /WORKWEAR/i, merchant: "", category: "Clothing" },
  { pattern: /GO OUTDOORS/i, merchant: "Go Outdoors", category: "Clothing" },

  // Online shopping (broad, keep late)
  { pattern: /APPLE STORE/i, merchant: "Apple", category: "Shopping" },
  { pattern: /AMZN|AMAZON/i, merchant: "Amazon", category: "Shopping" },
  { pattern: /EBAY/i, merchant: "Amazon", category: "Shopping" },

];

/** Collapses runs of whitespace; keeps prefixes like "PAYPAL *" intact. */
export function tidyDescription(description: string): string {
  return description.replace(/\s+/g, " ").trim();
}

export function categorise(description: string): {
  merchant: string;
  category: string;
} {
  const tidy = tidyDescription(description);
  const rule = RULES.find((r) => r.pattern.test(tidy));
  if (!rule) return { merchant: tidy, category: UNCATEGORISED };
  return { merchant: rule.merchant || tidy, category: rule.category };
}
