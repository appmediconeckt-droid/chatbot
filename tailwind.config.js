import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: "#4648d4",
        "primary-container": "#6063ee",
        "on-primary-container": "#fffbff",
        "secondary-container": "#39b8fd",
        background: "#f8f9ff",
        "on-background": "#0b1c30",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#464554",
        "outline-variant": "#c7c4d7",
        "surface-container-high": "#dce9ff",
      },
      fontFamily: {
        manrope: ["Manrope", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [forms, containerQueries],
};
