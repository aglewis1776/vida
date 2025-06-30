<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { BillWithInstallment } from '../routes/contas/+page.svelte';

  export let showModal: boolean;
  export let bill: BillWithInstallment | null = null;
  export let paymentError: string | null = null;

  const dispatch = createEventDispatcher();

  let paymentMethod: 'Cash' | 'PIX' | 'Boleto' = 'Cash';
  let amount: number = bill ? bill.amount : 0;
  let date: string = new Date().toISOString().slice(0, 10);
  let note: string = '';

  $: if (bill) {
    amount = bill.amount;
  }

  function close() {
    dispatch('close');
  }

  function pay() {
    if (!bill) return;
    dispatch('pay', {
      bill,
      paymentMethod,
      amount,
      date,
      note
    });
    // Only close if no error (parent will control)
  }
</script>

{#if showModal && bill}
  <div class="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
      <h2 class="text-lg font-bold mb-4">Pagar Conta</h2>
      {#if paymentError}
        <div class="mb-3 text-red-600 font-semibold">
          {paymentMethod === 'PIX'
            ? 'Saldo PIX insuficiente. Adicione dinheiro à sua conta PIX ou altere o valor/tipo de pagamento.'
            : 'Saldo em Dinheiro insuficiente. Adicione dinheiro à sua conta Dinheiro ou altere o valor/tipo de pagamento.'}
        </div>
      {/if}
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">Como foi pago?</label>
        <select bind:value={paymentMethod} class="w-full border rounded px-2 py-1">
          <option value="Cash">Dinheiro</option>
          <option value="PIX">PIX</option>
          <option value="Boleto">Boleto</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">Valor pago</label>
        <input type="number" min="0" step="0.01" bind:value={amount} class="w-full border rounded px-2 py-1" />
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">Data do pagamento</label>
        <input type="date" bind:value={date} class="w-full border rounded px-2 py-1" />
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">Observação</label>
        <textarea bind:value={note} class="w-full border rounded px-2 py-1" rows="2"></textarea>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" on:click={close}>Cancelar</button>
        <button type="button" class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" on:click={pay}>Confirmar Pagamento</button>
      </div>
    </div>
  </div>
{/if}
