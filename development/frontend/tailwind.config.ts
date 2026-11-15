import type { Config } from 'tailwindcss';

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
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          foreground: 'var(--primary-foreground)',
        },
        ring: 'var(--ring)',
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        card: {
          DEFAULT: 'var(--bg-card)',
          foreground: 'var(--text-primary)',
        },
        border: 'var(--border-subtle)',
        muted: {
          DEFAULT: 'var(--text-muted)',
          foreground: 'var(--text-secondary)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'var(--font-dela)', 'sans-serif'],
        body: ['var(--font-body)', 'var(--font-rose)', 'sans-serif'],
        dela: ['var(--font-heading)', 'var(--font-dela)', 'sans-serif'],
        rose: ['var(--font-body)', 'var(--font-rose)', 'sans-serif'],
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
