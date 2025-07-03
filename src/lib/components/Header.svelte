<script lang="ts">
	import { userProfile } from '$lib/stores';

	// This is a reactive variable.
	// Whenever the userProfile store changes (e.g., cash or pix balance is updated),
	// this `totalBalance` will automatically be recalculated.
	$: totalBalance = ($userProfile?.cashBalance ?? 0) + ($userProfile?.pixBalance ?? 0);
</script>

<header
	   class="bg-[#F9FAFB] sticky top-0 z-50 flex items-center justify-between border-b border-gray-200"
	   style="backdrop-filter:none;background-color:#F9FAFB; min-height: 8rem; padding-left: 0.5rem; padding-right: 0.5rem;"
>
<div class="flex items-center" style="min-width:8rem; min-height:8rem;">
	<img src="/icons/na_regua_logo.png" alt="Na Régua Logo" style="height:8rem;width:8rem;object-fit:contain;" />
</div>
	<div class="text-right">
		<!-- Set 'Saldo Total' text color to #10B981 -->
		<span class="text-lg font-bold" style="color: #10B981;">Saldo Total</span>
		<p class="font-bold text-3xl" style="color: #10B981">
			R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
		</p>
	</div>
</header>