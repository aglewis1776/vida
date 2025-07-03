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
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const dueDateObj = new Date(bill.dueDate + 'T00:00:00');
	dueDateObj.setHours(0, 0, 0, 0);
	const isOverdue = !bill.isPaid && dueDateObj < today;
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

<div class="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200 mb-2 cursor-pointer group font-['Nunito_Sans','Nunito Sans',sans-serif] text-[#1F2937] text-xs" style="height:64px;" on:click={() => handleCardClick(bill)}>
	<div class="h-1.5 w-full bg-[#10B981] rounded-t-lg"></div>
	<div class="flex items-center p-2 relative z-10">
		{#if bill.isPaid}
			<span class="flex flex-col items-center justify-center h-10 w-10 mr-3">
<svg 
  width="40" 
  height="40" 
  viewBox="0 0 40 40" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg">
  
  <rect x="2" y="2" width="36" height="36" rx="4" stroke="#FFD700" stroke-width="4"/>

  <path d="M11 20L18 27L30 15" stroke="#FFD700" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
			</span>
		{:else}
			<div class="flex h-10 w-10 flex-col items-center justify-center rounded-md mr-3
				{isOverdue ? 'bg-[#FEE2E2] text-[#B91C1C]' : isToday(dueDateObj) ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#D1FAE5] text-[#047857]'}">
				<span class="text-base font-bold">{new Date((bill.paidAt || bill.dueDate) + 'T00:00:00').getDate()}</span>
				<span class="text-[10px] font-semibold">{new Date((bill.paidAt || bill.dueDate) + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')}</span>
			</div>
		{/if}
		<div class="ml-0 flex-grow min-w-0">
			<p class="font-semibold text-[#1F2937] truncate">{bill.name || '-'}</p>
			{#if !bill.isPaid}
				{#if differenceInDays(new Date(bill.dueDate + 'T00:00:00'), today) <= 5 && bill.lateFee && bill.lateFee > 0}
					<p class="text-xs min-h-[1.25rem] flex items-center gap-1" style="color:#B45309;">
						<span class="inline-block align-middle">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="12" cy="12" r="12" fill="#FEF3C7"/>
								<path d="M11 6H13V14H11V6ZM11 16H13V18H11V16Z" fill="#B45309"/>
							</svg>
						</span>
						Evite a taxa de R$ {bill.lateFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
					</p>
				{:else if bill.installmentInfo}
					<p class="text-xs text-gray-400 min-h-[1.25rem]">{bill.installmentInfo}</p>
				{:else}
					<p class="text-xs text-gray-400 min-h-[1.25rem]">{bill.category ? bill.category : '\u00A0'}</p>
				{/if}
			{/if}
			{#if bill.isPaid}
				<p class="text-xs text-[#6B7280]">Pago em {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('pt-BR') : '-'}</p>
			{/if}
			{#if bill.note}
				<p class="italic mt-1">{bill.note}</p>
			{/if}
		</div>
		<div class="px-2 text-right">
			<p class="text-[#1F2937] truncate">R$ {(bill.amountPaid ?? bill.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
			{#if bill.isPaid}
				<p class="text-xs text-[#6B7280] font-['Nunito_Sans','Nunito Sans',sans-serif]">{bill.paymentMethod || '-'}</p>
			{:else}
				<p class="text-gray-500 min-h-[1.25rem]">{bill.installmentInfo ? bill.installmentInfo : ' '}</p>
			{/if}
		</div>
		<div class="flex flex-col items-end ml-2 gap-1" on:click|stopPropagation>
			<!-- Pay button removed from active bill cards -->
		</div>
	</div>
</div>