<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { BillHistory } from '$lib/types';

  export let showModal: boolean;
  export let bill: BillHistory | null = null;

  const dispatch = createEventDispatcher();

  let note: string = bill?.note || '';
  let paidAt: string = bill?.paidAt ? bill.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  let amountPaid: number = bill?.amountPaid ?? bill?.amount ?? 0;

  $: if (bill) {
    note = bill.note || '';
    paidAt = bill.paidAt ? bill.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
    amountPaid = bill.amountPaid ?? bill.amount ?? 0;
  }

  function close() {
    dispatch('close');
  }

  function save() {
    if (!bill) return;
    dispatch('save', {
      ...bill,
      note,
      paidAt: paidAt + 'T00:00:00',
      amountPaid: Number(amountPaid)
    });
    close();
  }
</script>

{#if showModal && bill}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
      <h2 class="text-lg font-bold mb-4">Editar Histórico</h2>
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">Descrição/Observação</label>
        <textarea bind:value={note} class="w-full border rounded px-2 py-1" rows="2"></textarea>
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">Data do Pagamento</label>
        <input type="date" bind:value={paidAt} class="w-full border rounded px-2 py-1" />
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">Valor Pago</label>
        <input type="number" min="0" step="0.01" bind:value={amountPaid} class="w-full border rounded px-2 py-1" />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" on:click={close}>Cancelar</button>
        <button type="button" class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" on:click={save}>Salvar</button>
      </div>
    </div>
  </div>
{/if}
