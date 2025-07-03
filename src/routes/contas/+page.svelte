<script lang="ts">
	import { userProfile } from '$lib/stores';
	import { db } from '$lib/db';
	import type { Bill, Debt, RecurringBill } from '$lib/types';
	import { liveQuery } from 'dexie';
	import { addDays } from 'date-fns';
	import { writable, get, readable } from 'svelte/store';

	import AddBillModal from '$lib/components/AddBillModal.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import PayBillModal from '$lib/components/PayBillModal.svelte';
	import AddRecurringBillModal from '$lib/components/AddRecurringBillModal.svelte';
	import BillItem from '$lib/components/BillItem.svelte';

	interface BillWithInstallment extends Bill {
		installmentInfo?: string;
	}

	let showAddBillModal = false;
	let billToEdit: Bill | null = null;

	let showDeleteModal = false;
	let billToDelete: BillWithInstallment | null = null;

	let showPayModal = false;
	let billToPay: BillWithInstallment | null = null;

	const showAll = writable(false);

	// Always load all unpaid bills for the user
	const allBills = liveQuery<BillWithInstallment[]>(async () => {
		const profile = get(userProfile);
		if (!profile) return [];
		let collection = db.bills.where('profileId').equals(profile.id).and(bill => bill.isPaid === false);
		const bills = await collection.sortBy('dueDate');
		return await Promise.all(
			bills.map(async (bill) => {
				if (bill.debtId) {
					const debt = await db.debts.get(bill.debtId);
					if (debt && debt.totalInstallments) {
						const match = bill.name.match(/Parcela (\d+)/);
						const currentInstallment = match ? match[1] : '?';
						return {
							...bill,
							installmentInfo: `Parcela ${currentInstallment} de ${debt.totalInstallments}`
						};
					}
				}
				return bill;
			})
		);
	});

	// Recurring bills store
	const recurringBills = liveQuery<RecurringBill[]>(async () => {
	  const profile = get(userProfile);
	  if (!profile) return [];
	  return await db.recurringBills.where('profileId').equals(profile.id).and(bill => bill.isActive !== false).sortBy('dueDay');
	});

	let overdue: BillWithInstallment[] = [];
	let dueToday: BillWithInstallment[] = [];
	let dueTomorrow: BillWithInstallment[] = [];
	let next7Days: BillWithInstallment[] = [];
	let upcoming: BillWithInstallment[] = [];

	$: {
		if ($allBills) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const limitDate = $showAll ? addDays(today, 90) : addDays(today, 45);
			const sevenDaysFromNow = new Date(today);
			sevenDaysFromNow.setDate(today.getDate() + 7);
			const tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);

			overdue = [];
			dueToday = [];
			dueTomorrow = [];
			next7Days = [];
			upcoming = [];

			for (const bill of $allBills) {
				const dueDate = new Date(bill.dueDate + 'T00:00:00');
				if (dueDate < today) {
					overdue.push(bill);
				} else if (dueDate.getTime() === today.getTime()) {
					dueToday.push(bill);
				} else if (dueDate.getTime() === tomorrow.getTime()) {
					dueTomorrow.push(bill);
				} else if (dueDate > tomorrow && dueDate <= sevenDaysFromNow) {
					next7Days.push(bill);
				} else if (dueDate > sevenDaysFromNow && dueDate < limitDate) {
					upcoming.push(bill);
				}
			}
		}
	}
	
	function getCategoryColorClass(category: Bill['category']): string {
		switch (category) {
			case 'Moradia': return 'bg-blue-500';
			case 'Transporte': return 'bg-purple-500';
			case 'Alimentação': return 'bg-green-500';
			case 'Saúde': return 'bg-red-500';
			case 'Educação': return 'bg-yellow-500';
			case 'Lazer': return 'bg-pink-500';
			case 'Impostos e Taxas': return 'bg-amber-600';
			default: return 'bg-gray-400';
		}
	}

	// --- CLEANUP: Toggle logic for 45/90 days ---
	function toggleShowAll() {
		showAll.update(v => !v);
	}

	// When switching to 'active' view, always reset to 45 days
	function setView(newView: 'active' | 'recurring' | 'history') {
	  view = newView;
	  if (newView === 'active') {
		showAll.set(false);
	  }
	}

	function minimizeList() {
		showAll.set(false);
	}

	function openAddBillModal() {
		billToEdit = null;
		showAddBillModal = true;
	}

	function openEditBillModal(bill: Bill) {
		billToEdit = bill;
		showAddBillModal = true;
	}

	function closeAddBillModal() {
		showAddBillModal = false;
		billToEdit = null;
	}

	function handleBillSaved() { console.log('Bill saved.'); }
	
	function getDay(dateString: string): string {
		const date = new Date(dateString + 'T00:00:00');
		return date.toLocaleDateString('pt-BR', { day: 'numeric' });
	}

	function getMonthAbbr(dateString: string): string {
		const date = new Date(dateString + 'T00:00:00');
		return date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
	}

	function promptForDelete(bill: BillWithInstallment) {
		billToDelete = bill;
		showDeleteModal = true;
	}

	async function handleDeleteConfirmed() {
		if (billToDelete) {
			// Just delete the bill, no archiving to billHistory
			await db.bills.delete(billToDelete.id);
			billToDelete = null;
			showDeleteModal = false;
		}
	}

	function handleDeleteCancelled() {
		billToDelete = null;
		showDeleteModal = false;
	}

	function handlePayWithPix(bill: BillWithInstallment) {
		billToPay = bill;
		showPayModal = true;
	}
	function closePayModal() {
		showPayModal = false;
		billToPay = null;
	}
	let paymentError: string | null = null;

	// Bill payment logic: update bill as paid in-place
	async function handleBillPaid(event: CustomEvent) {
		const { bill, paymentMethod, amount, date, note } = event.detail;
		paymentError = null;
		const profile = $userProfile;
		if (profile) {
			if (paymentMethod === 'PIX') {
				const pix = profile.pixBalance ?? 0;
				if (pix < amount) {
					paymentError = 'Saldo PIX insuficiente. Atualize seu saldo em Configurações.';
					return;
				}
				const newPix = pix - amount;
				await db.profiles.update(profile.id, { pixBalance: newPix });
				userProfile.update(p => p ? { ...p, pixBalance: newPix } : p);
			} else if (paymentMethod === 'Cash' || paymentMethod === 'Boleto') {
				const cash = profile.cashBalance ?? 0;
				if (cash < amount) {
					paymentError = 'Saldo em Dinheiro insuficiente. Atualize seu saldo em Configurações.';
					return;
				}
				const newCash = cash - amount;
				await db.profiles.update(profile.id, { cashBalance: newCash });
				userProfile.update(p => p ? { ...p, cashBalance: newCash } : p);
			}
		}

		// If this bill is linked to a debt (parcelas), update installmentsPaid
		if (bill.debtId) {
			const debt = await db.debts.get(bill.debtId);
			if (debt && typeof debt.installmentsPaid === 'number' && typeof debt.totalInstallments === 'number') {
				const newInstallmentsPaid = Math.min(debt.installmentsPaid + 1, debt.totalInstallments);
				await db.debts.update(debt.id, { installmentsPaid: newInstallmentsPaid });
			}
		}

		// Mark bill as paid in-place
		await db.bills.update(bill.id, {
			isPaid: true,
			paidAt: date,
			paymentMethod,
			amountPaid: amount,
			note
		});
		showPayModal = false;
		billToPay = null;
	}

	// Collapsed state for each section
	const SECTION_OVERDUE = 'overdue';
	const SECTION_TODAY = 'today';
	const SECTION_TOMORROW = 'tomorrow';
	const SECTION_NEXT7 = 'next7';
	const SECTION_UPCOMING = 'upcoming';

	let collapsedSections: Record<string, boolean> = {
		[SECTION_OVERDUE]: false,
		[SECTION_TODAY]: false,
		[SECTION_TOMORROW]: false,
		[SECTION_NEXT7]: false,
		[SECTION_UPCOMING]: false
	};
	function toggleSection(section: string) {
		collapsedSections[section] = !collapsedSections[section];
	}

	let view: 'active' | 'recurring' | 'history' = 'active';

	// Change from reactive assignment to top-level const for billHistory
	const paidBills = liveQuery<Bill[]>(async () => {
		const profile = get(userProfile);
		if (!profile) return [];
		return await db.bills.where('profileId').equals(profile.id).and(bill => bill.isPaid === true).reverse().sortBy('paidAt');
	});

	let showAddRecurringBillModal = false;
	let showRecurring = false;

	function toggleRecurring(show: boolean) {
	  showRecurring = show;
	}

	function handleRecurringBillSave(event: CustomEvent) {
	  const bill = event.detail.bill;
	  // Attach profileId from current user
	  const profile = get(userProfile);
	  if (profile) {
	    bill.profileId = profile.id;
	    db.recurringBills.add(bill);
	  }
	  showAddRecurringBillModal = false;
	}
