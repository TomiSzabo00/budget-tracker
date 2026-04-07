export interface WebhookPayload {
  event: string;
  timestamp?: string;
  data?: NewTransactionData;
  account_uid?: string;
  new_transactions?: number;
  total_fetched?: number;
  message?: string;
}

export interface NewTransactionData {
  tx_hash: string;
  transaction_id?: string | null;
  bank_id?: string | null;
  account_uid: string;
  // New schema: nested amount object
  transaction_amount?: { amount: number; currency: string };
  // Old schema flat fields (kept for backwards compat)
  amount?: number;
  currency?: string;
  status: string;
  booking_date: string | null;
  value_date: string | null;
  // New schema: nested objects
  debtor?: { name?: string | null } | null;
  creditor?: { name?: string | null } | null;
  // Old schema flat fields (kept for backwards compat)
  debtor_name?: string | null;
  creditor_name?: string | null;
  entry_reference?: string | null;
  reference?: string | null;
  remittance_information?: string[] | null;
  description?: string | null;
  is_salary: boolean;
}

export interface CategoryRow {
  id: number;
  name: string;
  color: string;
  excludeFromBudget: boolean;
  isSystem: boolean;
  createdAt: string;
}

export interface TransactionRow {
  id: number;
  txHash: string;
  bankId: string | null;
  accountUid: string | null;
  amount: number;
  currency: string;
  status: string;
  bookingDate: string;
  valueDate: string;
  debtorName: string | null;
  creditorName: string | null;
  reference: string | null;
  description: string | null;
  isSalary: boolean;
  categoryId: number | null;
  categoryOverride: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleRow {
  id: number;
  matchField: string;
  matchValue: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  income: number;
  spent: number;
  saved: number;
  currency: string;
}

export interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

export interface TaxSummary {
  totalTaxPaid: number;
  totalIncome: number;
  taxRate: number;
}

export interface YearlySummary {
  income: number;
  spent: number;
  saved: number;
  monthlyData: { month: string; income: number; expenses: number }[];
  categoryBreakdown: CategoryBreakdown[];
  taxSummary: TaxSummary;
}
