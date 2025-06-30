<script lang="ts">
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Bill, Debt, RecurringBill } from '$lib/types';
	import { liveQuery } from 'dexie';
	import { addDays } from 'date-fns';
	import { writable, get, readable } from 'svelte/store';

	import AddBillModal from '$lib/components/AddBillModal.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import PayBillModal from '$lib/components/PayBillModal.svelte';
	import AddRecurringBillModal from '$lib/components/AddRecurringBillModal.svelte';
	import BillItem from '$lib/components/BillItem.svelte';

	interface BillWithInstallment extends Bill {
		installmentInfo?: string;
	}

	let showAddBillModal = false;
	let billToEdit: Bill | null = null;

	let showDeleteModal = false;
	let billToDelete: BillWithInstallment | null = null;

	let showPayModal = false;
	let billToPay: BillWithInstallment | null = null;

	const showAll = writable(false);

	// Always load all unpaid bills for the user
	const allBills = liveQuery<BillWithInstallment[]>(async () => {
		const profile = get(userProfile);
		if (!profile) return [];
		let collection = db.bills.where('profileId').equals(profile.id).and(bill => bill.isPaid === false);
		const bills = await collection.sortBy('dueDate');
		return await Promise.all(
			bills.map(async (bill) => {
				if (bill.debtId) {
					const debt = await db.debts.get(bill.debtId);
					if (debt && debt.totalInstallments) {
						const match = bill.name.match(/Parcela (\d+)/);
						const currentInstallment = match ? match[1] : '?';
						return {
							...bill,
							installmentInfo: `Parcela ${currentInstallment} de ${debt.totalInstallments}`
						};
					}
				}
				return bill;
			})
		);
	});

	// Recurring bills store
	const recurringBills = liveQuery<RecurringBill[]>(async () => {
	  const profile = get(userProfile);
	  if (!profile) return [];
	  return await db.recurringBills.where('profileId').equals(profile.id).and(bill => bill.isActive !== false).sortBy('dueDay');
	});

	let overdue: BillWithInstallment[] = [];
	let dueToday: BillWithInstallment[] = [];
	let dueTomorrow: BillWithInstallment[] = [];
	let next7Days: BillWithInstallment[] = [];
	let upcoming: BillWithInstallment[] = [];

	$: {
		if ($allBills) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const limitDate = $showAll ? addDays(today, 90) : addDays(today, 45);
			const sevenDaysFromNow = new Date(today);
			sevenDaysFromNow.setDate(today.getDate() + 7);
			const tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);

			overdue = [];
			dueToday = [];
			dueTomorrow = [];
			next7Days = [];
			upcoming = [];

			for (const bill of $allBills) {
				const dueDate = new Date(bill.dueDate + 'T00:00:00');
				if (dueDate < today) {
					overdue.push(bill);
				} else if (dueDate.getTime() === today.getTime()) {
					dueToday.push(bill);
				} else if (dueDate.getTime() === tomorrow.getTime()) {
					dueTomorrow.push(bill);
				} else if (dueDate > tomorrow && dueDate <= sevenDaysFromNow) {
					next7Days.push(bill);
				} else if (dueDate > sevenDaysFromNow && dueDate < limitDate) {
					upcoming.push(bill);
				}
			}
		}
	}
	
	function getCategoryColorClass(category: Bill['category']): string {
		switch (category) {
			case 'Moradia': return 'bg-blue-500';
			case 'Transporte': return 'bg-purple-500';
			case 'Alimentação': return 'bg-green-500';
			case 'Saúde': return 'bg-red-500';
			case 'Educação': return 'bg-yellow-500';
			case 'Lazer': return 'bg-pink-500';
			case 'Impostos e Taxas': return 'bg-amber-600';
			default: return 'bg-gray-400';
		}
	}

	// --- CLEANUP: Toggle logic for 45/90 days ---
	function toggleShowAll() {
		showAll.update(v => !v);
	}

	// When switching to 'active' view, always reset to 45 days
	function setView(newView: 'active' | 'recurring' | 'history') {
	  view = newView;
	  if (newView === 'active') {
		showAll.set(false);
	  }
	}

	function minimizeList() {
		showAll.set(false);
	}

	function openAddBillModal() {
		billToEdit = null;
		showAddBillModal = true;
	}

	function openEditBillModal(bill: Bill) {
		billToEdit = bill;
		showAddBillModal = true;
	}

	function closeAddBillModal() {
		showAddBillModal = false;
		billToEdit = null;
	}

	function handleBillSaved() { console.log('Bill saved.'); }
	
	function getDay(dateString: string): string {
		const date = new Date(dateString + 'T00:00:00');
		return date.toLocaleDateString('pt-BR', { day: 'numeric' });
	}

	function getMonthAbbr(dateString: string): string {
		const date = new Date(dateString + 'T00:00:00');
		return date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
	}

	function promptForDelete(bill: BillWithInstallment) {
		billToDelete = bill;
		showDeleteModal = true;
	}

	async function handleDeleteConfirmed() {
		if (billToDelete) {
			// Just delete the bill, no archiving to billHistory
			await db.bills.delete(billToDelete.id);
			billToDelete = null;
			showDeleteModal = false;
		}
	}

	function handleDeleteCancelled() {
		billToDelete = null;
		showDeleteModal = false;
	}

	function handlePayWithPix(bill: BillWithInstallment) {
		billToPay = bill;
		showPayModal = true;
	}
	function closePayModal() {
		showPayModal = false;
		billToPay = null;
	}
	let paymentError: string | null = null;

	// Bill payment logic: update bill as paid in-place
	async function handleBillPaid(event: CustomEvent) {
		const { bill, paymentMethod, amount, date, note } = event.detail;
		paymentError = null;
		const profile = $userProfile;
		if (profile) {
			if (paymentMethod === 'PIX') {
				const pix = profile.pixBalance ?? 0;
				if (pix < amount) {
					paymentError = 'Saldo PIX insuficiente. Atualize seu saldo em Configurações.';
					return;
				}
				const newPix = pix - amount;
				await db.profiles.update(profile.id, { pixBalance: newPix });
				userProfile.update(p => p ? { ...p, pixBalance: newPix } : p);
			} else if (paymentMethod === 'Cash' || paymentMethod === 'Boleto') {
				const cash = profile.cashBalance ?? 0;
				if (cash < amount) {
					paymentError = 'Saldo em Dinheiro insuficiente. Atualize seu saldo em Configurações.';
					return;
				}
				const newCash = cash - amount;
				await db.profiles.update(profile.id, { cashBalance: newCash });
				userProfile.update(p => p ? { ...p, cashBalance: newCash } : p);
			}
		}

		// If this bill is linked to a debt (parcelas), update installmentsPaid
		if (bill.debtId) {
			const debt = await db.debts.get(bill.debtId);
			if (debt && typeof debt.installmentsPaid === 'number' && typeof debt.totalInstallments === 'number') {
				const newInstallmentsPaid = Math.min(debt.installmentsPaid + 1, debt.totalInstallments);
				await db.debts.update(debt.id, { installmentsPaid: newInstallmentsPaid });
			}
		}

		// Mark bill as paid in-place
		await db.bills.update(bill.id, {
			isPaid: true,
			paidAt: date,
			paymentMethod,
			amountPaid: amount,
			note
		});
		showPayModal = false;
		billToPay = null;
	}

	// Collapsed state for each section
	const SECTION_OVERDUE = 'overdue';
	const SECTION_TODAY = 'today';
	const SECTION_TOMORROW = 'tomorrow';
	const SECTION_NEXT7 = 'next7';
	const SECTION_UPCOMING = 'upcoming';

	let collapsedSections: Record<string, boolean> = {
		[SECTION_OVERDUE]: false,
		[SECTION_TODAY]: false,
		[SECTION_TOMORROW]: false,
		[SECTION_NEXT7]: false,
		[SECTION_UPCOMING]: false
	};
	function toggleSection(section: string) {
		collapsedSections[section] = !collapsedSections[section];
	}

	let view: 'active' | 'recurring' | 'history' = 'active';

	// Change from reactive assignment to top-level const for billHistory
	const paidBills = liveQuery<Bill[]>(async () => {
		const profile = get(userProfile);
		if (!profile) return [];
		return await db.bills.where('profileId').equals(profile.id).and(bill => bill.isPaid === true).reverse().sortBy('paidAt');
	});

	let showAddRecurringBillModal = false;
	let showRecurring = false;

	function toggleRecurring(show: boolean) {
	  showRecurring = show;
	}

	function handleRecurringBillSave(event: CustomEvent) {
	  const bill = event.detail.bill;
	  // Attach profileId from current user
	  const profile = get(userProfile);
	  if (profile) {
	    bill.profileId = profile.id;
	    db.recurringBills.add(bill);
	  }
	  showAddRecurringBillModal = false;
	}
