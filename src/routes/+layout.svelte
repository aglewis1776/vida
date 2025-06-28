<!-- src/routes/+layout.svelte -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { db } from '$lib/db';
  import { v4 as uuidv4 } from 'uuid';
  import type { UserProfile } from '$lib/types';
  
  // Import global styles
  import '../app.css';

  // A Svelte store to hold the current user profile.
  // This makes it accessible to any other component in the app.
  export const userProfile = writable<UserProfile | null>(null);

  onMount(async () => {
    // This code runs only in the browser after the component has mounted.
    try {
      // 1. Check if a profile already exists in the local database.
      const existingProfile = await db.profiles.toCollection().first();

      if (existingProfile) {
        // 2. If it exists, set it in our store.
        userProfile.set(existingProfile);
        console.log('Existing profile loaded:', existingProfile);
      } else {
        // 3. If it does NOT exist, create a new one.
        const newProfile: UserProfile = {
          id: uuidv4(), // Generate a new unique ID
          createdAt: new Date().toISOString(),
        };
        
        // Save the new profile to the database.
        await db.profiles.add(newProfile);
        // Set it in our store.
        userProfile.set(newProfile);
        console.log('No profile found. New profile created:', newProfile);
      }
    } catch (error) {
      console.error('Failed to initialize user profile:', error);
    }
  });
</script>

<!-- The <slot /> component is where SvelteKit will render the content of the current page (like your +page.svelte) -->
<div class="font-sans antialiased text-gray-900">
  <slot />
</div>
