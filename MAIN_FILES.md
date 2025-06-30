# Main Files in This SvelteKit App

## Project Root
- `package.json` — Project dependencies and scripts
- `vite.config.ts` — Vite configuration
- `svelte.config.js` — SvelteKit configuration
- `tailwind.config.ts` — Tailwind CSS configuration
- `postcss.config.js` — PostCSS configuration
- `tsconfig.json` — TypeScript configuration
- `README.md` — Project overview and setup

## Static Assets
- `static/` — Public assets (favicon, manifest, icons, screenshots, etc.)

## Source Code (`src/`)
- `src/app.css` — Global styles (Tailwind, etc.)
- `src/service-worker.ts` — Service worker (if used)

### Routes (Pages)
- `src/routes/+layout.svelte` — Root layout (runs on every page)
- `src/routes/+page.svelte` — Home page
- `src/routes/contas/+page.svelte` — Main bills/accounts page
- `src/routes/debts/+page.svelte` — Debts page
- `src/routes/configuracoes/+page.svelte` — Settings page

### Components
- `src/lib/components/AddBillModal.svelte` — Modal for adding bills
- `src/lib/components/AddDebtModal.svelte` — Modal for adding debts
- `src/lib/components/AddTransactionModal.svelte` — Modal for adding transactions
- `src/lib/components/BillItem.svelte` — Bill item display
- `src/lib/components/BillList.svelte` — Bill list display
- `src/lib/components/BottomNav.svelte` — Bottom navigation bar
- `src/lib/components/Header.svelte` — App header
- `src/lib/components/UpdateBalanceModal.svelte` — Modal for updating balances
- `src/lib/components/ConfirmationModal.svelte` — Confirmation dialog

### State, Types, and Database
- `src/lib/stores/stores.ts` — Svelte stores (user profile, etc.)
- `src/lib/types.ts` — TypeScript types (UserProfile, Bill, Debt, etc.)
- `src/lib/db.ts` — IndexedDB/Dexie database setup

---

This list covers the main files and folders for understanding and extending the app. For more details, see the code or ask about specific files or features.
