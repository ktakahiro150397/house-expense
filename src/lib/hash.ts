import { createHash } from "crypto";

export function generateHashKey(
  usageDate: Date,
  amount: number,
  rawDescription: string
): string {
  const data = `${usageDate.toISOString()}|${amount}|${rawDescription}`;
  return createHash("sha256").update(data).digest("hex");
}
