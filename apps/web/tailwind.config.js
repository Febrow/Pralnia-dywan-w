/** @type {import('tailwindcss').Config} */
// Paleta — TYLKO te 4 kolory marki:
//   brand   #06377B  (granatowy)
//   accent  #F2D701  (żółty)
//   ink     #001914  (czarny)
//   white   #FFFFFF
// Skala (50..900) jest mieszaniną z bielą lub czernią — wyłącznie do akcentów
// (np. delikatne tło, subtelne hover). Wszystkie istotne elementy muszą być
// jednym z 4 kolorów bazowych.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6edf5',
          100: '#cdd9eb',
          200: '#99b3d6',
          300: '#668dc1',
          400: '#3367ad',
          500: '#06377B',
          600: '#053069',
          700: '#042a5c',
          800: '#04244e',
          900: '#031a3a',
          DEFAULT: '#06377B',
        },
        accent: {
          50:  '#fff9d6',
          100: '#fff3ad',
          300: '#f7e23a',
          400: '#f4d911',
          500: '#F2D701',
          600: '#cab500',
          700: '#a39200',
          DEFAULT: '#F2D701',
        },
        ink: {
          50:  '#e0e6e5',
          100: '#b3c1be',
          300: '#4a615c',
          500: '#1a3530',
          700: '#0a221d',
          900: '#001914',
          DEFAULT: '#001914',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'tile': '0 8px 24px -8px rgba(0,25,20,0.35)',
        'tile-hover': '0 12px 32px -6px rgba(0,25,20,0.45)',
      },
    },
  },
  plugins: [],
};
