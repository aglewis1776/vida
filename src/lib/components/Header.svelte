<!-- src/lib/components/Header.svelte -->
<script lang="ts">
  // We'll add logic later to calculate the real balance
  const dailyBalance = 150.0;
</script>

<header
  class="bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200"
>
  <div>
    <h1 class="text-xl font-bold text-gray-800">Vida Financeira</h1>
  </div>
  <div class="text-right">
    <span class="text-xs text-gray-500">Saldo do Dia</span>
    <p class="font-bold text-green-600">
      R$ {dailyBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </p>
  </div>
</header>
