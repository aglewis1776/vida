// src/lib/types.ts

export interface UserProfile {
  id: string; // Unique ID (UUID for local, Firebase UID for synced)
  email?: string;
  createdAt: string; // ISO 8601 date string
}

export interface Bill {
  id: string; // Unique ID (e.g., UUID)
  profileId: string; // Foreign key to UserProfile
  name: string; // e.g., "Conta de Luz"
  recipient: string; // e.g., "Neoenergia"
  amount: number; // e.g., 85.00
  dueDate: string; // ISO 8601 date string
  isPaid: boolean;
}

export interface Transaction {
  id: string;
  profileId: string; // Foreign key to UserProfile
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string; // ISO 8601 date string
}

export interface Debt {
  id: string;
  profileId: string; // Foreign key to UserProfile
  name: string; // e.g., "Cartão de Crédito"
  lender: string; // e.g., "Itaú"
  totalBalance: number;
  interestRate?: number; // Annual percentage rate (APR)
  priority: number; // User-defined priority for sorting
  payments: { date: string; amount: number }[];
}
