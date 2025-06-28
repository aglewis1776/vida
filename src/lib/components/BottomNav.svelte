<!-- src/lib/components/BottomNav.svelte -->
<nav
  class="bg-white/80 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-10 h-16 border-t border-gray-200"
>
  <div class="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
    <!-- Bills Link -->
    <a
      href="/"
      class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50"
    >
      <!-- SVG Icon for Bills -->
      <svg
        class="w-6 h-6 mb-1 text-gray-500"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 20"
      >
        <path
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 3V1m0 18v-2M5.05 5.05L3.636 3.636m12.728 12.728L14.95 14.95M3 10H1m18 0h-2M5.05 14.95l-1.414 1.414M16.364 3.636L14.95 5.05M15 10a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"
        ></path>
      </svg>
      <span class="text-sm text-gray-600">Contas</span>
    </a>
    <!-- Debts Link (we will create this page later) -->
    <a
      href="/debts"
      class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50"
    >
      <!-- SVG Icon for Debts/Credit Card -->
      <svg
        class="w-6 h-6 mb-1 text-gray-500"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M19 4h-1.5a1.5 1.5 0 0 0-1.5 1.5V14a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1V5.5A1.5 1.5 0 0 0 19 4Z"
        ></path><path
          d="M1.5 5.5a1 1 0 0 1 1-1H14a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V5.5Z"
        ></path>
      </svg>
      <span class="text-sm text-gray-600">Dívidas</span>
    </a>
    <!-- Profile Link (we will create this page later) -->
    <a
      href="/profile"
      class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50"
    >
      <!-- SVG Icon for Profile -->
      <svg
        class="w-6 h-6 mb-1 text-gray-500"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9.05 14.5h1.9c.428 0 .845.166 1.149.462A8.949 8.949 0 0 1 10 18Z"
        ></path>
      </svg>
      <span class="text-sm text-gray-600">Perfil</span>
    </a>
  </div>
</nav>
