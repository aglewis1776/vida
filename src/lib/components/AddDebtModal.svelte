<!-- src/lib/components/AddDebtModal.svelte -->
<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Bill, Debt } from '$lib/types';

	export let showModal: boolean = false;
	export let debtToEdit: Debt | null = null;
	export let onClose: () => void;
	export let onDebtSaved: () => void;

	// Form fields
	let name: string = '';
	let lender: string = '';
	let totalBalance: number | null = null;
	let interestRate: number | null = null;
	let category: Debt['category'] = 'Outros';
	let priority: number | null = null;
	let paymentAmount: number | null = null;
	let totalInstallments: number | null = null;
	let installmentsPaid: number | null = 0;
	let paymentDueDate: number | null = null;

	let errorMessage: string = '';
	let title = 'Adicionar Nova Dívida';

	const categories: Debt['category'][] = [ 'Cartão de Crédito', 'Empréstimo Pessoal', 'Cheque Especial', 'Financiamento de Veículo', 'Financiamento Imobiliário', 'Contas Atrasadas', 'Crediário / Carnê', 'Agiota / Empréstimo Informal', 'Família / Amigos', 'Outros'];

	// Reactive block to populate form for editing
	$: {
		if (showModal && debtToEdit) {
			title = 'Editar Dívida';
			name = debtToEdit.name;
			lender = debtToEdit.lender;
			totalBalance = debtToEdit.totalBalance;
			interestRate = debtToEdit.interestRate ?? null;
			priority = debtToEdit.priority;
			category = debtToEdit.category ?? 'Outros';
			paymentAmount = debtToEdit.paymentAmount ?? null;
			totalInstallments = debtToEdit.totalInstallments ?? null;
			installmentsPaid = debtToEdit.installmentsPaid ?? 0;
			paymentDueDate = debtToEdit.paymentDueDate ?? null;
		} else {
			// When opening for a new debt, reset the form
			resetForm();
		}
	}

	function closeModal() {
		onClose();
	}

	async function handleSaveDebt() {
		if (!name || !lender || !totalBalance || !priority) {
			errorMessage = 'Todos os campos, exceto juros e plano de pagamento, são obrigatórios.';
			return;
		}

		let profileId: string | undefined;
		const unsubscribe = userProfile.subscribe((profile) => { profileId = profile?.id; });
		unsubscribe();

		if (!profileId) {
			errorMessage = 'Erro: Perfil de usuário não encontrado.';
			return;
		}

		// Save the debt first in its own try/catch block
		let savedDebtId: string;
		try {
			const debtData = { name, lender, totalBalance, interestRate: interestRate ?? undefined, priority, category, paymentAmount: paymentAmount ?? undefined, totalInstallments: totalInstallments ?? undefined, installmentsPaid: installmentsPaid ?? 0, paymentDueDate: paymentDueDate ?? undefined, isArchived: false };
			
			if (debtToEdit) {
				await db.debts.update(debtToEdit.id, debtData);
				savedDebtId = debtToEdit.id;
			} else {
				const newDebt: Debt = { id: uuidv4(), profileId, ...debtData, payments: [] };
				await db.debts.add(newDebt);
				savedDebtId = newDebt.id;
			}
		} catch (debtError) {
			errorMessage = 'Falha ao salvar a dívida principal. Tente novamente.';
			console.error('CRITICAL: Failed to save DEBT object:', debtError);
			return; // Stop execution if we can't even save the debt
		}

		// Generate bills in a separate, non-blocking try/catch
		if (paymentAmount && totalInstallments && paymentDueDate) {
			try {
				// --- THE FIX: Changed the query to be more explicit ---
				await db.bills
					.where('debtId').equals(savedDebtId)
					.and(bill => bill.isPaid === false)
					.delete();

				const billsToAdd: Bill[] = [];
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				let loopStartDate = new Date(today.getFullYear(), today.getMonth(), paymentDueDate);
				if (loopStartDate < today) {
					loopStartDate.setMonth(loopStartDate.getMonth() + 1);
				}
				
				const remainingInstallments = totalInstallments - (installmentsPaid || 0);

				for (let i = 0; i < remainingInstallments; i++) {
					const installmentDate = new Date(loopStartDate);
					installmentDate.setMonth(loopStartDate.getMonth() + i);

					const bill: Bill = {
						id: uuidv4(),
						profileId: profileId,
						name: `${name} - Parcela ${(installmentsPaid || 0) + i + 1}`,
						recipient: lender,
						amount: paymentAmount,
						dueDate: installmentDate.toISOString().split('T')[0],
						isPaid: false,
						debtId: savedDebtId
					};
					billsToAdd.push(bill);
				}

				if (billsToAdd.length > 0) {
					await db.bills.bulkAdd(billsToAdd);
				}

			} catch (billError) {
				// Log the error but don't stop the UI from closing
				console.error('NON-CRITICAL: Failed to auto-generate bills, but the debt was saved.', billError);
			}
		}
		
		onDebtSaved();
		closeModal();
	}

	function resetForm() {
		title = 'Adicionar Nova Dívida';
		name = '';
		lender = '';
		totalBalance = null;
		interestRate = null;
		priority = null;
		category = 'Outros';
		paymentAmount = null;
		totalInstallments = null;
		installmentsPaid = 0;
		paymentDueDate = null;
		errorMessage = '';
		debtToEdit = null;
	}
