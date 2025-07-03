<script lang="ts">
	import { page } from '$app/stores';
	import { db } from '$lib/db';
	import { goto } from '$app/navigation';
	import type { Bill } from '$lib/types';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import PayBillModal from '$lib/components/PayBillModal.svelte';

	let bill: Bill | null = null;
	let loading = true;
	let showDeleteModal = false;
	let showPayModal = false;
	let paymentError: string | null = null;

	// Use $: to reactively get the id from $page
	$: id = $page.params.id;

	// A helper to check for overdue status
	function isOverdue(bill: Bill): boolean {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return !bill.isPaid && new Date(bill.dueDate) < today;
	}

	// Reactively load the bill when id changes
	$: if (id) {
		loading = true;
		let key: string | number = id;
		if (!isNaN(Number(id)) && id.trim() !== '') {
			key = Number(id);
		}
		db.bills
			.get(key)
			.then((result) => {
				bill = result ?? null;
				loading = false;
			})
			.catch((e) => {
				console.error('Failed to get bill:', e, 'id:', id, 'key:', key);
				bill = null;
				loading = false;
			});
	}

	function goBack() {
		history.length > 1 ? history.back() : goto('/contas');
	}

	function handleDelete() {
		showDeleteModal = true;
	}

	function handleDeleteConfirm() {
		if (!bill) return;
		db.bills.delete(bill.id).then(() => {
			showDeleteModal = false;
			goto('/contas');
		});
	}

	function handleDeleteCancel() {
		showDeleteModal = false;
	}

	function openPayModal() {
		showPayModal = true;
	}
	function closePayModal() {
		showPayModal = false;
	}
	async function handleBillPaid(event: CustomEvent) {
		// You may want to reuse the logic from the main page
		const { bill: paidBill, paymentMethod, amount, date, note } = event.detail;
		if (!bill) return;
		await db.bills.update(bill.id, {
			isPaid: true,
			paidAt: date,
			paymentMethod,
			amountPaid: amount,
			note
		});
		bill = { ...bill, isPaid: true, paidAt: date, paymentMethod, amountPaid: amount, note };
		showPayModal = false;
	}

	// async function handlePay() {
	// 	if (!bill) return;
	// 	// You can expand this logic to show a modal or process payment inline
	// 	// For now, mark as paid with today's date and a placeholder method
	// 	const today = new Date();
	// 	await db.bills.update(bill.id, {
	// 		isPaid: true,
	// 		paidAt: today.toISOString().split('T')[0],
	// 		paymentMethod: 'Manual',
	// 		amountPaid: bill.amount
	// 	});
	// 	bill = { ...bill, isPaid: true, paidAt: today.toISOString().split('T')[0], paymentMethod: 'Manual', amountPaid: bill.amount };
	// }
</script>

