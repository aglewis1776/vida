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
	// UPDATED: Expanded the list of possible categories
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
	payments: { date: string; amount: number }[];
}
