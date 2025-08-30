/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'whoop-green': 'rgb(0, 255, 136)',
        'whoop-red': 'rgb(255, 59, 48)',
        'whoop-yellow': 'rgb(255, 214, 10)',
        'whoop-blue': 'rgb(0, 122, 255)',
        'whoop-purple': 'rgb(151, 71, 255)',
        'whoop-cyan': 'rgb(0, 194, 255)',
        'background': 'rgb(10, 10, 10)',
        'background-secondary': 'rgb(26, 26, 26)',
        'card': 'rgb(30, 30, 30)',
        'card-elevated': 'rgb(37, 37, 37)',
        'foreground': 'rgb(255, 255, 255)',
        'muted-foreground': 'rgb(142, 142, 147)',
        'secondary-foreground': 'rgb(179, 179, 179)',
        'border': 'rgb(44, 44, 46)',
        'input': 'rgb(37, 37, 37)',
      },
      borderRadius: {
        'whoop': '20px',
        'whoop-sm': '12px',
        'whoop-md': '16px',
        'whoop-lg': '20px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}