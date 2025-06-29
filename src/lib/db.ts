// src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { UserProfile, Bill, Transaction, Debt } from './types';

export class VidaDB extends Dexie {
	profiles!: Table<UserProfile>;
	bills!: Table<Bill>;
	transactions!: Table<Transaction>;
	debts!: Table<Debt>;

	constructor() {
		super('vidaDB');
		// UPDATED: Incremented version number and added a compound index
		this.version(2).stores({
			profiles: 'id',
			// This new compound index '[debtId+isPaid]' allows us to efficiently query
			// for bills that belong to a specific debt and have a specific paid status.
			bills: 'id, profileId, dueDate, [debtId+isPaid]',
			transactions: 'id, profileId, date',
			debts: 'id, profileId, priority'
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
