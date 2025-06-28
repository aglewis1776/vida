<!-- src/lib/components/BillItem.svelte -->
<script lang="ts">
  import type { Bill } from '$lib/types';
  export let bill: Bill;
</script>

<div
  class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
>
  
  <div>
    <h1 class="text-xl font-bold text-gray-800">Vida Financeira</h1>
  </div>
<div>
    <p class="font-semibold text-gray-800">{bill.name}</p>
    <p class="text-sm text-gray-500">Vence hoje</p>
    <!-- We'll make this date dynamic later -->
  </div>
  <div class="flex items-center space-x-4">
    <p class="font-bold text-red-600">
      R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </p>
    <button
      class="px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
    >
      Pagar com Pix
    </button>
  </div>
</div>
