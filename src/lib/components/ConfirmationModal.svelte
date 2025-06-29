<!-- src/lib/components/ConfirmationModal.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let showModal: boolean = false;
	export let title: string = 'Confirmar Ação';
	export let message: string = 'Você tem certeza que deseja continuar?';

	const dispatch = createEventDispatcher();

	function handleConfirm() {
		dispatch('confirm');
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

{#if showModal}
	<div
		class="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-75"
		on:click={handleCancel}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
			on:click|stopPropagation
		>
			<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
			<p class="mt-2 text-sm text-gray-500">{message}</p>

			<div class="mt-6 flex justify-end space-x-3">
				<button
					type="button"
					on:click={handleCancel}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				>
					Cancelar
				</button>
				<button
					type="button"
					on:click={handleConfirm}
					class="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				>
					Confirmar
				</button>
			</div>
		</div>
	</div>
{/if}