</script>

<div class="space-y-6">
	<div class="flex justify-center gap-4 mb-6">
		<button
			class="px-4 py-2 rounded font-semibold shadow focus:outline-none transition text-white"
			class:bg-blue-600={view === 'active'}
			class:bg-gray-300={view !== 'active'}
			class:text-blue-700={view !== 'active'}
			on:click={() => setView('active')}
		>
			Contas Ativas
		</button>
		<button
			class="px-4 py-2 rounded font-semibold shadow focus:outline-none transition text-white"
			class:bg-green-600={view === 'recurring'}
			class:bg-gray-300={view !== 'recurring'}
			on:click={() => setView('recurring')}
		>
			Contas Recorrentes
		</button>
		<button
			class="px-4 py-2 rounded font-semibold shadow focus:outline-none transition text-white"
			class:bg-blue-600={view === 'history'}
			class:bg-gray-300={view !== 'history'}
			class:text-blue-700={view !== 'history'}
			on:click={() => setView('history')}
		>
			Contas Vencidas
		</button>
	</div>

	{#if view === 'active'}
		{#if !$allBills || $allBills.length === 0}
			<div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
				<p class="text-gray-500">Nenhuma conta cadastrada.</p>
				<button class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4" on:click={openAddBillModal}>
					Adicionar sua primeira conta
				</button>
			</div>
		{/if}

		<!-- Overdue Bills -->
		{#if overdue.length > 0}
			<div class="mt-6">
				<button type="button" class="flex items-center w-full cursor-pointer select-none border-0 p-0 rounded bg-red-100 hover:bg-red-200 transition group" on:click={() => toggleSection(SECTION_OVERDUE)} aria-expanded={!collapsedSections[SECTION_OVERDUE]} aria-controls="overdue-section">
					<span class="font-bold text-red-700 flex-1 text-left">Vencidas</span>
					<svg class="h-5 w-5 text-red-400 group-hover:text-red-600 transform transition-transform duration-200" style:rotate={collapsedSections[SECTION_OVERDUE] ? '180deg' : '0deg'} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
				</button>
				{#if !collapsedSections[SECTION_OVERDUE]}
					<div class="space-y-2 mt-2" id="overdue-section">
						{#each overdue as bill (bill.id)}
							<BillItem {bill} on:edit={() => openEditBillModal(bill)} on:pay={() => handlePayWithPix(bill)} on:delete={() => promptForDelete(bill)} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Due Today -->
		{#if dueToday.length > 0}
			<div class="mt-6">
				<button type="button" class="flex items-center w-full cursor-pointer select-none border-0 p-0 rounded bg-blue-100 hover:bg-blue-200 transition group" on:click={() => toggleSection(SECTION_TODAY)} aria-expanded={!collapsedSections[SECTION_TODAY]} aria-controls="today-section">
					<span class="font-bold text-blue-700 flex-1 text-left">Vence hoje</span>
					<svg class="h-5 w-5 text-blue-400 group-hover:text-blue-600 transform transition-transform duration-200" style:rotate={collapsedSections[SECTION_TODAY] ? '180deg' : '0deg'} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
				</button>
				{#if !collapsedSections[SECTION_TODAY]}
					<div class="space-y-2 mt-2" id="today-section">
						{#each dueToday as bill (bill.id)}
							<BillItem {bill} on:edit={() => openEditBillModal(bill)} on:pay={() => handlePayWithPix(bill)} on:delete={() => promptForDelete(bill)} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Due Tomorrow -->
		{#if dueTomorrow.length > 0}
			<div class="mt-6">
				<button type="button" class="flex items-center w-full cursor-pointer select-none border-0 p-0 rounded bg-yellow-100 hover:bg-yellow-200 transition group" on:click={() => toggleSection(SECTION_TOMORROW)} aria-expanded={!collapsedSections[SECTION_TOMORROW]} aria-controls="tomorrow-section">
					<span class="font-bold text-yellow-700 flex-1 text-left">Vence amanhã</span>
					<svg class="h-5 w-5 text-yellow-400 group-hover:text-yellow-600 transform transition-transform duration-200" style:rotate={collapsedSections[SECTION_TOMORROW] ? '180deg' : '0deg'} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
				</button>
				{#if !collapsedSections[SECTION_TOMORROW]}
					<div class="space-y-2 mt-2" id="tomorrow-section">
						{#each dueTomorrow as bill (bill.id)}
							<BillItem {bill} on:edit={() => openEditBillModal(bill)} on:pay={() => handlePayWithPix(bill)} on:delete={() => promptForDelete(bill)} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Next 7 Days -->
		{#if next7Days.length > 0}
			<div class="mt-6">
				<button type="button" class="flex items-center w-full cursor-pointer select-none border-0 p-0 rounded bg-green-100 hover:bg-green-200 transition group" on:click={() => toggleSection(SECTION_NEXT7)} aria-expanded={!collapsedSections[SECTION_NEXT7]} aria-controls="next7-section">
					<span class="font-bold text-green-700 flex-1 text-left">Próximos 7 dias</span>
					<svg class="h-5 w-5 text-green-400 group-hover:text-green-600 transform transition-transform duration-200" style:rotate={collapsedSections[SECTION_NEXT7] ? '180deg' : '0deg'} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
				</button>
				{#if !collapsedSections[SECTION_NEXT7]}
					<div class="space-y-2 mt-2" id="next7-section">
						{#each next7Days as bill (bill.id)}
							<BillItem {bill} on:edit={() => openEditBillModal(bill)} on:pay={() => handlePayWithPix(bill)} on:delete={() => promptForDelete(bill)} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Upcoming -->
		{#if upcoming.length > 0}
			<div class="mt-6">
				<button type="button" class="flex items-center w-full cursor-pointer select-none border-0 p-0 rounded bg-gray-100 hover:bg-gray-200 transition group" on:click={() => toggleSection(SECTION_UPCOMING)} aria-expanded={!collapsedSections[SECTION_UPCOMING]} aria-controls="upcoming-section">
					<span class="font-bold text-gray-700 flex-1 text-left">Próximas contas</span>
					<svg class="h-5 w-5 text-gray-400 group-hover:text-gray-600 transform transition-transform duration-200" style:rotate={collapsedSections[SECTION_UPCOMING] ? '180deg' : '0deg'} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
				</button>
				{#if !collapsedSections[SECTION_UPCOMING]}
					<div class="space-y-2 mt-2" id="upcoming-section">
						{#each upcoming as bill (bill.id)}
							<BillItem {bill} on:edit={() => openEditBillModal(bill)} on:pay={() => handlePayWithPix(bill)} on:delete={() => promptForDelete(bill)} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		{#if view === 'active' && $allBills && $allBills.length > 0}
			<div class="text-center pt-4">
				<button on:click={toggleShowAll} class="inline-block rounded { $showAll ? 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' } px-6 py-2 text-white font-semibold shadow focus:outline-none focus:ring-2 focus:ring-offset-2 transition">
					{#if !$showAll}
						Mostrar contas dos próximos 90 dias
					{:else}
						Minimizar
					{/if}
				</button>
			</div>
		{/if}
	{/if}

	{#if view === 'recurring'}
		<div class="space-y-3">
			<!-- Floating Action Button for adding new recurring bill -->
			<div class="fixed bottom-24 right-5 z-20">
				<button
					class="flex items-center justify-center w-14 h-14 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition"
					aria-label="Adicionar Nova Conta Recorrente"
					on:click={() => showAddRecurringBillModal = true}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
				</button>
			</div>
			{#if $recurringBills && $recurringBills.length > 0}
				{#each $recurringBills as bill (bill.id)}
					<div class="overflow-hidden rounded-lg bg-white shadow-sm flex items-center p-4">
						<div class="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-green-100 text-green-700 mr-4">
							<span class="text-xl font-bold">{bill.dueDay}</span>
							<span class="text-xs font-semibold">DIA</span>
						</div>
						<div class="flex-grow">
							<p class="font-semibold text-gray-800">{bill.name}</p>
							<p class="text-sm text-gray-500">{bill.recipient}</p>
							<p class="text-xs text-gray-400">{bill.category}</p>
						</div>
						<div class="text-right">
							<p class="text-lg font-bold text-green-700">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
							{#if bill.lastPaidDate}
								<p class="text-xs text-gray-400">Último pagamento: {new Date(bill.lastPaidDate).toLocaleDateString('pt-BR')}</p>
							{/if}
						</div>
					</div>
				{/each}
			{:else}
				<div class="text-center text-gray-400 py-8">Nenhuma conta recorrente cadastrada.</div>
			{/if}
		</div>
	{/if}

	{#if view === 'history'}
		<div class="space-y-4">
			<h2 class="text-lg font-bold text-blue-700 mb-2">Histórico de Pagamentos</h2>
			{#if $paidBills && $paidBills.length > 0}
				{#each $paidBills as bill (bill.id)}
					<div class="overflow-hidden rounded-lg bg-gray-50 shadow-sm border border-gray-200 text-xs">
						<div class="h-1.5 {getCategoryColorClass(bill.category || 'Outros')}"></div>
						<div class="flex items-center p-2">
							<div class="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-gray-200 text-gray-700">
								<span class="text-base font-bold">{getDay(bill.dueDate ?? bill.paidAt ?? '')}</span>
								<span class="text-[10px] font-semibold">{getMonthAbbr(bill.dueDate ?? bill.paidAt ?? '')}</span>
							</div>
							<div class="ml-3 flex-grow">
								<p class="font-semibold text-gray-800 truncate">{bill.name || '-'}</p>
								<p class="text-gray-500 truncate">{bill.recipient || '-'}</p>
								{#if bill.note}
									<p class="italic mt-1 text-gray-500">{bill.note}</p>
								{/if}
							</div>
							<div class="px-2 text-right">
								<p class="font-bold text-gray-800">R$ {bill.amountPaid?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? bill.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '-'}</p>
								<p class="text-gray-500">Pago em {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('pt-BR') : '-'}</p>
								<p class="text-gray-500">{bill.paymentMethod || '-'}</p>
								{#if bill.installmentInfo}
									<p class="text-gray-500">{bill.installmentInfo}</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			{:else}
				<div class="text-center text-gray-400 py-8">Nenhum pagamento registrado ainda.</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Floating Action Button for adding new bill -->
{#if view === 'active'}
<div class="fixed bottom-24 right-5 z-20">
  <button
    class="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
    aria-label="Adicionar Nova Conta"
    on:click={openAddBillModal}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  </button>
</div>
{/if}

<AddBillModal bind:showModal={showAddBillModal} {billToEdit} onClose={closeAddBillModal} onBillSaved={handleBillSaved} />
<ConfirmationModal
  bind:showModal={showDeleteModal}
  title="Excluir Conta"
  message={billToDelete ? `Tem certeza que deseja excluir a conta "${billToDelete.name}"?` : ''}
  on:confirm={handleDeleteConfirmed}
  on:cancel={handleDeleteCancelled}
/>
{#if showPayModal && billToPay}
  <PayBillModal
    bind:showModal={showPayModal}
    bill={billToPay}
    paymentError={paymentError}
    on:close={closePayModal}
    on:pay={handleBillPaid}
  />
{/if}
<AddRecurringBillModal
  bind:showModal={showAddRecurringBillModal}
  on:save={handleRecurringBillSave}
  on:close={() => showAddRecurringBillModal = false}
  onClose={() => showAddRecurringBillModal = false}
/>