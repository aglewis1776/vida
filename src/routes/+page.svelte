<script lang="ts">
	import { userProfile } from '$lib/stores';
	
	import UpdateBalanceModal from '$lib/components/UpdateBalanceModal.svelte';
	import AddTransactionModal from '$lib/components/AddTransactionModal.svelte';

	let showUpdatePixModal = false;
	let showAddTransactionModal = false;
	let transactionType: 'income' | 'expense' = 'expense';

	function openTransactionModal(type: 'income' | 'expense') {
		transactionType = type;
		showAddTransactionModal = true;
	}
</script>

<svelte:head>
	<title>Início - Vida Financeira</title>
</svelte:head>

{#if showUpdatePixModal}
	<UpdateBalanceModal bind:showModal={showUpdatePixModal} onClose={() => (showUpdatePixModal = false)} />
{/if}

{#if showAddTransactionModal}
	<AddTransactionModal 
		bind:showModal={showAddTransactionModal}
		{transactionType}
		onClose={() => (showAddTransactionModal = false)} 
	/>
{/if}

<div class="space-y-6">
	<!-- Cash Card -->
	<div class="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200 mb-2">
		<div class="h-4 bg-blue-500"></div>
		<div class="flex flex-col justify-between p-4" style="height: 150px;">
			<div class="flex justify-between items-center mb-2">
				<h2 class="text-base text-gray-600 font-medium">Meu Dinheiro (em mãos)</h2>
			</div>
			<div class="flex-grow flex items-center justify-between">
				<button on:click={() => openTransactionModal('expense')} class="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700" aria-label="Adicionar Gasto">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" /></svg>
				</button>
				<p class="text-2xl font-bold text-gray-800">
					R$ {$userProfile?.cashBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
				</p>
				<button on:click={() => openTransactionModal('income')} class="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700" aria-label="Adicionar Receita">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Pix Card -->
	<div class="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200 mb-2">
		<div class="h-4" style="background-color: #77B6A8;"></div>
		<div class="flex flex-col justify-between p-4" style="height: 150px;">
			<div class="flex justify-between items-center mb-2">
				<h2 class="text-base text-gray-600 font-medium">Meu Saldo no Banco (PIX)</h2>
			</div>
			<div class="flex-grow flex items-center justify-between px-4">
				<div class="w-12 h-12"></div>
				<p class="text-2xl font-bold text-gray-800">
					R$ {$userProfile?.pixBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
				</p>
				<button on:click={() => (showUpdatePixModal = true)} class="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition hover:brightness-90" style="background-color: #77B6A8;" aria-label="Atualizar Saldo Pix">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
				</button>
			</div>
		</div>
	</div>
</div>