<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Bill } from '$lib/types';
	import { liveQuery } from 'dexie';

	import AddBillModal from '$lib/components/AddBillModal.svelte';

	let showAddBillModal = false;

	let bills = liveQuery<Bill[]>(async () => {
		const profile = $userProfile;
		if (!profile) return [];
		return await db.bills.where('profileId').equals(profile.id).sortBy('dueDate');
	});

	function openAddBillModal() {
		showAddBillModal = true;
	}

	function closeAddBillModal() {
		showAddBillModal = false;
	}

	function handleBillSaved() {
		console.log('Bill was saved. The list will update automatically.');
	}

	function handleAddIncomeClick() {
		console.log('Add Income button clicked. This feature will be implemented in a future phase.');
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-bold text-gray-700">Próximas Contas</h2>
		<span class="text-sm font-medium text-gray-500">{$bills?.length || 0} contas</span>
	</div>

	<div class="space-y-3">
		{#if $bills && $bills.length > 0}
			{#each $bills as bill (bill.id)}
				<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
					<div class="flex items-center justify-between">
						<div>
							<p class="font-semibold text-gray-800">{bill.name}</p>
							<p class="text-sm text-gray-500">{bill.recipient}</p>
						</div>
						<div class="text-right">
							<p class="text-lg font-bold text-red-600">
								R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
							</p>
							<p class="text-xs text-gray-500">
								Vence em: {new Date(bill.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
							</p>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
				<p class="text-gray-500">Nenhuma conta cadastrada.</p>
				<p class="mt-1 text-sm text-gray-400">Clique no botão '-' para adicionar sua primeira conta.</p>
			</div>
		{/if}
	</div>
</div>

<div class="fixed bottom-20 right-4 z-20 flex flex-col space-y-3">
	<button
		on:click={openAddBillModal}
		class="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
		aria-label="Adicionar Nova Conta/Despesa"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
		</svg>
	</button>

	<button
		on:click={handleAddIncomeClick}
		class="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
		aria-label="Adicionar Nova Receita"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-8 w-8"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2.5"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
		</svg>
	</button>
</div>

<!-- UPDATED: Pass functions as props instead of listening for events -->
<AddBillModal 
	bind:showModal={showAddBillModal} 
	onClose={closeAddBillModal} 
	onBillSaved={handleBillSaved} 
/>
