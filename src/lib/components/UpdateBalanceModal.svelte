<script lang="ts">
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { UserProfile } from '$lib/types';

	export let showModal: boolean = false;
	export let onClose: () => void;

	let newBalance: number | null = null;
	let errorMessage = '';
	let dialogElement: HTMLDialogElement;

	$: if (showModal && $userProfile) {
		newBalance = $userProfile.pixBalance ?? 0;
	}

	$: if (dialogElement) {
		if (showModal) {
			dialogElement.showModal();
		} else {
			dialogElement.close();
		}
	}

	async function handleSaveBalance() {
		if (newBalance === null || newBalance < 0) {
			errorMessage = 'O saldo Pix não pode ser negativo.';
			return;
		}

		if (!$userProfile) {
			errorMessage = 'Erro: Perfil de usuário não encontrado.';
			return;
		}

		try {
			await db.profiles.update($userProfile.id, { pixBalance: newBalance });
			userProfile.update((profile) => {
				if (profile) profile.pixBalance = newBalance;
				return profile;
			});
			handleClose();
		} catch (error) {
			errorMessage = 'Falha ao atualizar o saldo.';
			console.error('Failed to update balance:', error);
		}
	}

	function handleClose() {
		errorMessage = '';
		newBalance = null;
		onClose();
	}
</script>

{#if showModal}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-75" on:click={handleClose} role="dialog" aria-modal="true">
		<div class="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" on:click|stopPropagation>
			<h3 class="text-xl font-semibold text-gray-800">Atualizar Saldo do Banco</h3>

			<form on:submit|preventDefault={handleSaveBalance} class="mt-4 space-y-4">
				<div>
					<label for="pix-balance" class="block text-sm font-medium text-gray-700">Qual o seu saldo atual no banco (Pix)?</label>
					<input
						type="number"
						id="pix-balance"
						bind:value={newBalance}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="1250.75"
						step="0.01"
						min="0"
					/>
				</div>

				{#if errorMessage}
					<p class="text-sm text-red-600">{errorMessage}</p>
				{/if}

				<div class="mt-6 flex justify-end space-x-3">
					<button type="button" on:click={handleClose} class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancelar</button>
					<button type="submit" class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Salvar</button>
				</div>
			</form>
		</div>
	</div>
{/if}