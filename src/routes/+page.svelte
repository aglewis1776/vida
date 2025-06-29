<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Bill } from '$lib/types';
	import { liveQuery } from 'dexie';

	import AddBillModal from '$lib/components/AddBillModal.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	let showAddBillModal = false;
	let showDeleteConfirm = false;
	let billToEdit: Bill | null = null;
	let billToDelete: Bill | null = null;

	let allBills = liveQuery<Bill[]>(async () => {
		const profile = $userProfile;
		if (!profile) return [];
		return await db.bills
			.where('profileId').equals(profile.id)
			.and(bill => bill.isPaid === false)
			.sortBy('dueDate');
	});

	let overdue: Bill[] = [];
	let dueToday: Bill[] = [];
	let dueTomorrow: Bill[] = [];
	let next7Days: Bill[] = [];
	let upcoming: Bill[] = [];

	$: {
		if ($allBills) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);

			const sevenDaysFromNow = new Date(today);
			sevenDaysFromNow.setDate(today.getDate() + 7);

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
				} else if (dueDate <= sevenDaysFromNow) {
					next7Days.push(bill);
				} else {
					upcoming.push(bill);
				}
			}
		}
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
	
	function handleAddIncomeClick() { console.log('Add Income clicked.'); }

	function promptForDelete(bill: Bill) {
		billToDelete = bill;
		showDeleteConfirm = true;
	}

	async function handleDeleteConfirm() {
		if (!billToDelete) return;
		await db.bills.delete(billToDelete.id);
		closeDeleteConfirm();
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		billToDelete = null;
	}

	function getDay(dateString: string): string {
		const date = new Date(dateString + 'T00:00:00');
		return date.toLocaleDateString('pt-BR', { day: 'numeric' });
	}

	function getMonthAbbr(dateString: string): string {
		const date = new Date(dateString + 'T00:00:00');
		return date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
	}
</script>

<div class="space-y-6">
	<!-- Overdue Section -->
	{#if overdue.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-red-600">Vencidas</h3>
			{#each overdue as bill (bill.id)}
				<div class="flex items-center rounded-lg bg-white p-2 shadow-sm">
					<div class="flex h-14 w-14 flex-col items-center justify-center rounded-md bg-red-100 text-red-700">
						<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
						<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
					</div>
					<div class="ml-4 flex-grow">
						<p class="font-semibold text-gray-800">{bill.name}</p>
						<p class="text-sm text-gray-500">{bill.recipient}</p>
					</div>
					<div class="px-4 text-right">
						<p class="text-lg font-bold text-red-600">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
					</div>
					<!-- ACTION BUTTONS -->
					<div class="flex items-center space-x-1 pl-2">
						<button on:click={() => openEditBillModal(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
						<button on:click={() => promptForDelete(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Other sections have the same new structure -->
	{#if dueToday.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-orange-500">Vence Hoje</h3>
			{#each dueToday as bill (bill.id)}
				<div class="flex items-center rounded-lg bg-white p-2 shadow-sm">
					<div class="flex h-14 w-14 flex-col items-center justify-center rounded-md bg-orange-100 text-orange-700">
						<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
						<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
					</div>
					<div class="ml-4 flex-grow">
						<p class="font-semibold text-gray-800">{bill.name}</p>
						<p class="text-sm text-gray-500">{bill.recipient}</p>
					</div>
					<div class="px-4 text-right">
						<p class="text-lg font-bold text-gray-800">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
					</div>
					<div class="flex items-center space-x-1 pl-2">
						<button on:click={() => openEditBillModal(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
						<button on:click={() => promptForDelete(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if dueTomorrow.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-yellow-500">Vence Amanhã</h3>
			{#each dueTomorrow as bill (bill.id)}
				<div class="flex items-center rounded-lg bg-white p-2 shadow-sm">
					<div class="flex h-14 w-14 flex-col items-center justify-center rounded-md bg-yellow-100 text-yellow-700">
						<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
						<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
					</div>
					<div class="ml-4 flex-grow">
						<p class="font-semibold text-gray-800">{bill.name}</p>
						<p class="text-sm text-gray-500">{bill.recipient}</p>
					</div>
					<div class="px-4 text-right">
						<p class="text-lg font-bold text-gray-800">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
					</div>
					<div class="flex items-center space-x-1 pl-2">
						<button on:click={() => openEditBillModal(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
						<button on:click={() => promptForDelete(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if next7Days.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-blue-600">Próximos 7 Dias</h3>
			{#each next7Days as bill (bill.id)}
				<div class="flex items-center rounded-lg bg-white p-2 shadow-sm">
					<div class="flex h-14 w-14 flex-col items-center justify-center rounded-md bg-blue-100 text-blue-700">
						<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
						<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
					</div>
					<div class="ml-4 flex-grow">
						<p class="font-semibold text-gray-800">{bill.name}</p>
						<p class="text-sm text-gray-500">{bill.recipient}</p>
					</div>
					<div class="px-4 text-right">
						<p class="text-lg font-bold text-gray-800">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
					</div>
					<div class="flex items-center space-x-1 pl-2">
						<button on:click={() => openEditBillModal(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
						<button on:click={() => promptForDelete(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if upcoming.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-green-600">Próximas</h3>
			{#each upcoming as bill (bill.id)}
				<div class="flex items-center rounded-lg bg-white p-2 shadow-sm">
					<div class="flex h-14 w-14 flex-col items-center justify-center rounded-md bg-green-100 text-green-700">
						<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
						<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
					</div>
					<div class="ml-4 flex-grow">
						<p class="font-semibold text-gray-800">{bill.name}</p>
						<p class="text-sm text-gray-500">{bill.recipient}</p>
					</div>
					<div class="px-4 text-right">
						<p class="text-lg font-bold text-gray-800">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
					</div>
					<div class="flex items-center space-x-1 pl-2">
						<button on:click={() => openEditBillModal(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
						<button on:click={() => promptForDelete(bill)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if !$allBills || $allBills.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
			<p class="text-gray-500">Nenhuma conta cadastrada.</p>
			<p class="mt-1 text-sm text-gray-400">Clique no botão '-' para adicionar sua primeira conta.</p>
		</div>
	{/if}
</div>

<div class="fixed bottom-20 right-4 z-20 flex flex-col space-y-3">
	<button on:click={openAddBillModal} class="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2" aria-label="Adicionar Nova Conta/Despesa"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" /></svg></button>
	<button on:click={handleAddIncomeClick} class="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2" aria-label="Adicionar Nova Receita"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button>
</div>

<AddBillModal bind:showModal={showAddBillModal} {billToEdit} onClose={closeAddBillModal} onBillSaved={handleBillSaved} />

<ConfirmationModal
	bind:showModal={showDeleteConfirm}
	title="Confirmar Exclusão"
	message="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
	on:confirm={handleDeleteConfirm}
	on:cancel={closeDeleteConfirm}
/>
