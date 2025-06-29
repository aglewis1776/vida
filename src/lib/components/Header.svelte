<script lang="ts">
	import { userProfile } from '$lib/stores';

	// This is a reactive variable.
	// Whenever the userProfile store changes (e.g., cash or pix balance is updated),
	// this `totalBalance` will automatically be recalculated.
	$: totalBalance = ($userProfile?.cashBalance ?? 0) + ($userProfile?.pixBalance ?? 0);
</script>

<header
	class="bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200"
>
	<div>
		<h1 class="text-xl font-bold text-gray-800">Vida Financeira</h1>
	</div>
	<div class="text-right">
		<span class="text-xs text-gray-500">Saldo Total</span>
		<p class="font-bold text-green-600 text-3xl">
			R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
		</p>
	</div>
</header>