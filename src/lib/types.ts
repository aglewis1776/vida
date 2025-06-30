// src/lib/types.ts
export interface UserProfile {
	id: string;
	email?: string;
	createdAt: string;
	// NEW: Added fields for cash and pix balance
	cashBalance?: number;
	pixBalance?: number;
}

export interface Bill {
	id: string;
	profileId: string;
	name: string;
	recipient: string;
	amount: number;
	dueDate: string;
	isPaid: boolean;
	debtId?: string;
	category?:
		| 'Moradia' // Housing
		| 'Transporte' // Transportation
		| 'Alimentação' // Food
		| 'Saúde' // Health
		| 'Educação' // Education
		| 'Lazer' // Leisure
		| 'Impostos e Taxas' // Taxes and Fees
		| 'Outros'; // Others
}

export interface Transaction {
	id: string;
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
	paymentAmount?: number;
	totalInstallments?: number;
	installmentsPaid?: number;
	paymentDueDate?: number;
isArchived?: boolean;
	payments: { date: string; amount: number }[];
}

export interface BillHistory extends Bill {
	paidAt: string;
	paymentMethod?: string;
	amountPaid?: number;
	note?: string;
	installmentInfo?: string;
}

export type Recurrence = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface RecurringBill {
	id: string;
	profileId: string;
	name: string;
	recipient: string;
	amount: number;
	category:
		| 'Energia'
		| 'Água'
		| 'Gás'
		| 'Aluguel'
		| 'Internet'
		| 'Telefone'
		| 'TV'
		| 'Condomínio'
		| 'Outros';
	dueDay: number; // Day of month bill is due
	isActive: boolean;
	lastPaidDate?: string; // ISO date string
	recurrence?: Recurrence; // NEW: how often the bill recurs
	// Optionally, add more fields as needed
}