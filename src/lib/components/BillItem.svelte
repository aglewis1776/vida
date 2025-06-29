<script lang="ts">
	import type { Bill } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	import { format, isToday, isPast, differenceInDays } from 'date-fns';
	import { ptBR } from 'date-fns/locale';

	export let bill: Bill;

	const dispatch = createEventDispatcher();

	function editBill() {
		dispatch('edit', bill);
	}

	function deleteBill() {
		dispatch('delete', bill);
	}

	function getDueDateStatus(dueDateStr: string): { text: string; color: string } {
		const dueDate = new Date(dueDateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Normalize today to the beginning of the day

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
</script>

<div class="card w-full bg-base-100 shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
	<div class="card-body p-4">
		<div class="flex items-start justify-between">
			<div class="flex-grow">
				<h3 class="card-title text-base font-bold text-gray-800">{bill.name}</h3>
				{#if bill.recipient}
					<p class="text-sm text-gray-500">Para: {bill.recipient}</p>
				{/if}
			</div>

			<div class="text-right flex-shrink-0 ml-4">
				<p class="font-bold text-lg text-gray-800">
					R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
				</p>
				<p class="text-sm {dueDateStatus.color}">{dueDateStatus.text}</p>
			</div>
		</div>

		<div class="card-actions justify-end mt-4">
			<button class="btn btn-ghost btn-sm text-gray-600" on:click={editBill}>Editar</button>
			<button class="btn btn-ghost btn-sm text-error" on:click={deleteBill}>Excluir</button>
			<button class="btn btn-primary btn-sm">Pagar com Pix</button>
		</div>
	</div>
</div>