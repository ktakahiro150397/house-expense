// Storybook 用のサーバーアクションモック
// 実際のDB操作は行わず、何もしない関数として定義する

export async function updateTransactionCategory(
  _description: string,
  _categoryId: number | null
): Promise<void> {}

export async function toggleTransactionShared(
  _transactionId: number,
  _isShared: boolean
): Promise<void> {}

export async function deleteTransaction(_id: number): Promise<void> {}

export async function addCategoryRule(
  _categoryId: number,
  _keyword: string
): Promise<void> {}
