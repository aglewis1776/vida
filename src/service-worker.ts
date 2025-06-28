// src/service-worker.ts

/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;

const ASSETS_TO_CACHE = build.concat(files);

// The install event runs when the service worker is first installed.
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS_TO_CACHE))
			.then(() => {
				(self as unknown as ServiceWorkerGlobalScope).skipWaiting();
			})
	);
});

// The activate event runs when the service worker is activated.
// It's a good place to clean up old caches.
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE) {
					await caches.delete(key);
				}
			}
			(self as unknown as ServiceWorkerGlobalScope).clients.claim();
		})
	);
});


// The fetch event intercepts network requests.
// This example uses a "cache-first" strategy.
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET' || event.request.headers.has('range')) {
		return;
	}

	const url = new URL(event.request.url);

	// Don't try to handle e.g. POST requests
	if (!ASSETS_TO_CACHE.includes(url.pathname)) {
		return;
	}
	
	event.respondWith(
		caches.match(event.request).then(async (cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}
			return caches.open(CACHE).then(cache => {
				return fetch(event.request).then(response => {
					return cache.put(event.request, response.clone()).then(() => {
						return response;
					});
				});
			});
		})
	);
});
