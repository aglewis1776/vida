<!-- 
  File: src/routes/+page.svelte
  Description: This is the main page for the Vida Financeira PWA, corresponding to Slice 1.
  It includes the UI based on your design, with local state management for interactivity.
  All data is temporary (mock data) and will be lost on page refresh.
-->

<script>
  // Import necessary Svelte features. 'writable' creates a store that can be updated.
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';

  // --- STATE MANAGEMENT (using Svelte Stores) ---
  // This is the core of Slice 1's logic. We create "stores" to hold our app's data.
  // When the data in a store changes, any part of the UI using it will automatically update.
  
  // Store for the main balance. Initialized to 150.
  const saldoDoDia = writable(150.00);

  // Store for the list of bills. We'll start with some mock data matching your UI.
  const bills = writable([
    { id: 1, title: 'Conta de Luz', amount: 85.00, dueDate: 'Vence hoje', category: 'hoje' },
    { id: 2, title: 'Cartão de Crédito', amount: 245.00, dueDate: 'Vence hoje', category: 'hoje' },
    { id: 3, title: 'Financiamento Casa', amount: 680.00, dueDate: 'Vence amanhã', category: 'amanha' },
    { id: 4, title: 'Internet', amount: 99.90, dueDate: 'Próximos 7 dias', category: 'semana' },
  ]);
  
  // Reactive variables for categorizing bills.
  // The '$' prefix automatically subscribes to the store, so these variables will
  // update whenever the 'bills' store changes.
  $: billsHoje = $bills.filter(b => b.category === 'hoje');
  $: billsAmanha = $bills.filter(b => b.category === 'amanha');
  $: billsSemana = $bills.filter(b => b.category === 'semana');

  // --- MODAL LOGIC ---
  // Controls the visibility of the "Add Transaction" modal.
  let showModal = false;
  let newTransactionType = 'expense'; // 'expense' or 'income'
  let newTransactionTitle = '';
  let newTransactionAmount = null;

  function openModal(type) {
    newTransactionType = type;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    // Reset form fields
    newTransactionTitle = '';
    newTransactionAmount = null;
  }

  function handleAddTransaction() {
    if (!newTransactionTitle || !newTransactionAmount || newTransactionAmount <= 0) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }

    if (newTransactionType === 'expense') {
      // Add a new bill to our list
      const newBill = {
        id: $bills.length + 1,
        title: newTransactionTitle,
        amount: newTransactionAmount,
        dueDate: 'Vence hoje', // For simplicity, new items are due today
        category: 'hoje'
      };
      bills.update(currentBills => [...currentBills, newBill]);
      
      // Subtract from balance
      saldoDoDia.update(currentSaldo => currentSaldo - newTransactionAmount);

    } else if (newTransactionType === 'income') {
      // Add to balance
      saldoDoDia.update(currentSaldo => currentSaldo + newTransactionAmount);
    }
    
    closeModal();
  }


  // --- UTILITY FUNCTIONS ---
  // Formats a number into Brazilian currency format (R$ 1.234,56)
  function formatCurrency(value) {
    if (typeof value !== 'number') {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

</script>

<!-- 
  HTML and STYLING (using Tailwind CSS)
  This section defines the structure and look of your app.
  It's designed to be clean, responsive, and closely match your provided image.
-->
<div class="bg-gray-50 min-h-screen font-sans text-gray-800">
  <div class="container mx-auto max-w-2xl p-4">

    <!-- Header Section -->
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Vida Financeira</h1>
      <div class="text-right">
        <span class="text-sm text-gray-500">Saldo do Dia</span>
        <!-- The '$' prefix here makes the UI react to changes in the store -->
        <p class="text-2xl font-bold text-green-600">{formatCurrency($saldoDoDia)}</p>
      </div>
    </header>

    <!-- Main Content: Bill Lists -->
    <main>
      <!-- Bills Due Today -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">Vence Hoje</h2>
        {#if billsHoje.length > 0}
          <div class="space-y-3">
            {#each billsHoje as bill (bill.id)}
              <div class="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between transition hover:shadow-md">
                <div>
                  <p class="font-semibold text-lg">{bill.title}</p>
                  <p class="text-sm text-gray-500">{bill.dueDate}</p>
                </div>
                <div class="flex items-center space-x-4">
                  <p class="font-bold text-lg text-red-600">{formatCurrency(bill.amount)}</p>
                  <!-- This button is just for show in Slice 1. It will be functional in Slice 5. -->
                  <button class="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow">
                    Pagar com Pix
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
           <p class="text-gray-500 italic">Nenhuma conta para hoje.</p>
        {/if}
      </section>

      <!-- Bills Due Tomorrow -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">Vence Amanhã</h2>
         {#if billsAmanha.length > 0}
          <div class="space-y-3">
            {#each billsAmanha as bill (bill.id)}
               <div class="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between transition hover:shadow-md">
                <div>
                  <p class="font-semibold text-lg">{bill.title}</p>
                  <p class="text-sm text-gray-500">{bill.dueDate}</p>
                </div>
                <div class="flex items-center space-x-4">
                  <p class="font-bold text-lg text-red-600">{formatCurrency(bill.amount)}</p>
                  <button class="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow">
                    Pagar com Pix
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
           <p class="text-gray-500 italic">Nenhuma conta para amanhã.</p>
        {/if}
      </section>

      <!-- Bills Due in the Next 7 Days -->
      <section>
        <h2 class="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">Próximos 7 Dias</h2>
        {#if billsSemana.length > 0}
          <div class="space-y-3">
            {#each billsSemana as bill (bill.id)}
               <div class="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between transition hover:shadow-md">
                <div>
                  <p class="font-semibold text-lg">{bill.title}</p>
                  <p class="text-sm text-gray-500">{bill.dueDate}</p>
                </div>
                <div class="flex items-center space-x-4">
                  <p class="font-bold text-lg text-red-600">{formatCurrency(bill.amount)}</p>
                  <button class="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow">
                    Pagar com Pix
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-500 italic">Nenhuma conta para os próximos 7 dias.</p>
        {/if}
      </section>
    </main>

  </div>

  <!-- Floating Action Button (FAB) for adding transactions -->
  <div class="fixed bottom-6 right-6 flex flex-col items-center space-y-2">
      <button on:click={() => openModal('expense')} class="bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" /></svg>
      </button>
      <button on:click={() => openModal('income')} class="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" /></svg>
      </button>
  </div>


  <!-- Modal for Adding a New Transaction -->
  {#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" on:click={closeModal}>
      <div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md" on:click|stopPropagation>
        <h3 class="text-2xl font-bold mb-4 text-center">
          Adicionar {newTransactionType === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
        </h3>
        <form on:submit|preventDefault={handleAddTransaction}>
          <div class="mb-4">
            <label for="title" class="block text-gray-700 font-semibold mb-2">Descrição</label>
            <input type="text" id="title" bind:value={newTransactionTitle} class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Conta de Luz">
          </div>
          <div class="mb-6">
            <label for="amount" class="block text-gray-700 font-semibold mb-2">Valor (R$)</label>
            <input type="number" id="amount" bind:value={newTransactionAmount} step="0.01" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: 85.00">
          </div>
          <div class="flex justify-end space-x-3">
             <button type="button" on:click={closeModal} class="bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors">
              Cancelar
            </button>
            <button type="submit" class="text-white font-bold py-2 px-6 rounded-lg transition-colors {newTransactionType === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}">
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

</div>

