export type SettlementTransaction = {
  userId: number;
  amount: number;
};

export type SettlementResult = {
  userTotals: Map<number, number>;
  morePayerUserId: number | null; // 多く払ったユーザー（受け取る側）
  lessPayerUserId: number | null; // 少なく払ったユーザー（支払う側）
  difference: number; // 差額（割り勘後に支払うべき金額）
};

export function calculateSettlement(
  transactions: SettlementTransaction[]
): SettlementResult {
  const userTotals = new Map<number, number>();

  for (const tx of transactions) {
    const current = userTotals.get(tx.userId) ?? 0;
    userTotals.set(tx.userId, current + tx.amount);
  }

  if (userTotals.size === 0) {
    return { userTotals, morePayerUserId: null, lessPayerUserId: null, difference: 0 };
  }

  const entries = Array.from(userTotals.entries());

  if (entries.length === 1) {
    // 片方のみ支払いがある場合
    const [userId, total] = entries[0];
    return {
      userTotals,
      morePayerUserId: userId,
      lessPayerUserId: null,
      difference: total / 2,
    };
  }

  const [userA, totalA] = entries[0];
  const [userB, totalB] = entries[1];
  const difference = Math.abs(totalA - totalB) / 2;
  const morePayerUserId = totalA >= totalB ? userA : userB;
  const lessPayerUserId = totalA >= totalB ? userB : userA;

  return { userTotals, morePayerUserId, lessPayerUserId, difference };
}
