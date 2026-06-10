export interface Account {
  id: string;
  name: string;
  budgetLimit: number; // 0 means no limit
  initialBalance: number;
}

export type CategoryType = 
  | 'Food' 
  | 'Transport' 
  | 'Shopping' 
  | 'Bills' 
  | 'Salary' 
  | 'Transfer' 
  | 'Medical' 
  | 'Other';

export interface Transaction {
  id: string;
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  category: CategoryType;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number; // timestamp
}

export interface BudgetProgress {
  accountId: string;
  limit: number;
  spent: number;
  percentage: number;
}
