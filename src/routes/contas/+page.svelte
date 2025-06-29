<script lang="ts">
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Bill, Debt } from '$lib/types';
	import { liveQuery } from 'dexie';
	import { addDays } from 'date-fns';
	import { writable } from 'svelte/store';

	import AddBillModal from '$lib/components/AddBillModal.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import Button from '@smui/button';
	import Fab from '@smui/fab';
	import Dialog from '@smui/dialog';

	interface BillWithInstallment extends Bill {
		installmentInfo?: string;
	}

	let showAddBillModal = false;
	let showDeleteConfirm = false;
	let billToEdit: Bill | null = null;
	let billToDelete: Bill | null = null;

	const showAll = writable(false);

	$: allBills = liveQuery<BillWithInstallment[]>(async () => {
		const profile = $userProfile;
		if (!profile) return [];

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const limitDate = addDays(today, 45);

		let collection = db.bills.where('profileId').equals(profile.id).and(bill => bill.isPaid === false);

		if (!$showAll) {
			collection = collection.filter(bill => {
				const dueDate = new Date(bill.dueDate + 'T00:00:00');
				return dueDate < today || (dueDate >= today && dueDate < limitDate);
			});
		}

		const bills = await collection.sortBy('dueDate');

		const billsWithDetails: BillWithInstallment[] = await Promise.all(
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
		return billsWithDetails;
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

	function toggleShowAll() {
		showAll.set(true);
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
    
    // NEW: Placeholder function for paying with Pix
    function handlePayWithPix(bill: Bill) {
        console.log('Pagar com Pix clicked for:', bill.name);
        // We will implement the actual payment logic here in a future step
        alert(`Funcionalidade "Pagar com Pix" para ${bill.name} ainda não implementada.`);
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
	{#if overdue.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-red-600">Vencidas</h3>
			{#each overdue as bill (bill.id)}
				<div class="overflow-hidden rounded-lg bg-white shadow-sm">
					<div class="h-1.5 {getCategoryColorClass(bill.category)}"></div>
					<div class="flex items-center p-3">
						<div class="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-red-100 text-red-700">
							<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
							<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
						</div>
						<div class="ml-4 flex-grow">
							<p class="font-semibold text-gray-800">{bill.name}</p>
							<p class="text-sm text-gray-500">{bill.recipient}</p>
						</div>
						<div class="px-4 text-right">
							<p class="text-lg font-bold text-red-600">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
							{#if bill.installmentInfo}
								<p class="text-xs text-gray-500">{bill.installmentInfo}</p>
							{/if}
						</div>
						<div class="flex items-center space-x-2 pl-2">
							<button on:click={() => handlePayWithPix(bill)} class="btn btn-sm btn-primary">Pagar</button>
							<button on:click={() => openEditBillModal(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
							<button on:click={() => promptForDelete(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if dueToday.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-orange-500">Vence Hoje</h3>
			{#each dueToday as bill (bill.id)}
				<div class="overflow-hidden rounded-lg bg-white shadow-sm">
					<div class="h-1.5 {getCategoryColorClass(bill.category)}"></div>
					<div class="flex items-center p-3">
						<div class="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-orange-100 text-orange-700">
							<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
							<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
						</div>
						<div class="ml-4 flex-grow">
							<p class="font-semibold text-gray-800">{bill.name}</p>
							<p class="text-sm text-gray-500">{bill.recipient}</p>
						</div>
						<div class="px-4 text-right">
							<p class="text-lg font-bold text-gray-800">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
							{#if bill.installmentInfo}
								<p class="text-xs text-gray-500">{bill.installmentInfo}</p>
							{/if}
						</div>
						<div class="flex items-center space-x-2 pl-2">
							<button on:click={() => handlePayWithPix(bill)} class="btn btn-sm btn-primary">Pagar</button>
							<button on:click={() => openEditBillModal(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
							<button on:click={() => promptForDelete(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if dueTomorrow.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-yellow-500">Vence Amanhã</h3>
			{#each dueTomorrow as bill (bill.id)}
				<div class="overflow-hidden rounded-lg bg-white shadow-sm">
					<div class="h-1.5 {getCategoryColorClass(bill.category)}"></div>
					<div class="flex items-center p-3">
						<div class="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-yellow-100 text-yellow-700">
							<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
							<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
						</div>
						<div class="ml-4 flex-grow">
							<p class="font-semibold text-gray-800">{bill.name}</p>
							<p class="text-sm text-gray-500">{bill.recipient}</p>
						</div>
						<div class="px-4 text-right">
							<p class="text-lg font-bold text-gray-800">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
							{#if bill.installmentInfo}
								<p class="text-xs text-gray-500">{bill.installmentInfo}</p>
							{/if}
						</div>
						<div class="flex items-center space-x-2 pl-2">
							<button on:click={() => handlePayWithPix(bill)} class="btn btn-sm btn-primary">Pagar</button>
							<button on:click={() => openEditBillModal(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
							<button on:click={() => promptForDelete(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if next7Days.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-blue-600">Próximos 7 Dias</h3>
			{#each next7Days as bill (bill.id)}
				<div class="overflow-hidden rounded-lg bg-white shadow-sm">
					<div class="h-1.5 {getCategoryColorClass(bill.category)}"></div>
					<div class="flex items-center p-3">
						<div class="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-blue-100 text-blue-700">
							<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
							<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
						</div>
						<div class="ml-4 flex-grow">
							<p class="font-semibold text-gray-800">{bill.name}</p>
							<p class="text-sm text-gray-500">{bill.recipient}</p>
						</div>
						<div class="px-4 text-right">
							<p class="text-lg font-bold text-gray-800">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
							{#if bill.installmentInfo}
								<p class="text-xs text-gray-500">{bill.installmentInfo}</p>
							{/if}
						</div>
						<div class="flex items-center space-x-2 pl-2">
							<button on:click={() => handlePayWithPix(bill)} class="btn btn-sm btn-primary">Pagar</button>
							<button on:click={() => openEditBillModal(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
							<button on:click={() => promptForDelete(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if upcoming.length > 0}
		<div class="space-y-3">
			<h3 class="font-bold text-green-600">Próximas</h3>
			{#each upcoming as bill (bill.id)}
				<div class="overflow-hidden rounded-lg bg-white shadow-sm">
					<div class="h-1.5 {getCategoryColorClass(bill.category)}"></div>
					<div class="flex items-center p-3">
						<div class="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-green-100 text-green-700">
							<span class="text-xl font-bold">{getDay(bill.dueDate)}</span>
							<span class="text-xs font-semibold">{getMonthAbbr(bill.dueDate)}</span>
						</div>
						<div class="ml-4 flex-grow">
							<p class="font-semibold text-gray-800">{bill.name}</p>
							<p class="text-sm text-gray-500">{bill.recipient}</p>
						</div>
						<div class="px-4 text-right">
							<p class="text-lg font-bold text-gray-800">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
							{#if bill.installmentInfo}
								<p class="text-xs text-gray-500">{bill.installmentInfo}</p>
							{/if}
						</div>
						<div class="flex items-center space-x-2 pl-2">
							<button on:click={() => handlePayWithPix(bill)} class="btn btn-sm btn-primary">Pagar</button>
							<button on:click={() => openEditBillModal(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
							<button on:click={() => promptForDelete(bill)} class="btn btn-xs btn-ghost btn-circle"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
	
	{#if !$showAll && $allBills && $allBills.length > 0}
		<div class="text-center pt-4">
			<button on:click={toggleShowAll} class="btn btn-ghost text-primary-focus">
				Mostrar todas as contas
			</button>
		</div>
	{/if}

	{#if !$allBills || $allBills.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
			<p class="text-gray-500">Nenhuma conta cadastrada.</p>
			<Button variant="raised" color="primary" on:click={openAddBillModal}>
				Adicionar sua primeira conta
			</Button>
		</div>
	{/if}
</div>

<!-- Example: Replace the floating action button with SMUI Fab -->
<div class="fixed bottom-24 right-5 z-20">
  <Fab color="primary" variant="regular" aria-label="Adicionar Nova Conta" on:click={openAddBillModal}>
    <svg slot="icon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  </Fab>
</div>

<AddBillModal bind:showModal={showAddBillModal} {billToEdit} onClose={closeAddBillModal} onBillSaved={handleBillSaved} />

<Dialog bind:open={showDeleteConfirm}>
  <h2 class="mdc-dialog__title">Confirmar Exclusão</h2>
  <div class="mdc-dialog__content">
    Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
  </div>
  <div class="mdc-dialog__actions">
    <Button variant="text" on:click={closeDeleteConfirm}>Cancelar</Button>
    <Button variant="raised" color="error" on:click={handleDeleteConfirm}>Excluir</Button>
  </div>
</Dialog>