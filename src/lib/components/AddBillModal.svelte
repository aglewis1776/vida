<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/db';
  import type { Bill } from '$lib/types';
  import { userProfile } from '$lib/stores';
  import { v4 as uuidv4 } from 'uuid';

  // SVELTE 5: The parent's `on:close` handler is received as a prop.
  let { onclose } = $props();

  // SVELTE 5: Use $state for any variable that will change.
  let billName = $state('');
  let recipient = $state('');
  let amount = $state<number | null>(null);
  let dueDate = $state('');
  let isSaving = $state(false);

  let dialogRef: HTMLDivElement | null = null;

  async function handleSubmit() {
    if (!billName || !amount || !dueDate || !$userProfile) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    isSaving = true;

    const newBill: Bill = {
      id: uuidv4(),
      profileId: $userProfile.id,
      name: billName,
      recipient: recipient,
      amount: amount,
      dueDate: new Date(dueDate).toISOString(),
      isPaid: false,
    };

    try {
      await db.bills.add(newBill);
      onclose(); // Call the prop function directly.
    } catch (error) {
      console.error('Failed to save bill:', error);
      alert('Falha ao salvar a conta.');
    } finally {
      isSaving = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onclose();
    }
    // Allow Enter/Space to close if overlay is focused
    if ((event.key === 'Enter' || event.key === ' ') && document.activeElement === dialogRef) {
      onclose();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    // Focus the dialog for accessibility
    dialogRef?.focus();
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div
  bind:this={dialogRef}
  class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  role="dialog"
  aria-modal="true"
  aria-labelledby="add-bill-title"
  tabindex="-1"
  onclick={() => onclose()}
  onkeydown={handleKeydown}
>
  <div
    class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl"
    onclick={(event) => event.stopPropagation()}
    role="document"
  >
    <h2 id="add-bill-title" class="text-2xl font-bold mb-4">Adicionar Nova Conta</h2>
    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="billName" class="block text-sm font-medium text-gray-700"
          >Nome da Conta</label
        >
        <input
          type="text"
          id="billName"
          bind:value={billName}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      <div>
        <label for="recipient" class="block text-sm font-medium text-gray-700"
          >Beneficiário (opcional)</label
        >
        <input
          type="text"
          id="recipient"
          bind:value={recipient}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label for="amount" class="block text-sm font-medium text-gray-700"
          >Valor (R$)</label
        >
        <input
          type="number"
          id="amount"
          step="0.01"
          bind:value={amount}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      <div>
        <label for="dueDate" class="block text-sm font-medium text-gray-700"
          >Data de Vencimento</label
        >
        <input
          type="date"
          id="dueDate"
          bind:value={dueDate}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div class="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onclick={onclose}
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isSaving ? 'Salvando...' : 'Salvar Conta'}
        </button>
      </div>
    </form>
  </div>
</div>