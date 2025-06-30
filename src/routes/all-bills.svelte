<script lang="ts">
import { onMount } from 'svelte';
import { db } from '$lib/db';
import type { Bill } from '$lib/types';

let bills: Bill[] = [];
let loading = true;
let error: string | null = null;

onMount(async () => {
	try {
		bills = await db.bills.toArray();
	} catch (e) {
		error = 'Erro ao carregar contas.';
		console.error(e);
	} finally {
		loading = false;
	}
});
</script>

<div class="p-6 max-w-2xl mx-auto">
	<h2 class="text-xl font-bold mb-4">Todas as Contas no Banco de Dados</h2>
	{#if loading}
		<p>Carregando...</p>
	{:else if error}
		<p class="text-red-600">{error}</p>
	{:else if bills.length === 0}
		<p>Nenhuma conta encontrada.</p>
	{:else}
		<ul class="divide-y divide-gray-200">
			{#each bills as bill}
				<li class="py-2">
					<strong>ID:</strong> {bill.id}<br />
					<strong>Nome:</strong> {bill.name}<br />
					<strong>Destinatário:</strong> {bill.recipient}<br />
					<strong>Valor:</strong> R$ {bill.amount}<br />
					<strong>Vencimento:</strong> {bill.dueDate}<br />
					<strong>Pago?:</strong> {bill.isPaid ? 'Sim' : 'Não'}<br />
					<strong>profileId:</strong> {bill.profileId}<br />
					{#if bill.debtId}<strong>debtId:</strong> {bill.debtId}<br />{/if}
					{#if bill.category}<strong>Categoria:</strong> {bill.category}<br />{/if}
				</li>
			{/each}
		</ul>
		<p class="mt-4 text-gray-700">Total de contas: <strong>{bills.length}</strong></p>
	{/if}
</div>
