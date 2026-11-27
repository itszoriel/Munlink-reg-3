/**
 * Tailwind preset for MunLink Zambales.
 *
 * One calm civic palette: deep navy for actions and structure, slate neutrals,
 * provincial green only for the seal/brand mark, and standard semantic colours
 * (emerald success, amber warning, red error). Legacy palette names (ocean,
 * primary, sky, blue, indigo, cyan) all resolve to navy so older markup follows
 * the brand without per-file edits.
 */
const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')

const navy = {
  50: '#f2f5fa',
  100: '#e3e9f3',
  200: '#c5d1e5',
  300: '#9aaed0',
  400: '#6a85b5',
  500: '#46659c',
  600: '#2f4d82',
  700: '#243d6b',
  800: '#1c3157',
  900: '#14233f',
  950: '#0c1628',
}

const flat = (hex) => `linear-gradient(${hex}, ${hex})`

module.exports = {
  theme: {
    extend: {
      screens: {
        xxs: '320px',
        xs: '480px',
      },
      colors: {
        navy,
        primary: navy,
        ocean: navy,
        sky: navy,
        blue: navy,
        indigo: navy,
        cyan: navy,
        forest: colors.emerald,
        sunset: colors.amber,
        purple: colors.violet,
        yellow: colors.amber,
        neutral: colors.slate,
        zambales: {
          green: '#1B5E20',
          gold: '#F57F17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Display serif retired: headings use the same sans face.
        serif: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          md: '2rem',
        },
        screens: {
          '2xl': '1280px',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.06)',
      },
      // Kept as names for older markup; rendered as flat brand colours.
      backgroundImage: {
        'ocean-gradient': flat(navy[700]),
        'forest-gradient': flat('#047857'),
        'sunset-gradient': flat('#b45309'),
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      animation: {
        float: 'none',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        shimmer: 'shimmer 2s infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
    },
  },
  plugins: [
    plugin(function({ addComponents, addUtilities, theme }) {
      addComponents({
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '44px',
          paddingLeft: theme('spacing.3'),
          paddingRight: theme('spacing.3'),
          paddingTop: theme('spacing.2'),
          paddingBottom: theme('spacing.2'),
          fontSize: theme('fontSize.sm')[0],
          gap: theme('spacing.2'),
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        },
        '.btn-ghost': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '44px',
          paddingLeft: theme('spacing.3'),
          paddingRight: theme('spacing.3'),
          paddingTop: theme('spacing.2'),
          paddingBottom: theme('spacing.2'),
          color: theme('colors.neutral.700'),
          backgroundColor: 'transparent',
        },
        '.btn-primary': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '44px',
          paddingLeft: theme('spacing.3'),
          paddingRight: theme('spacing.3'),
          paddingTop: theme('spacing.2'),
          paddingBottom: theme('spacing.2'),
          color: theme('colors.white'),
          backgroundColor: theme('colors.navy.700'),
          borderRadius: theme('borderRadius.md'),
          transitionProperty: 'background-color, color',
          transitionDuration: '150ms',
        },
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          border: `1px solid ${theme('colors.slate.200')}`,
          boxShadow: theme('boxShadow.card'),
          padding: theme('spacing.6'),
          minWidth: 0,
        },
        '.input-field': {
          width: '100%',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          paddingTop: theme('spacing.2'),
          paddingBottom: theme('spacing.2'),
          borderWidth: '1px',
          borderColor: theme('colors.gray.300'),
          borderRadius: theme('borderRadius.lg'),
          outline: '2px solid transparent',
          outlineOffset: '2px',
        },
        '.container-responsive': {
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: theme('screens.xl'),
          paddingLeft: theme('spacing.3'),
          paddingRight: theme('spacing.3'),
        },
        '.responsive-img': {
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
        },
        '.pill': {
          display: 'inline-flex',
          alignItems: 'center',
          paddingLeft: theme('spacing.3'),
          paddingRight: theme('spacing.3'),
          paddingTop: '0.375rem',
          paddingBottom: '0.375rem',
          borderRadius: theme('borderRadius.full'),
          fontSize: theme('fontSize.sm')[0],
          fontWeight: theme('fontWeight.medium'),
        },
        '.pill-neutral': {
          backgroundColor: theme('colors.gray.100'),
          color: theme('colors.gray.700'),
        },
        '.pill-ocean': {
          backgroundColor: theme('colors.ocean.600'),
          color: theme('colors.white'),
        },
        '.skeleton': {
          backgroundColor: theme('colors.gray.200'),
          borderRadius: theme('borderRadius.DEFAULT'),
        },
        '.skeleton-card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.md'),
          overflow: 'hidden',
        },
        '.skeleton-image': {
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: theme('colors.gray.200'),
        },
        '.skeleton-image::after': {
          content: '""',
          position: 'absolute',
          inset: '0',
          transform: 'translateX(-100%)',
          backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent)',
          animation: theme('animation.shimmer'),
        },
      })

      addUtilities({
        '.text-fluid-3xl': { fontSize: 'clamp(1.75rem, 1.2rem + 2vw, 3rem)' },
        '.text-fluid-5xl': { fontSize: 'clamp(2.25rem, 1.2rem + 3vw, 3.5rem)' },
        '.text-fluid-6xl': { fontSize: 'clamp(2.5rem, 1.1rem + 5.5vw, 8rem)' },
        '.text-fluid-xl': { fontSize: 'clamp(1.125rem, 0.7rem + 1.4vw, 2.25rem)' },
      })
    })
  ],
}


