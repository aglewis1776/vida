<!-- src/lib/components/AddBillModal.svelte -->
<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Bill } from '$lib/types';

	// --- Component Properties (Props) ---
	export let showModal: boolean = false;
	// NEW: Callback functions passed from the parent
	export let onClose: () => void;
	export let onBillSaved: () => void;

	// --- Form Fields ---
	let name: string = '';
	let recipient: string = '';
	let amount: number | null = null;
	let dueDate: string = '';
	let errorMessage: string = '';

	// This function now directly calls the 'onClose' prop from the parent
	function closeModal() {
		onClose();
	}

	async function handleSaveBill() {
		if (!name || !recipient || !amount || !dueDate) {
			errorMessage = 'Por favor, preencha todos os campos.';
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
			const newBill: Bill = {
				id: uuidv4(),
				profileId,
				name,
				recipient,
				amount,
				dueDate,
				isPaid: false
			};
			await db.bills.add(newBill);
			
			// NEW: Call the onBillSaved function from the parent
			onBillSaved();
			resetForm();
			closeModal(); // Also calls the onClose function
		} catch (error) {
			errorMessage = 'Falha ao salvar a conta. Tente novamente.';
			console.error('Failed to save bill:', error);
		}
	}

	function resetForm() {
		name = '';
		recipient = '';
		amount = null;
		dueDate = '';
		errorMessage = '';
	}
</script>

{#if showModal}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-75" on:click={closeModal} role="dialog" aria-modal="true">
		<div class="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" on:click|stopPropagation>
			<h3 class="text-xl font-semibold text-gray-800">Adicionar Nova Conta</h3>
			<form on:submit|preventDefault={handleSaveBill} class="mt-4 space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700">Nome da Conta</label>
					<input type="text" id="name" bind:value={name} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Ex: Conta de Luz" />
				</div>
				<div>
					<label for="recipient" class="block text-sm font-medium text-gray-700">Para quem pagar (Destinatário)</label>
					<input type="text" id="recipient" bind:value={recipient} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Ex: CPFL Energia" />
				</div>
				<div>
					<label for="amount" class="block text-sm font-medium text-gray-700">Valor (R$)</label>
					<input type="number" id="amount" bind:value={amount} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="150.75" step="0.01" />
				</div>
				<div>
					<label for="dueDate" class="block text-sm font-medium text-gray-700">Data de Vencimento</label>
					<input type="date" id="dueDate" bind:value={dueDate} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
				</div>
				{#if errorMessage}
				<p class="text-sm text-red-600">{errorMessage}</p>
				{/if}
				<div class="mt-6 flex justify-end space-x-3">
					<button type="button" on:click={closeModal} class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancelar</button>
					<button type="submit" class="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Salvar Conta</button>
				</div>
			</form>
		</div>
	</div>
{/if}
