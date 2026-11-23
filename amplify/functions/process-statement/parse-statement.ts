import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import {
  categorise,
  PAYMENT_CATEGORY,
  tidyDescription,
} from "./categories";

export type TransactionKind = "spend" | "refund" | "payment";

export interface ParsedTransaction {
  id: string;
  account: string;
  documentPath: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  /** YYYY-MM, for grouping by month */
  month: string;
  description: string;
  merchant: string;
  category: string;
  kind: TransactionKind;
  /** Positive for spend, negative for refunds and payments (as on the statement). */
  amount: number;
  cardMember: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  skipped: { line: number; reason: string }[];
}

const REQUIRED_COLUMNS = ["Date", "Description", "Amount"];

/** Amex UK exports dates as DD/MM/YYYY. Returns ISO or null if invalid. */
function parseDate(value: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, d, m, y] = match;
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  // Reject impossible dates such as 31/02 that Date would roll over.
  return parsed.toISOString().slice(0, 10) === iso ? iso : null;
}

function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[£,\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

/**
 * Same statement line => same id, so re-uploading a file (or an overlapping
 * export) overwrites rows instead of duplicating them. The occurrence index
 * keeps genuinely identical purchases on the same day distinct.
 */
function transactionId(parts: string[], occurrence: number): string {
  return createHash("sha256")
    .update([...parts, String(occurrence)].join("|"))
    .digest("hex")
    .slice(0, 32);
}

export function parseStatement(
  csv: string,
  account: string,
  documentPath: string
): ParseResult {
  const rows: Record<string, string>[] = parse(csv, {
    columns: (header: string[]) => header.map((h) => h.trim()),
    bom: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (rows.length === 0) return { transactions: [], skipped: [] };

  const missing = REQUIRED_COLUMNS.filter((c) => !(c in rows[0]));
  if (missing.length > 0) {
    throw new Error(`CSV is missing required column(s): ${missing.join(", ")}`);
  }

  const transactions: ParsedTransaction[] = [];
  const skipped: ParseResult["skipped"] = [];
  const seen = new Map<string, number>();

  rows.forEach((row, index) => {
    const line = index + 2; // +1 for header, +1 for 1-based numbering
    const date = parseDate(row.Date ?? "");
    const amount = parseAmount(row.Amount ?? "");
    const description = tidyDescription(row.Description ?? "");

    if (!date) return skipped.push({ line, reason: "invalid date" });
    if (amount === null) return skipped.push({ line, reason: "invalid amount" });
    if (!description) return skipped.push({ line, reason: "no description" });

    const cardMember = (row["Card Member"] ?? "").trim();
    const key = [account, date, cardMember, description, amount.toFixed(2)].join("|");
    const occurrence = seen.get(key) ?? 0;
    seen.set(key, occurrence + 1);

    const isPayment = /PAYMENT RECEIVED/i.test(description);
    const kind: TransactionKind = isPayment
      ? "payment"
      : amount < 0
        ? "refund"
        : "spend";
    const { merchant, category } = isPayment
      ? { merchant: "Payment", category: PAYMENT_CATEGORY }
      : categorise(description);

    transactions.push({
      id: transactionId([key], occurrence),
      account,
      documentPath,
      date,
      month: date.slice(0, 7),
      description,
      merchant,
      category,
      kind,
      amount,
      cardMember,
    });
  });

  return { transactions, skipped };
}
