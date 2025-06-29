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
		try {
			let profile = await db.profiles.toCollection().first();

			if (profile) {
				// For existing users, ensure the new balance fields exist.
				// If they don't, set them to 0. This is a simple data migration.
				let needsUpdate = false;
				if (typeof profile.cashBalance !== 'number') {
					profile.cashBalance = 0;
					needsUpdate = true;
				}
				if (typeof profile.pixBalance !== 'number') {
					profile.pixBalance = 0;
					needsUpdate = true;
				}

				// If we added the fields, update the database record.
				if (needsUpdate) {
					await db.profiles.update(profile.id, {
						cashBalance: profile.cashBalance,
						pixBalance: profile.pixBalance
					});
				}
				userProfile.set(profile);
			} else {
				// For new users, create the profile with the balances set to 0.
				const newProfile: UserProfile = {
					id: uuidv4(),
					createdAt: new Date().toISOString(),
					cashBalance: 0,
					pixBalance: 0
				};
				await db.profiles.add(newProfile);
				userProfile.set(newProfile);
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