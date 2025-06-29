<script lang="ts">
  import { liveQuery } from 'dexie';
  import { db } from '$lib/db';
  import { userProfile } from '$lib/stores';

  import BillList from '$lib/components/BillList.svelte';
  import AddBillModal from '$lib/components/AddBillModal.svelte';
  import {
    isToday,
    isTomorrow,
    isAfter,
    startOfToday,
    endOfToday,
    addDays,
  } from 'date-fns';

  let showModal = $state(false);

  // THE FINAL FIX IS HERE:
  // Wrap liveQuery in $derived to make it reactive to changes in $userProfile.
  // And change `const` to `let`.
  let bills = $derived(liveQuery(() => {
    console.log('Page liveQuery: Running. Current $userProfile is:', $userProfile);

    if (!$userProfile?.id) return [];
    
    console.log('Page liveQuery: User profile found! Fetching bills...');
    return db.bills.where('profileId').equals($userProfile.id).toArray();
  }));

  let todayBills = $derived(
    $bills?.filter((bill) => isToday(new Date(bill.dueDate))) ?? []
  );
  let tomorrowBills = $derived(
    $bills?.filter((bill) => isTomorrow(new Date(bill.dueDate))) ?? []
  );
  let next7DaysBills = $derived(
    $bills?.filter((bill) => {
      const dueDate = new Date(bill.dueDate);
      const tomorrow = endOfToday();
      const inOneWeek = addDays(tomorrow, 7);
      return isAfter(dueDate, tomorrow) && isAfter(inOneWeek, dueDate);
    }) ?? []
  );
</script>

<BillList title="Vence Hoje" bills={todayBills} />
<BillList title="Vence Amanhã" bills={tomorrowBills} />
<BillList title="Próximos 7 Dias" bills={next7DaysBills} />

{#if showModal}
  <AddBillModal onclose={() => (showModal = false)} />
{/if}

<div class="fixed bottom-24 right-5 space-y-3">
  <button
    onclick={() => (showModal = true)}
    class="w-14 h-14 flex items-center justify-center bg-red-500 text-white rounded-full shadow-lg"
  >
    <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M20 12H4"
      ></path>
    </svg>
  </button>
  <button
    class="w-14 h-14 flex items-center justify-center bg-green-500 text-white rounded-full shadow-lg"
  >
    <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 4v16m8-8H4"
      ></path>
    </svg>
  </button>
</div>