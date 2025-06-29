<!-- src/lib/components/AddDebtModal.svelte -->
<script lang="ts">
	// UPDATED: onMount is no longer needed for this logic
	import { v4 as uuidv4 } from 'uuid';
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Debt } from '$lib/types';

	export let showModal: boolean = false;
	export let debtToEdit: Debt | null = null;
	export let onClose: () => void;
	export let onDebtSaved: () => void;

	let name: string = '';
	let lender: string = '';
	let totalBalance: number | null = null;
	let interestRate: number | null = null;
	let category: Debt['category'] = 'Outros';
	let priority: number | null = null;
	let errorMessage: string = '';
	let title = 'Adicionar Nova Dívida';

	const categories: Debt['category'][] = [
		'Cartão de Crédito',
		'Empréstimo Pessoal',
		'Cheque Especial',
		'Financiamento de Veículo',
		'Financiamento Imobiliário',
		'Contas Atrasadas',
		'Crediário / Carnê',
		'Agiota / Empréstimo Informal',
		'Família / Amigos',
		'Outros'
	];

	// --- REACTIVE BLOCK (THE FIX) ---
	// This code now runs automatically whenever `debtToEdit` changes.
	$: {
		if (debtToEdit) {
			// If we are editing, populate the form
			title = 'Editar Dívida';
			name = debtToEdit.name;
			lender = debtToEdit.lender;
			totalBalance = debtToEdit.totalBalance;
			interestRate = debtToEdit.interestRate ?? null;
			priority = debtToEdit.priority;
			category = debtToEdit.category ?? 'Outros';
		} else {
			// If we are adding a new debt, ensure the form is blank
			title = 'Adicionar Nova Dívida';
			name = '';
			lender = '';
			totalBalance = null;
			interestRate = null;
			priority = null;
			category = 'Outros';
			errorMessage = '';
		}
	}

	function closeModal() {
		onClose();
	}

	async function handleSaveDebt() {
		if (!name || !lender || !totalBalance || !priority) {
			errorMessage = 'Todos os campos, exceto juros, são obrigatórios.';
			return;
		}

		let profileId: string | undefined;
		const unsubscribe = userProfile.subscribe((profile) => {
			profileId = profile?.id;
		});
		unsubscribe();

		if (!profileId) {
			errorMessage = 'Erro: Perfil de usuário não encontrado.';
			return;
		}

		try {
			const debtData = { name, lender, totalBalance, interestRate: interestRate ?? undefined, priority, category };

			if (debtToEdit) {
				await db.debts.update(debtToEdit.id, debtData);
			} else {
				const newDebt: Debt = { id: uuidv4(), profileId, ...debtData, payments: [] };
				await db.debts.add(newDebt);
			}

			onDebtSaved();
			closeModal();
		} catch (error) {
			errorMessage = 'Falha ao salvar a dívida. Tente novamente.';
			console.error('Failed to save debt:', error);
		}
	}
</script>

{#if showModal}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-75" on:click={closeModal} role="dialog" aria-modal="true">
		<div class="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" on:click|stopPropagation>
			<h3 class="text-xl font-semibold text-gray-800">{title}</h3>
			<form on:submit|preventDefault={handleSaveDebt} class="mt-4 space-y-4">
				<div>
					<label for="debt-name" class="block text-sm font-medium text-gray-700">Nome da Dívida</label>
					<input type="text" id="debt-name" bind:value={name} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Ex: Cartão de Crédito Nubank" />
				</div>
				<div>
					<label for="category" class="block text-sm font-medium text-gray-700">Categoria</label>
					<select id="category" bind:value={category} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="lender" class="block text-sm font-medium text-gray-700">Credor</label>
					<input type="text" id="lender" bind:value={lender} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Ex: Nubank" />
				</div>
				<div>
					<label for="total-balance" class="block text-sm font-medium text-gray-700">Saldo Total (R$)</label>
					<input type="number" id="total-balance" bind:value={totalBalance} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="2500.00" step="0.01" />
				</div>
				<div>
					<label for="interest-rate" class="block text-sm font-medium text-gray-700">Taxa de Juros Anual (%) (Opcional)</label>
					<input type="number" id="interest-rate" bind:value={interestRate} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="14.9" step="0.1" />
				</div>
				<div>
					<label for="priority" class="block text-sm font-medium text-gray-700">Prioridade da Dívida</label>
					<input type="number" id="priority" bind:value={priority} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="1 (mais importante)" min="1" />
					<p class="mt-1 text-xs text-gray-500">Use 1 para a dívida mais urgente, 2 para a próxima, e assim por diante.</p>
				</div>
				{#if errorMessage}
					<p class="text-sm text-red-600">{errorMessage}</p>
				{/if}
				<div class="mt-6 flex justify-end space-x-3">
					<button type="button" on:click={closeModal} class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancelar</button>
					<button type="submit" class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Salvar Dívida</button>
				</div>
			</form>
		</div>
	</div>
{/if}
