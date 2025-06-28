// src/lib/stores.ts
import { writable } from 'svelte/store';
import type { UserProfile } from './types';

// This creates a shared, "writable" store that can be accessed from any file.
export const userProfile = writable<UserProfile | null>(null);