<div class="min-h-screen bg-slate-50">
	<div class="mx-auto max-w-2xl p-4 sm:p-6">
		{#if loading}
			<div class="mt-10 text-center text-slate-500">Carregando detalhes...</div>
		{:else if bill}
			<div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
				<div class="border-b border-slate-200 bg-white p-4 text-center relative">
					<button
						class="mb-2 flex items-center gap-1.5 text-slate-600 transition hover:text-slate-900 mx-auto"
						on:click={goBack}
					>
						<svg
							class="h-5 w-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							viewBox="0 0 24 24"
							><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg
						>
						<span class="text-sm font-medium">Voltar para Contas</span>
					</button>
					<p class="mb-0.5 text-sm text-slate-500">{bill.name}</p>
					<p class="text-5xl font-bold text-slate-800">
						R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
					</p>

					<div class="mt-2">
						{#if bill.isPaid}
							<span class="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
								✅ Pago
							</span>
						{:else if isOverdue(bill)}
							<span class="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
								❗️ Vencida
							</span>
						{:else}
							<span class="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
								⏳ Pendente
							</span>
						{/if}
					</div>
				</div>

				<div class="flex flex-col gap-2 p-3 text-sm">
					<div>
						<span class="text-slate-500">Categoria</span>
						<div class="font-semibold text-slate-700 mt-0.5">{bill.category}</div>
					</div>
					<div>
						<span class="text-slate-500">Vencimento</span>
						<div class="font-semibold text-slate-700 mt-0.5">{new Date(bill.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
					</div>
					<div>
						<span class="text-slate-500">Destinatário</span>
						<div class="font-semibold text-slate-700 mt-0.5">{bill.recipient}</div>
					</div>
					{#if bill.installmentInfo}
						<div>
							<span class="text-slate-500">Parcela</span>
							<div class="font-semibold text-slate-700 mt-0.5">{bill.installmentInfo}</div>
						</div>
					{/if}

					<hr class="my-1 border-t border-slate-100" />

					<div class="flex items-center gap-2">
						<span class="text-slate-500">Pago?</span>
						<input type="checkbox" class="accent-emerald-500 w-4 h-4" disabled checked={bill.isPaid} />
					</div>
					<div>
						<span class="text-slate-500">Data de Pagamento</span>
						<div class="font-semibold text-slate-700 mt-0.5">{bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('pt-BR') : '-'}</div>
					</div>
					<div>
						<span class="text-slate-500">Forma de Pagamento</span>
						<div class="font-semibold text-slate-700 mt-0.5">{bill.paymentMethod || '-'}</div>
					</div>
					{#if bill.amountPaid}
						<div>
							<span class="text-slate-500">Valor Pago</span>
							<div class="font-semibold text-emerald-600 mt-0.5">R$ {bill.amountPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
						</div>
					{/if}
					{#if bill.lateFee}
						<div>
							<span class="text-slate-500">Multa</span>
							<div class="font-semibold text-red-600 mt-0.5">R$ {bill.lateFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
						</div>
					{/if}

					<hr class="my-1 border-t border-slate-100" />

					<div class="flex items-center gap-2">
						<span class="text-slate-500">Recorrente?</span>
						<input type="checkbox" class="accent-emerald-500 w-4 h-4" disabled checked={bill.isRecurring} />
					</div>
					<div>
						<span class="text-slate-500">Criado em</span>
						<div class="font-semibold text-slate-700 mt-0.5">{bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('pt-BR') : '-'}</div>
					</div>
					<div>
						<span class="text-slate-500">Atualizado em</span>
						<div class="font-semibold text-slate-700 mt-0.5">{bill.updatedAt ? new Date(bill.updatedAt).toLocaleDateString('pt-BR') : '-'}</div>
					</div>
				</div>

				<div class="mt-2 flex justify-center gap-2">
					{#if !bill.isPaid}
						<button
							class="flex items-center gap-1 rounded bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition"
							on:click={openPayModal}
							title="Pagar conta"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" /></svg>
							Pagar
						</button>
					{/if}
					<button
						class="flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition"
						on:click={() => {/* TODO: implement edit modal */}}
						title="Editar conta"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6 3 3-6 6H9v-3z" /></svg>
						Editar
					</button>
					<button
						class="flex items-center gap-1 rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 transition"
						on:click={handleDelete}
						title="Excluir conta"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
						Excluir
					</button>
				</div>

				{#if bill.note}
					<div class="border-t border-slate-200 bg-slate-50/70 p-4 mt-2">
						<p class="text-sm font-semibold text-slate-600 mb-1">Anotações:</p>
						<p class="text-sm text-slate-500 italic">
							{bill.note}
						</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="mt-10 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
				<p class="font-bold text-red-700">Conta não encontrada</p>
				<p class="text-sm text-red-600">Não foi possível localizar a conta com o ID: {id}</p>
			</div>
		{/if}

		{#if showDeleteModal}
			<ConfirmationModal
				bind:showModal={showDeleteModal}
				title="Excluir conta?"
				message="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
				on:confirm={handleDeleteConfirm}
				on:cancel={handleDeleteCancel}
			/>
		{/if}

		{#if showPayModal && bill}
			<PayBillModal
				bind:showModal={showPayModal}
				bill={bill}
				paymentError={paymentError}
				on:close={closePayModal}
				on:pay={handleBillPaid}
			/>
		{/if}
	</div>
</div>