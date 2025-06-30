<script lang="ts">
	import type { Bill } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { format, isToday, isPast, differenceInDays } from 'date-fns';
	import { ptBR } from 'date-fns/locale';
	import { db } from '$lib/db';
	import { onMount } from 'svelte';

	export let bill: Bill & { installmentInfo?: string };

	const dispatch = createEventDispatcher();

	function editBill() {
		dispatch('edit', bill);
	}

	function deleteBill() {
		dispatch('delete', bill);
	}

	function payBill() {
		dispatch('pay', bill);
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

	function getDueDateStatus(dueDateStr: string): { text: string; color: string } {
		const dueDate = new Date(dueDateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (isPast(dueDate) && !isToday(dueDate)) {
			return { text: 'Vencida', color: 'text-red-600' };
		}
		if (isToday(dueDate)) {
			return { text: 'Vence hoje', color: 'text-orange-500' };
		}
		const diff = differenceInDays(dueDate, today);
		if (diff === 1) {
			return { text: 'Vence amanhã', color: 'text-yellow-600' };
		}
		return {
			text: `Vence em ${format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}`,
			color: 'text-gray-500'
		};
	}

	const dueDateStatus = getDueDateStatus(bill.dueDate);

	let debtCategory: string | null = null;

	// Calculate if bill is overdue and unpaid, and get late fee
	const isOverdue = !bill.isPaid && new Date(bill.dueDate) < new Date().setHours(0,0,0,0);
	const showLateFee = isOverdue && bill.lateFee && bill.lateFee > 0;

	onMount(async () => {
		if (bill.debtId) {
			const debt = await db.debts.get(bill.debtId);
			if (debt && debt.category) {
				debtCategory = debt.category;
			}
		}
	});
</script>

<div class="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200 mb-2">
	<div class="h-4 flex items-center justify-between px-4 {getCategoryColorClass(bill.category)}">
		<span></span>
		<span class="text-xs font-semibold text-white">{debtCategory || bill.category}</span>
	</div>
	<div class="flex items-center p-4">
		<div class="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-gray-200 text-gray-700 mr-3">
			<span class="text-base font-bold">{new Date((bill.paidAt || bill.dueDate) + 'T00:00:00').getDate()}</span>
			<span class="text-[10px] font-semibold">{new Date((bill.paidAt || bill.dueDate) + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')}</span>
		</div>
		<div class="flex-grow min-w-0">
			<p class="font-semibold text-gray-800 truncate">{bill.name}</p>
			<p class="text-gray-500 truncate text-xs">{bill.recipient}</p>
			{#if bill.installmentInfo}
				<p class="text-xs text-gray-400">{bill.installmentInfo}</p>
			{/if}
			{#if bill.note}
				<p class="italic mt-1 text-gray-500">{bill.note}</p>
			{/if}
		</div>
		<div class="text-right ml-2">
			<p class="font-bold text-lg text-gray-800">R$ {(bill.amountPaid ?? bill.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
			{#if bill.lateFee && bill.lateFee > 0}
				<p class="text-xs {(!bill.isPaid && isPast(new Date(bill.dueDate)) && !isToday(new Date(bill.dueDate))) ? 'text-red-500 font-semibold' : 'text-gray-500'}">
					Multa: R$ {bill.lateFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
				</p>
			{/if}
			{#if bill.isPaid}
				<p class="text-xs text-green-600">Pago em {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('pt-BR') : '-'}</p>
				<p class="text-xs text-gray-500">{bill.paymentMethod || '-'}</p>
			{/if}
		</div>
		<div class="flex flex-col items-end ml-4 gap-1">
			{#if !bill.isPaid}
				<button class="btn btn-xs btn-ghost btn-circle" aria-label="Editar" title="Editar" on:click={editBill}>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
				</button>
				<button class="btn btn-xs btn-ghost btn-circle" aria-label="Pagar" title="Pagar" on:click={payBill}>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 10a8 8 0 1116 0A8 8 0 014 10zm8-3a1 1 0 100 2 1 1 0 000-2zm-1 4a1 1 0 012 0v2a1 1 0 11-2 0v-2z" /></svg>
				</button>
				<button class="btn btn-xs btn-ghost btn-circle" aria-label="Excluir" title="Excluir" on:click={deleteBill}>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
				</button>
			{/if}
		</div>
	</div>
</div>