// Storybook 用のサーバーアクションモック

type CreateLoanInput = {
  name: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  monthlyAmount: number;
  dueDay: number;
  markPastAsPaid: boolean;
};

type UpdateLoanInput = {
  id: number;
  name: string;
  monthlyAmount: number;
  dueDay: number;
  endYear: number;
  endMonth: number;
};

export async function createLoan(_input: CreateLoanInput): Promise<void> {}

export async function updateLoan(_input: UpdateLoanInput): Promise<void> {}

export async function deleteLoan(_id: number): Promise<void> {}

export async function toggleScheduleStatus(
  _scheduleId: number,
  _currentStatus: string
): Promise<void> {}
