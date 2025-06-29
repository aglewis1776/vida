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
	<div class="card border border-gray-200 bg-white shadow-sm">
		<div class="card-body p-4 flex flex-col justify-between" style="height: 150px;">
			<div class="flex justify-between items-center">
				<h2 class="card-title text-base text-gray-600 font-medium">Meu Dinheiro (em mãos)</h2>
			</div>
			
			<div class="flex-grow flex items-center justify-between">
				<button on:click={() => openTransactionModal('expense')} class="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700" aria-label="Adicionar Gasto">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" /></svg>
				</button>

				<p class="text-4xl font-bold text-gray-800">
					R$ {$userProfile?.cashBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
				</p>

				<button on:click={() => openTransactionModal('income')} class="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700" aria-label="Adicionar Receita">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
				</button>
			</div>
			
			<div class="h-4"></div> </div>
	</div>

	<div class="card border border-gray-200 bg-white shadow-sm">
		<div class="card-body p-4 flex flex-col justify-between" style="height: 150px;">
			<div class="flex justify-between items-center">
				<h2 class="card-title text-base text-gray-600 font-medium">Meu Saldo no Banco (Pix)</h2>
			</div>
			<div class="flex-grow flex items-center justify-between px-4">
				<div class="w-12 h-12"></div> 
				
				<p class="text-4xl font-bold text-gray-800">
					R$ {$userProfile?.pixBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
				</p>

				<button on:click={() => (showUpdatePixModal = true)} class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700" aria-label="Atualizar Saldo Pix">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
				</button>
			</div>
			<div class="h-4"></div> </div>
	</div>

	</div>