</script>

<div class="flex flex-col min-h-screen items-center justify-start bg-[#F9FAFB]">
  <div class="w-full max-w-md flex flex-col flex-1 bg-[#F9FAFB] border border-[#F9FAFB] rounded-none shadow-none min-h-screen" style="min-height: 100vh;">
    <div class="space-y-6 bg-[#F9FAFB]" style="margin:0;">
      <!-- Three-wide tab design for Ativas, Recorrentes, and Concluídas -->
      <div class="flex w-full max-w-md mx-auto rounded-[12px] bg-[#E2E8F0] p-1 mb-0 sticky top-[72px] z-40">
        <button
          class="flex-1 px-4 py-2 rounded-l-[12px] font-semibold focus:outline-none transition text-sm font-['Nunito_Sans','Nunito Sans',sans-serif]"
          class:bg-[#10B981]={view === 'active'}
          class:text-white={view === 'active'}
          class:bg-white={view !== 'active'}
          class:text-[#1F2937]={view !== 'active'}
          on:click={() => setView('active')}
        >
          Ativas
        </button>
        <button
          class="flex-1 px-4 py-2 font-semibold focus:outline-none transition text-sm font-['Nunito_Sans','Nunito Sans',sans-serif]"
          class:bg-[#10B981]={view === 'recurring'}
          class:text-white={view === 'recurring'}
          class:bg-white={view !== 'recurring'}
          class:text-[#1F2937]={view !== 'recurring'}
          on:click={() => setView('recurring')}
        >
          Recorrentes
        </button>
        <button
          class="flex-1 px-4 py-2 rounded-r-[12px] font-semibold focus:outline-none transition text-sm font-['Nunito_Sans','Nunito Sans',sans-serif]"
          class:bg-[#10B981]={view === 'history'}
          class:text-white={view === 'history'}
          class:bg-white={view !== 'history'}
          class:text-[#1F2937]={view !== 'history'}
          on:click={() => setView('history')}
        >
          Concluídas
        </button>
      </div>

      <!-- Separator below the Ativas/Concluídas buttons -->
      <div class="w-full max-w-md mx-auto h-[1px] bg-gray-300 mb-2 sticky top-[120px] z-30"></div>

      <!-- Make the bills list scrollable and take up remaining space -->
      <div class="flex-1 overflow-y-auto" style="max-height: calc(100vh - 180px);">
        {#if view === 'active'}
          {#if !$allBills || $allBills.length === 0}
            <div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p class="text-gray-500">Nenhuma conta cadastrada.</p>
              <button class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-4" on:click={openAddBillModal}>
                Adicionar sua primeira conta
              </button>
            </div>
          {/if}

          <!-- Render all bills in a single list, no headers -->
          {#if $allBills && $allBills.length > 0}
            <div class="space-y-2 mt-2">
              {#each $allBills as bill (bill.id)}
                <BillItem {bill} on:edit={() => openEditBillModal(bill)} on:pay={() => handlePayWithPix(bill)} on:delete={() => promptForDelete(bill)} />
              {/each}
            </div>
          {/if}

          <div class="text-center pt-4">
            <button on:click={toggleShowAll} class="inline-block rounded { $showAll ? 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' } px-6 py-2 text-white font-semibold shadow focus:outline-none focus:ring-2 focus:ring-offset-2 transition">
              {#if !$showAll}
                Mostrar contas dos próximos 90 dias
              {:else}
                Minimizar
              {/if}
            </button>
          </div>
        {/if}

        {#if view === 'recurring'}
          <div class="space-y-3">
            <!-- Floating Action Button for adding new recurring bill -->
            <div class="fixed bottom-24 right-5 z-20">
              <button
                class="flex items-center justify-center w-14 h-14 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition"
                aria-label="Adicionar Nova Conta Recorrente"
                on:click={() => showAddRecurringBillModal = true}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            {#if $recurringBills && $recurringBills.length > 0}
              {#each $recurringBills as bill (bill.id)}
                <div class="overflow-hidden rounded-lg bg-white shadow-sm flex items-center p-4">
                  <div class="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-green-100 text-green-700 mr-4">
                    <span class="text-xl font-bold">{bill.dueDay}</span>
                    <span class="text-xs font-semibold">DIA</span>
                  </div>
                  <div class="flex-grow">
                    <p class="font-semibold text-gray-800">{bill.name}</p>
                    <p class="text-sm text-gray-500">{bill.recipient}</p>
                    <p class="text-xs text-gray-400">{bill.category}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold text-green-700">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    {#if bill.lastPaidDate}
                      <p class="text-xs text-gray-400">Último pagamento: {new Date(bill.lastPaidDate).toLocaleDateString('pt-BR')}</p>
                    {/if}
                  </div>
                </div>
              {/each}
            {:else}
              <div class="text-center text-gray-400 py-8">Nenhuma conta recorrente cadastrada.</div>
            {/if}
          </div>
        {/if}

        {#if view === 'history'}
          <div>
            {#if $paidBills && $paidBills.length > 0}
              {#each $paidBills as bill (bill.id)}
                <div class="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200 text-xs font-['Nunito_Sans','Nunito Sans',sans-serif] text-[#1F2937] mb-0" style="margin-bottom:12px;height:64px;">
                  <div class="relative">
                    <div class="absolute left-0 top-0 w-full h-1.5 bg-[#FFD700] rounded-t-lg"></div>
                    <div class="flex items-center p-2 relative z-10" style="height:64px;">
                      <span class="flex flex-col items-center justify-center h-10 w-10 mr-1">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="2" y="2" width="36" height="36" rx="4" stroke="#FFD700" stroke-width="4"/>
                          <path d="M11 20L18 27L30 15" stroke="#FFD700" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                      <div class="ml-0 flex-grow">
                        <p class="font-semibold text-[#1F2937] truncate">{bill.name || '-'}</p>
                        <p class="text-xs text-[#6B7280]">Pago em {bill.paidAt ? new Date(bill.paidAt).toLocaleDateString('pt-BR') : '-'}</p>
                        {#if bill.note}
                          <p class="italic mt-1">{bill.note}</p>
                        {/if}
                      </div>
                      <div class="px-2 text-right">
                        <p class="text-[#1F2937] truncate">R$ {bill.amountPaid?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? bill.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '-'}</p>
                        <p class="text-xs text-[#6B7280] font-['Nunito_Sans','Nunito Sans',sans-serif]">{bill.paymentMethod || '-'}</p>
                        {#if bill.installmentInfo}
                          <p class="text-gray-500">{bill.installmentInfo}</p>
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="text-center text-gray-400 py-8">Nenhum pagamento registrado ainda.</div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Floating Action Button for adding new bill -->
  {#if view === 'active'}
  <div class="fixed bottom-24 right-5 z-20">
    <button
      class="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
      aria-label="Adicionar Nova Conta"
      on:click={openAddBillModal}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </button>
  </div>
  {/if}

  <AddBillModal bind:showModal={showAddBillModal} {billToEdit} onClose={closeAddBillModal} onBillSaved={handleBillSaved} />
  <ConfirmationModal
    bind:showModal={showDeleteModal}
    title="Excluir Conta"
    message={billToDelete ? `Tem certeza que deseja excluir a conta "${billToDelete.name}"?` : ''}
    on:confirm={handleDeleteConfirmed}
    on:cancel={handleDeleteCancelled}
  />
  {#if showPayModal && billToPay}
    <PayBillModal
      bind:showModal={showPayModal}
      bill={billToPay}
      paymentError={paymentError}
      on:close={closePayModal}
      on:pay={handleBillPaid}
    />
  {/if}
  <AddRecurringBillModal
    bind:showModal={showAddRecurringBillModal}
    on:save={handleRecurringBillSave}
    on:close={() => showAddRecurringBillModal = false}
    onClose={() => showAddRecurringBillModal = false}
  />
</div>