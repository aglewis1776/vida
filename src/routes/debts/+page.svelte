<!-- src/routes/debts/+page.svelte -->
<script lang="ts">
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Debt } from '$lib/types';
	import { liveQuery } from 'dexie';

	import AddDebtModal from '$lib/components/AddDebtModal.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	let showAddEditModal = false;
	let debtToEdit: Debt | null = null;
	let showDeleteConfirm = false;
	let debtToDelete: Debt | null = null;

	let debts = liveQuery<Debt[]>(async () => {
		const profile = $userProfile;
		if (!profile) return [];
		
		// THE FIX: This query now correctly filters out archived debts
		// by checking where `isArchived` is not explicitly `true`.
		// This handles cases where the field is `false` or doesn't exist yet.
		return await db.debts
			.where('profileId').equals(profile.id)
			.and(debt => debt.isArchived !== true)
			.sortBy('priority');
	});

	function openAddModal() {
		debtToEdit = null;
		showAddEditModal = true;
	}

	function openEditModal(debt: Debt) {
		debtToEdit = debt;
		showAddEditModal = true;
	}

	function closeAddEditModal() {
		showAddEditModal = false;
		debtToEdit = null;
	}

	function handleDebtSaved() {
		console.log('Debt was saved. The list has been updated.');
	}

	function promptForDelete(debt: Debt) {
		debtToDelete = debt;
		showDeleteConfirm = true;
	}

	async function handleDeleteConfirm() {
		if (!debtToDelete) return;
		try {
			await db.debts.delete(debtToDelete.id);
		} catch (error) {
			console.error('Failed to delete debt:', error);
		}
		closeDeleteConfirm();
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		debtToDelete = null;
	}

	function getCategoryColor(category: Debt['category']) {
		switch (category) {
			case 'Cartão de Crédito': return 'bg-red-500';
			case 'Empréstimo Pessoal': return 'bg-purple-500';
			case 'Cheque Especial': return 'bg-yellow-500';
			case 'Financiamento de Veículo': return 'bg-blue-500';
			case 'Financiamento Imobiliário': return 'bg-green-600';
			case 'Contas Atrasadas': return 'bg-amber-600';
			case 'Crediário / Carnê': return 'bg-pink-500';
			case 'Agiota / Empréstimo Informal': return 'bg-black';
			case 'Família / Amigos': return 'bg-teal-500';
			default: return 'bg-gray-500';
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-bold text-gray-700">Minhas Dívidas</h2>
		<span class="text-sm font-medium text-gray-500">{$debts?.length || 0} dívidas</span>
	</div>

	<div class="space-y-4">
		{#if $debts && $debts.length > 0}
			{#each $debts as debt (debt.id)}
				<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
					{#if debt.category}
						<div class="px-4 py-1 text-left font-semibold text-white {getCategoryColor(debt.category)}">{debt.category}</div>
					{/if}
					
					<div class="p-4">
						<div class="flex items-start justify-between">
							<div class="flex-grow">
								<div class="flex items-center space-x-3">
									<div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
										<span class="text-sm font-bold text-gray-700">{debt.priority}</span>
									</div>
									<p class="text-lg font-bold text-gray-800">{debt.name}</p>
								</div>
								<div class="mt-2 pl-9">
									<p class="text-sm text-gray-600">Credor: {debt.lender}</p>
									{#if debt.interestRate}
										<p class="text-xs text-gray-500">Juros: {debt.interestRate}% ao ano</p>
									{/if}
								</div>
							</div>
							<div class="flex flex-col items-end pl-4">
								<p class="text-xl font-bold text-gray-800">
									R$ {debt.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
								</p>
								<!-- NEW: Display payment plan info -->
								{#if debt.paymentAmount && debt.totalInstallments}
									<div class="mt-1 text-right">
										<p class="text-sm font-medium text-gray-700">
											R$ {debt.paymentAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})} / mês
										</p>
										<p class="text-xs text-gray-500">
											Parcela {debt.installmentsPaid || 0} de {debt.totalInstallments}
										</p>
									</div>
								{/if}
								<div class="mt-2 flex items-center space-x-2">
									<button on:click={() => openEditModal(debt)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600" aria-label="Editar Dívida">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
									</button>
									<button on:click={() => promptForDelete(debt)} class="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600" aria-label="Excluir Dívida">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
				<p class="text-gray-500">Nenhuma dívida cadastrada.</p>
				<p class="mt-1 text-sm text-gray-400">Clique no botão '+' para adicionar sua primeira dívida.</p>
			</div>
		{/if}
	</div>
</div>

<div class="fixed bottom-20 right-4 z-20">
	<button on:click={openAddModal} class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Adicionar Nova Dívida">
		<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
	</button>
</div>

<AddDebtModal bind:showModal={showAddEditModal} {debtToEdit} onClose={closeAddEditModal} onDebtSaved={handleDebtSaved} />
<ConfirmationModal bind:showModal={showDeleteConfirm} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita." on:confirm={handleDeleteConfirm} on:cancel={closeDeleteConfirm} />
