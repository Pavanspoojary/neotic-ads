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
        // Jam Color Tokens
        'obsidian-plum': '#130f18',
        'graphite-plum': '#21192a',
        'smoke-plum': '#2e2d36',
        'ink-border': '#252542',
        carbon: '#25292e',
        'mist-gray': '#8b94a3',
        'soft-mist': '#d0cfd1',
        bone: '#e5e7eb',
        paper: '#ffffff',
        'signal-mint': '#73e5bf',
        'mint-halo': '#c5ffe7',
        'electric-violet': '#a37af5',
        'deep-violet': '#744ec2',
        lilac: '#b89fd4',
        mauve: '#947fac',
        'jam-pink': '#ff4070',

        // Tonal surface aliases
        jam: {
          canvas: '#130f18',
          card: '#21192a',
          elevated: '#2e2d36',
          border: 'rgba(229, 231, 235, 0.12)',
          'border-light': 'rgba(229, 231, 235, 0.18)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'SF Pro Text', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'SF Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '24': '24px',
        card: '24px',
        btn: '12px',
        input: '12px',
        nav: '8px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 0 0 1px rgba(0, 0, 0, 0.08), 0 4px 16px -2px rgba(0, 0, 0, 0.05)',
        'floating': '0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'mint-led': 'rgba(19, 15, 24, 0.1) 0px 0px 0px 2px, rgba(115, 229, 191, 0.2) 0px 20px 25px -5px, rgba(115, 229, 191, 0.2) 0px 8px 10px -6px',
        'mint-inset': 'rgb(197, 255, 231) 0px 1px 1px 0px inset',
        'product-window': '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'hairline': '0 0 0 1px rgba(229, 231, 235, 0.12)',
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.025em',
        tight: '-0.015em',
      },
    },
  },
  plugins: [],
};
