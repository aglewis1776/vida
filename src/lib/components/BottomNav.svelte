<script lang="ts">
	import { page } from '$app/stores';
</script>

<nav class="bg-white/90 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-10 h-16 border-t border-gray-200">
	<div class="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
		<a
			href="/"
			class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group"
			class:text-blue-600={$page.url.pathname === '/'}
			class:text-gray-500={$page.url.pathname !== '/'}
		>
			<svg class="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
			<span class="text-sm">Início</span>
		</a>

		<a
			href="/contas"
			class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group"
			class:text-blue-600={$page.url.pathname === '/contas'}
			class:text-gray-500={$page.url.pathname !== '/contas'}
		>
			<svg class="w-6 h-6 mb-1" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
			<span class="text-sm">Contas</span>
		</a>

		<a
			href="/debts"
			class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group"
			class:text-blue-600={$page.url.pathname === '/debts'}
			class:text-gray-500={$page.url.pathname !== '/debts'}
		>
			<svg class="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M19 4h-1.5a1.5 1.5 0 0 0-1.5 1.5V14a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1V5.5A1.5 1.5 0 0 0 19 4Z"></path><path d="M1.5 5.5a1 1 0 0 1 1-1H14a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V5.5Z"></path></svg>
			<span class="text-sm">Dívidas</span>
		</a>

		<a
			href="/configuracoes"
			class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group"
			class:text-blue-600={$page.url.pathname.startsWith('/configuracoes')}
			class:text-gray-500={!$page.url.pathname.startsWith('/configuracoes')}
		>
			<svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 2.25c.47-1.1 2.03-1.1 2.5 0l.2.47a2.25 2.25 0 0 0 2.98 1.2l.46-.2c1.1-.47 2.36.79 1.89 1.89l-.2.46a2.25 2.25 0 0 0 1.2 2.98l.47.2c1.1.47 1.1 2.03 0 2.5l-.47.2a2.25 2.25 0 0 0-1.2 2.98l.2.46c.47 1.1-.79 2.36-1.89 1.89l-.46-.2a2.25 2.25 0 0 0-2.98 1.2l-.2.47c-.47 1.1-2.03 1.1-2.5 0l-.2-.47a2.25 2.25 0 0 0-2.98-1.2l-.46.2c-1.1.47-2.36-.79-1.89-1.89l.2-.46a2.25 2.25 0 0 0-1.2-2.98l-.47-.2c-1.1-.47-1.1-2.03 0-2.5l.47-.2a2.25 2.25 0 0 0 1.2-2.98l-.2-.46c-.47-1.1.79-2.36 1.89-1.89l.46.2a2.25 2.25 0 0 0 2.98-1.2l.2-.47Z"/><circle cx="12" cy="12" r="3"/></svg>
			<span class="text-sm">Configurações</span>
		</a>
	</div>
</nav>