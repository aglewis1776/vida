// src/lib/types.ts
export interface UserProfile {
	id: string;
	email?: string;
	createdAt: string;
}

export interface Bill {
	id: string;
	profileId: string;
	name: string;
	recipient: string;
	amount: number;
	dueDate: string;
	isPaid: boolean;
	// NEW: Link a bill back to a parent debt
	debtId?: string;
}

export interface Transaction {
	id:string;
	profileId: string;
	type: 'income' | 'expense';
	amount: number;
	description: string;
	date: string;
}

export interface Debt {
	id: string;
	profileId: string;
	name: string;
	lender: string;
	totalBalance: number;
	interestRate?: number;
	priority: number;
	category?:
		| 'Cartão de Crédito'
		| 'Empréstimo Pessoal'
		| 'Cheque Especial'
		| 'Financiamento de Veículo'
		| 'Financiamento Imobiliário'
		| 'Contas Atrasadas'
		| 'Crediário / Carnê'
		| 'Agiota / Empréstimo Informal'
		| 'Família / Amigos'
		| 'Outros';
	// --- NEW: Payment Plan Fields ---
	paymentAmount?: number;
	totalInstallments?: number;
	installmentsPaid?: number;
	paymentDueDate?: number; // Day of the month (e.g., 15)
	isArchived?: boolean;
	// ---
	payments: { date: string; amount: number }[];
}
