import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    }
  },

  plugins: [require("@tailwindcss/typography")]
} as Config;
