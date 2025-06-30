<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Bill } from '$lib/types';

	export let showModal: boolean = false;
	export let billToEdit: Bill | null = null;
	export let onClose: () => void;
	export let onBillSaved: () => void;

	let name: string = '';
	let recipient: string = '';
	let amount: number | null = null;
	let dueDate: string = '';
	let category: Bill['category'] = 'Moradia';
	let lateFee: number | null = null;
	let errorMessage: string = '';
	let title = 'Nova Conta Avulsa'; // Default title in Portuguese

	const billCategories: Bill['category'][] = [
		'Moradia', 'Transporte', 'Alimentação', 'Saúde',
		'Educação', 'Lazer', 'Impostos e Taxas',
		'Outros'
	];

	// This reactive block correctly pre-fills the form for editing
	$: if (showModal && billToEdit) {
		title = 'Editar Conta';
		name = billToEdit.name;
		recipient = billToEdit.recipient;
		amount = billToEdit.amount;
		dueDate = new Date(billToEdit.dueDate).toISOString().split('T')[0];
		category = billToEdit.category ?? 'Moradia';
		lateFee = billToEdit.lateFee ?? null;
	} else {
		title = 'Nova Conta Avulsa';
		lateFee = null;
		category = 'Moradia';
	}

	function closeModal() {
		resetForm();
		onClose();
	}

	async function handleSaveBill() {
		if (!name || !amount || !dueDate) {
			errorMessage = 'Por favor, preencha nome, valor e data de vencimento.';
			return;
		}
		if (!$userProfile) {
			errorMessage = 'Erro: Perfil de usuário não encontrado.';
			return;
		}

		try {
			const billData = { name, recipient, amount, dueDate, category, isPaid: false, lateFee };

			if (billToEdit) {
				await db.bills.update(billToEdit.id, billData);
			} else {
				await db.bills.add({ id: uuidv4(), profileId: $userProfile.id, ...billData });
			}
			onBillSaved();
			closeModal();
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
		category = 'Moradia';
		lateFee = null;
		errorMessage = '';
		billToEdit = null;
	}
</script>

{#if showModal}
<div class="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-75" on:click={closeModal} role="dialog" aria-modal="true">
    <div class="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" on:click|stopPropagation>
        <h3 class="text-xl font-semibold text-gray-800">{title}</h3>
        
        <form on:submit|preventDefault={handleSaveBill} class="mt-4 space-y-4">
            <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Nome da Conta</label>
                <input type="text" id="name" bind:value={name} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Ex: Conta de Luz" />
            </div>

            <div>
                <label for="bill-category" class="block text-sm font-medium text-gray-700">Categoria</label>
                <select id="bill-category" bind:value={category} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    {#each billCategories as cat}
                        <option value={cat}>{cat}</option>
                    {/each}
                </select>
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

            <div>
                <label for="lateFee" class="block text-sm font-medium text-gray-700">Multa por atraso (R$)</label>
                <input type="number" id="lateFee" bind:value={lateFee} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="0.00" step="0.01" min="0" />
            </div>
            
            {#if errorMessage}
                <p class="text-sm text-red-600">{errorMessage}</p>
            {/if}
            
            <div class="mt-6 flex justify-end space-x-3">
                <button type="button" on:click={closeModal} class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancelar</button>
                <button type="submit" class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Salvar Conta</button>
            </div>
        </form>
    </div>
</div>
{/if}