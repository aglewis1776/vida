<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { onMount } from 'svelte';
import type { RecurringBill } from '$lib/types';

export let showModal: boolean;
export let onClose: () => void;

const dispatch = createEventDispatcher();

let name = '';
let recipient = '';
let amount: number | '' = '';
let category = '';
let dueDay: number | '' = '';
let priority: number | '' = '';
let recurrence: 'daily' | 'weekly' | 'biweekly' | 'monthly' = 'monthly';

const categories = [
  'Moradia',
  'Transporte',
  'Alimentação',
  'Saúde',
  'Educação',
  'Lazer',
  'Impostos e Taxas',
  'Outros'
];

function close() {
  dispatch('close');
  if (onClose) onClose();
}

function save() {
  if (!name || !recipient || !amount || !category || !dueDay) return;
  const bill: RecurringBill = {
    id: crypto.randomUUID(),
    name,
    recipient,
    amount: Number(amount),
    category,
    dueDay: Number(dueDay),
    priority: priority ? Number(priority) : undefined,
    profileId: '', // To be set by parent
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    recurrence
  };
  dispatch('save', { bill });
  close();
}

onMount(() => {
  if (showModal) {
    name = '';
    recipient = '';
    amount = '';
    category = '';
    dueDay = '';
    priority = '';
    recurrence = 'monthly';
  }
});
</script>

{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
      <h2 class="text-lg font-bold mb-4">Adicionar Conta Recorrente</h2>
      <form on:submit|preventDefault={save} class="space-y-3">
        <div>
          <label class="block text-sm font-medium">Nome</label>
          <input class="input input-bordered w-full" bind:value={name} required />
        </div>
        <div>
          <label class="block text-sm font-medium">Destinatário</label>
          <input class="input input-bordered w-full" bind:value={recipient} required />
        </div>
        <div>
          <label class="block text-sm font-medium">Valor (R$)</label>
          <input class="input input-bordered w-full" type="number" min="0" step="0.01" bind:value={amount} required />
        </div>
        <div>
          <label class="block text-sm font-medium">Categoria</label>
          <select class="input input-bordered w-full" bind:value={category} required>
            <option value="" disabled selected>Selecione</option>
            {#each categories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium">Dia de Vencimento</label>
          <input class="input input-bordered w-full" type="number" min="1" max="31" bind:value={dueDay} required />
        </div>
        <div>
          <label class="block text-sm font-medium">Prioridade (opcional)</label>
          <input class="input input-bordered w-full" type="number" min="1" max="99" bind:value={priority} />
        </div>
        <div>
          <label class="block text-sm font-medium">Recorrência</label>
          <select class="input input-bordered w-full" bind:value={recurrence} required>
            <option value="monthly">Mensal</option>
            <option value="biweekly">A cada 2 semanas</option>
            <option value="weekly">Semanal</option>
            <option value="daily">Diária</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" on:click={close}>Cancelar</button>
          <button type="submit" class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Salvar</button>
        </div>
      </form>
    </div>
  </div>
{/if}
