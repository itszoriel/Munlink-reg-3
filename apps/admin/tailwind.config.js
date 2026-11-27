/** @type {import('tailwindcss').Config} */
// Colours, fonts and shadows come from the shared MunLink Zambales preset.
module.exports = {
  presets: [require('../../packages/ui/tailwind.preset.cjs')],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Include shared UI package so Tailwind sees classes used there
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Classes built from data at runtime (report bars, category chips)
    'bg-ocean-600', 'bg-forest-600', 'bg-sunset-600', 'bg-purple-600', 'bg-yellow-600', 'bg-red-600', 'bg-neutral-600',
    'bg-forest-100', 'text-forest-700',
    'bg-ocean-100', 'text-ocean-700',
    'bg-sunset-100', 'text-sunset-700',
    'bg-purple-100', 'text-purple-700',
    'bg-yellow-100', 'text-yellow-700',
    'bg-red-100', 'text-red-700',
    'bg-red-500', 'text-red-600',
  ],
  plugins: [],
}
