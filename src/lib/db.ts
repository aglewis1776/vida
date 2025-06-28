// src/lib/db.ts

import Dexie, { type Table } from 'dexie';
import type { UserProfile, Bill, Transaction, Debt } from './types';

export class VidaDB extends Dexie {
  profiles!: Table<UserProfile>;
  bills!: Table<Bill>;
  transactions!: Table<Transaction>;
  debts!: Table<Debt>;

  constructor() {
    // The string here is the name of our database.
    super('vidaDB');
    this.version(1).stores({
      // Schema definition. The '++' means auto-incrementing primary key.
      // We use 'id' as our primary key, which will be a UUID string.
      // The other strings are indexes, which make searching by those fields fast.
      profiles: 'id',
      bills: 'id, profileId, dueDate',
      transactions: 'id, profileId, date',
      debts: 'id, profileId',
    });
  }
}

// Export a single instance of the database
export const db = new VidaDB();
