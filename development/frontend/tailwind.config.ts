import type { Config } from 'tailwindcss';

/**
 * Wraps a CSS variable so Tailwind opacity modifiers (e.g. `bg-primary/20`) work.
 * Plain `var(--x)` colors silently drop the modifier in Tailwind 3; color-mix keeps theming via CSS vars.
 */
const token = (name: string) => `color-mix(in srgb, var(${name}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        owtlet: {
          ink: '#0D221E',
          mint: '#70F1C7',
          sage: '#BBD7D1',
          mist: '#F8FAFC',
          night: '#040B0A',
          volt: '#DFFE52',
          ember: '#ED742E',
        },
        primary: {
          DEFAULT: token('--primary'),
          hover: token('--primary-hover'),
          foreground: token('--primary-foreground'),
        },
        secondary: {
          DEFAULT: token('--secondary'),
          foreground: token('--secondary-foreground'),
        },
        accent: {
          DEFAULT: token('--accent'),
          foreground: token('--accent-foreground'),
        },
        ink: {
          DEFAULT: token('--ink'),
          foreground: token('--primary-foreground'),
        },
        ring: token('--ring'),
        background: token('--bg-primary'),
        foreground: token('--text-primary'),
        card: {
          DEFAULT: token('--bg-card'),
          foreground: token('--text-primary'),
        },
        border: token('--border-subtle'),
        muted: {
          DEFAULT: token('--text-muted'),
          foreground: token('--text-secondary'),
        },
        success: token('--success'),
        warning: {
          DEFAULT: token('--warning'),
          foreground: token('--warning-foreground'),
        },
        danger: token('--danger'),
        // shadcn-style alias used across checkout/account components
        destructive: token('--danger'),
        info: token('--info'),
        kraft: token('--kraft'),
        surface: {
          muted: token('--bg-muted'),
        },
        // Strain-type color system (Sativa = Volt, Hybrid = Mint, Indica = Ink)
        strain: {
          sativa: {
            DEFAULT: token('--strain-sativa'),
            foreground: token('--strain-sativa-foreground'),
            tint: token('--strain-sativa-tint'),
          },
          hybrid: {
            DEFAULT: token('--strain-hybrid'),
            foreground: token('--strain-hybrid-foreground'),
            tint: token('--strain-hybrid-tint'),
          },
          indica: {
            DEFAULT: token('--strain-indica'),
            foreground: token('--strain-indica-foreground'),
            tint: token('--strain-indica-tint'),
          },
          cbd: {
            DEFAULT: token('--strain-cbd'),
            foreground: token('--strain-cbd-foreground'),
            tint: token('--strain-cbd-tint'),
          },
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        dela: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        rose: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        marquee: {
          to: { transform: 'translateX(-50%)' },
        },
        float: {
          '50%': { transform: 'translateY(-7px)' },
        },
        'live-ring': {
          '0%': { boxShadow: '0 0 0 0 var(--live-ring)' },
          '80%, 100%': { boxShadow: '0 0 0 9px transparent' },
        },
      },
      animation: {
        marquee: 'marquee 46s linear infinite',
        float: 'float 4s ease-in-out infinite',
        'live-ring': 'live-ring 1.8s ease-out infinite',
      },
      // Storefront content column (design v3: 1120px incl. 28px gutters)
      maxWidth: {
        content: '1120px',
      },
      borderRadius: {
        DEFAULT: 'var(--radius, 0.75rem)',
        lg: 'var(--radius, 0.75rem)',
        md: 'calc(var(--radius, 0.75rem) - 2px)',
        sm: 'calc(var(--radius, 0.75rem) - 4px)',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

export default config;
