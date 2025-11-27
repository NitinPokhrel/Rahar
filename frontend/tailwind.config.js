/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
     
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#007AFF", // MacOS blue
        secondary: "#F0F0F5", // Light gray background
        accent: "#2E3A59", // Dark slate blue
        glassyWhite: "rgba(255, 255, 255, 0.9)", // Semi-transparent white
        glassyOverlay: "rgba(0, 0, 0, 0.1)", // Overlay shadow
        buttonHover: "#005BB5", // Darker blue for hover states
      },
      boxShadow: {
        mainShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", // Soft shadow for cards
        headerShadow: "0 2px 10px rgba(0, 0, 0, 0.2)", // Slightly stronger shadow for header
      },
      backdropBlur: {
        md: "10px", // Medium blur effect for glassy look
      },
      borderRadius: {
        md: "8px",
        lg: "10px",
      },
    },
  },

  plugins: [require("tailwind-scrollbar")],
};
