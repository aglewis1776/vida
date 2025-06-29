<script lang="ts">
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Transaction } from '$lib/types';
	import { v4 as uuidv4 } from 'uuid';

	export let showModal: boolean = false;
	export let transactionType: 'income' | 'expense' = 'expense';
	export let onClose: () => void;

	let amount: number | null = null;
	let description: string = '';
	let errorMessage = '';

	$: title = transactionType === 'income' ? 'Adicionar Receita' : 'Adicionar Gasto';

	async function handleSaveTransaction() {
		if (!amount || amount <= 0) {
			errorMessage = 'Por favor, insira um valor válido.';
			return;
		}
		if (!description) {
			errorMessage = 'Por favor, adicione uma descrição.';
			return;
		}
		if (!$userProfile || typeof $userProfile.cashBalance !== 'number') {
			errorMessage = 'Erro: Perfil de usuário ou saldo não encontrado.';
			return;
		}

		try {
			const newTransaction: Transaction = {
				id: uuidv4(),
				profileId: $userProfile.id,
				type: transactionType,
				amount: amount,
				description: description,
				date: new Date().toISOString()
			};
			await db.transactions.add(newTransaction);

			const newCashBalance =
				transactionType === 'income'
					? $userProfile.cashBalance + amount
					: $userProfile.cashBalance - amount;

			await db.profiles.update($userProfile.id, { cashBalance: newCashBalance });
			userProfile.update((profile) => {
				if (profile) profile.cashBalance = newCashBalance;
				return profile;
			});

			closeModal();
		} catch (error) {
			errorMessage = 'Falha ao salvar a transação.';
			console.error('Failed to save transaction:', error);
		}
	}

	function closeModal() {
		errorMessage = '';
		amount = null;
		description = '';
		onClose();
	}
</script>

{#if showModal}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-75" on:click={closeModal} role="dialog" aria-modal="true">
		<div class="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" on:click|stopPropagation>
			<h3 class="text-xl font-semibold text-gray-800">{title}</h3>
			
			<form on:submit|preventDefault={handleSaveTransaction} class="mt-4 space-y-4">
				<div>
					<label for="transaction-amount" class="block text-sm font-medium text-gray-700">Valor (R$)</label>
					<input
						type="number"
						id="transaction-amount"
						bind:value={amount}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="25.50"
						step="0.01"
					/>
				</div>
				<div>
					<label for="transaction-description" class="block text-sm font-medium text-gray-700">Descrição</label>
					<input
						type="text"
						id="transaction-description"
						bind:value={description}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder={transactionType === 'income' ? 'Ex: Venda do dia' : 'Ex: Almoço'}
					/>
				</div>

				{#if errorMessage}
					<p class="text-sm text-red-600">{errorMessage}</p>
				{/if}

				<div class="mt-6 flex justify-end space-x-3">
					<button type="button" on:click={closeModal} class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancelar</button>
					<button type="submit" class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Salvar</button>
				</div>
			</form>
		</div>
	</div>
{/if}