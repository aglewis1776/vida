// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { UserProfile, Bill, Transaction, Debt, RecurringBill } from './types';

export class VidaDB extends Dexie {
	profiles!: Table<UserProfile>;
	bills!: Table<Bill>;
	transactions!: Table<Transaction>;
	debts!: Table<Debt>;
	recurringBills!: Table<RecurringBill>;

	constructor() {
		super('vidaDB');
		// UPDATED: Incremented version number and removed billHistory
		this.version(7).stores({
			profiles: 'id',
			bills: 'id, profileId, dueDate, isPaid, paidAt, [debtId+isPaid]',
			transactions: 'id, profileId, date',
			debts: 'id, profileId, priority',
			recurringBills: 'id, profileId, dueDay, isActive'
		});

		// This was the old version 1 schema. We keep it here so Dexie knows
		// how to upgrade from the old version to the new one if needed.
		this.version(1).stores({
			profiles: 'id',
			bills: 'id, profileId, dueDate',
			transactions: 'id, profileId, date',
			debts: 'id, profileId'
		});
	}
}

export const db = new VidaDB();

/**
 * Generate bills for a debt with installments (parcels) and insert them into the bills table.
 * Each bill will have the correct due date and reference the debtId.
 * @param debt The Debt object with totalInstallments, paymentAmount, and paymentDueDate (day of month)
 * @param startDate Optional ISO string for the first due date (defaults to today)
 */
export async function generateBillsForDebtWithInstallments(debt: import('./types').Debt, startDate?: string) {
	if (!debt.totalInstallments || !debt.paymentAmount) return;
	const bills: import('./types').Bill[] = [];
	const baseDate = startDate ? new Date(startDate) : new Date();
	const dueDay = debt.paymentDueDate || baseDate.getDate();
	for (let i = 0; i < debt.totalInstallments; i++) {
		const dueDate = new Date(baseDate);
		dueDate.setMonth(baseDate.getMonth() + i);
		dueDate.setDate(dueDay);
		bills.push({
			id: crypto.randomUUID(),
			profileId: debt.profileId,
			name: debt.name + ` (Parcela ${i + 1}/${debt.totalInstallments})`,
			recipient: debt.lender,
			amount: debt.paymentAmount,
			dueDate: dueDate.toISOString().slice(0, 10), // YYYY-MM-DD
			isPaid: false,
			debtId: debt.id,
			category: 'Outros', // or map from debt.category if needed
		});
	}
	await db.bills.bulkAdd(bills);
}