</script>

{#if showModal}
<div class="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-75" on:click={closeModal} role="dialog" aria-modal="true">
	<div class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl" on:click|stopPropagation>
		<h3 class="text-xl font-semibold text-gray-800">{title}</h3>
		<form on:submit|preventDefault={handleSaveDebt} class="mt-4 space-y-4">
			<!-- Form fields remain the same -->
			<div>
				<label for="debt-name" class="block text-sm font-medium text-gray-700">Nome da Dívida</label>
				<input type="text" id="debt-name" bind:value={name} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Ex: Financiamento do Carro" />
			</div>
			<div>
				<label for="category" class="block text-sm font-medium text-gray-700">Categoria</label>
				<select id="category" bind:value={category} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
					{#each categories as cat}<option value={cat}>{cat}</option>{/each}
				</select>
			</div>
			<div>
				<label for="lender" class="block text-sm font-medium text-gray-700">Credor</label>
				<input type="text" id="lender" bind:value={lender} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Ex: Banco Itaú" />
			</div>
			<div>
				<label for="total-balance" class="block text-sm font-medium text-gray-700">Saldo Total (R$)</label>
				<input type="number" id="total-balance" bind:value={totalBalance} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="15000.00" step="0.01" />
			</div>
			<div>
				<label for="interest-rate" class="block text-sm font-medium text-gray-700">Taxa de Juros Anual (%) (Opcional)</label>
				<input type="number" id="interest-rate" bind:value={interestRate} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="12.5" step="0.1" />
			</div>
			<div>
				<label for="priority" class="block text-sm font-medium text-gray-700">Prioridade da Dívida</label>
				<input type="number" id="priority" bind:value={priority} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="1 (mais importante)" min="1" />
			</div>
			
			<div class="space-y-4 rounded-md border border-gray-200 p-4">
				<h4 class="font-medium text-gray-800">Plano de Pagamento (Opcional)</h4>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="payment-amount" class="block text-sm font-medium text-gray-700">Valor da Parcela</label>
						<input type="number" id="payment-amount" bind:value={paymentAmount} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="450.50" step="0.01" />
					</div>
					<div>
						<label for="payment-due-date" class="block text-sm font-medium text-gray-700">Dia do Vencimento</label>
						<input type="number" id="payment-due-date" bind:value={paymentDueDate} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="10" min="1" max="31" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="total-installments" class="block text-sm font-medium text-gray-700">Total de Parcelas</label>
						<input type="number" id="total-installments" bind:value={totalInstallments} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="48" min="1" />
					</div>
					<div>
						<label for="installments-paid" class="block text-sm font-medium text-gray-700">Parcelas Pagas</label>
						<input type="number" id="installments-paid" bind:value={installmentsPaid} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" placeholder="0" min="0" />
					</div>
				</div>
			</div>

			{#if errorMessage} <p class="text-sm text-red-600">{errorMessage}</p> {/if}
			<div class="mt-6 flex justify-end space-x-3">
				<button type="button" on:click={closeModal} class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancelar</button>
				<button type="submit" class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Salvar Dívida</button>
			</div>
		</form>
	</div>
</div>
{/if}
