export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          inverted: "var(--color-text-inverted)",
        },
        icon: {
          primary: "var(--color-icon-primary)",
          secondary: "var(--color-icon-secondary)",
          tertiary: "var(--color-icon-tertiary)",
          inverted: "var(--color-icon-inverted)",
        },
        accent: {
          blue: "var(--color-accent-blue)",
          red: "var(--color-accent-red)",
          orange: "var(--color-accent-orange)",
          green: "var(--color-accent-green)",
        },
      },
    },
  },
  plugins: [],
}
