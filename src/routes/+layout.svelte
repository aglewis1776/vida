<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/db';
  import { v4 as uuidv4 } from 'uuid';
  import type { UserProfile } from '$lib/types';
  import Header from '$lib/components/Header.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { userProfile } from '$lib/stores';
  import '../app.css'; // Import global Tailwind CSS here
onMount(async () => {
    console.log('Layout onMount: Starting profile check...');
    try {
      const existingProfile = await db.profiles.toCollection().first();
      console.log('Layout onMount: Checked for existing profile. Found:', existingProfile);

      if (existingProfile) {
        userProfile.set(existingProfile);
        console.log('Layout onMount: Set existing profile in store.');
      } else {
        console.log('Layout onMount: No existing profile, creating new one.');
        const newProfile: UserProfile = {
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        await db.profiles.add(newProfile);
        userProfile.set(newProfile);
        console.log('Layout onMount: Created and set new profile in store.');
      }
    } catch (error) {
      console.error('Layout onMount: An error occurred!', error);
    }
  });
</script>

<div class="font-sans antialiased text-gray-900 bg-gray-50 min-h-screen">
  <Header />
  <main class="p-4 pb-32">
    <slot />
  </main>
  <BottomNav />
</div>