/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        airsense: {
          bg: "#F4F6F4",          // Dull white / light sage-tinted background
          card: "#FFFFFF",        // Clean card white
          cardMuted: "#ECF1EC",   // Subtle off-white / dull surface
          border: "#DCE3DC",      // Soft border
          borderLight: "#E8EEE8",
          dark: "#0F1F17",        // Deep forest charcoal for text
          charcoal: "#1F2E26",
          muted: "#5A6B61",       // Muted slate-green for labels
          primary: "#1A5632",     // Deep foliage/forest green
          primaryHover: "#144226",
          emerald: "#10B981",     // Vibrant green accent
          emeraldLight: "#E8F8F0",// Pale green tag background
          sage: "#84A98C",
          teal: "#0D9488",
          cyan: "#06B6D4",
        },
        aqi: {
          good: "#00E400",
          goodBg: "#EDFDF0",
          satisfactory: "#84CC16",
          satisfactoryBg: "#F7FEE7",
          moderate: "#EAB308",
          moderateBg: "#FEFCE8",
          poor: "#F97316",
          poorBg: "#FFF7ED",
          veryPoor: "#EF4444",
          veryPoorBg: "#FEF2F2",
          severe: "#881337",
          severeBg: "#FFF1F2",
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(18, 38, 25, 0.05), 0 1px 2px -1px rgba(18, 38, 25, 0.05)",
        card: "0 4px 6px -1px rgba(18, 38, 25, 0.06), 0 2px 4px -2px rgba(18, 38, 25, 0.04)",
        elevated: "0 10px 15px -3px rgba(18, 38, 25, 0.08), 0 4px 6px -4px rgba(18, 38, 25, 0.04)",
      }
    },
  },
  plugins: [],
}
