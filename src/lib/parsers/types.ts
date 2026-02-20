export type TransactionType = "expense" | "income" | "transfer";

export type ParsedTransaction = {
  usageDate: Date;
  amount: number;
  description: string;
  type: TransactionType;
  hashKey: string;
  cardHolder?: string;
};

export interface TransactionParser {
  parse(content: string): ParsedTransaction[];
}
