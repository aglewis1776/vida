<!-- src/lib/components/BillList.svelte -->

<script lang="ts">
  import type { Bill } from '$lib/types';
  import BillItem from './BillItem.svelte';

  export let title: string;
  export let bills: Bill[];
</script>
  <div>
    <h1 class="text-xl font-bold text-gray-800">Vida Financeira</h1>
  </div>
<div class="space-y-4">
  <h2 class="text-lg font-bold text-gray-700">{title}</h2>
  {#if bills.length > 0}
    <div class="space-y-3">
      {#each bills as bill (bill.id)}
        <BillItem {bill} />
      {/each}
    </div>
  {:else}
    <p class="text-sm text-gray-500">Nenhuma conta para este período.</p>
  {/if}
</div>
