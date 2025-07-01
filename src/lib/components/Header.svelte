<script lang="ts">
	import { userProfile } from '$lib/stores';

	// This is a reactive variable.
	// Whenever the userProfile store changes (e.g., cash or pix balance is updated),
	// this `totalBalance` will automatically be recalculated.
	$: totalBalance = ($userProfile?.cashBalance ?? 0) + ($userProfile?.pixBalance ?? 0);
</script>

<header
	class="bg-[#F9FAFB] sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200"
>
	<div>
		<!-- Set 'Vida Financeira' text color to #10B981, keep size unchanged -->
		<span class="text-xl font-bold" style="color: #10B981;">Vida Financeira</span>
	</div>
	<div class="text-right">
		<!-- Set 'Saldo Total' text color to #10B981 -->
		<span class="text-lg font-bold" style="color: #10B981;">Saldo Total</span>
		<p class="font-bold text-3xl" style="color: #10B981">
			R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
		</p>
	</div>
</header>