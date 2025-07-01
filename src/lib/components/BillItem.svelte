<script lang="ts">
	import type { Bill } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { format, isToday, isPast, differenceInDays } from 'date-fns';
	import { ptBR } from 'date-fns/locale';
	import { db } from '$lib/db';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

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

	function handleCardClick(bill: Bill) {
		goto(`/contas/${bill.id}`);
	}
</script>

<div class="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200 mb-2 cursor-pointer group font-['Nunito_Sans','Nunito Sans',sans-serif] text-[#1F2937] text-xs" on:click={() => handleCardClick(bill)}>
	<div class="h-1.5 w-full bg-[#10B981] rounded-t-lg"></div>
	<div class="flex items-center p-2 relative z-10">
		{#if bill.isPaid}
			<span class="flex flex-col items-center justify-center h-10 w-10 mr-1">
				<svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="2" y="2" width="36" height="36" rx="4" stroke="#FFD700" stroke-width="4"/>
					<path d="M11 20L18 27L30 15" stroke="#FFD700" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</span>
		{:else}
			<div class="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-gray-200 text-gray-700 mr-1">
				<span class="text-base font-bold">{new Date((bill.paidAt || bill.dueDate) + 'T00:00:00').getDate()}</span>
				<span class="text-[10px] font-semibold">{new Date((bill.paidAt || bill.dueDate) + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')}</span>
			</div>
		{/if}
		<div class="ml-0 flex-grow min-w-0">
			<p class="font-semibold text-[#1F2937] truncate">{bill.name || '-'}</p>
			<p class="text-xs text-[#6B7280]">{bill.isPaid ? `Pago em ${bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('pt-BR') : '-'}` : `Vence em ${new Date(bill.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}</p>
			{#if bill.installmentInfo}
				<p class="text-gray-500">{bill.installmentInfo}</p>
			{/if}
			{#if bill.note}
				<p class="italic mt-1">{bill.note}</p>
			{/if}
		</div>
		<div class="px-2 text-right">
			<p class="text-[#1F2937] truncate">R$ {(bill.amountPaid ?? bill.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
			<p class="text-xs text-[#6B7280] font-['Nunito_Sans','Nunito Sans',sans-serif]">{bill.paymentMethod || '-'}</p>
			{#if bill.installmentInfo}
				<p class="text-gray-500">{bill.installmentInfo}</p>
			{/if}
		</div>
		<div class="flex flex-col items-end ml-2 gap-1" on:click|stopPropagation>
			{#if !bill.isPaid}
				<button class="btn btn-xs btn-ghost btn-circle" aria-label="Pagar" title="Pagar" on:click={payBill}>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 10a8 8 0 1116 0A8 8 0 014 10zm8-3a1 1 0 100 2 1 1 0 000-2zm-1 4a1 1 0 012 0v2a1 1 0 11-2 0v-2z" /></svg>
				</button>
			{/if}
		</div>
	</div>
</div>