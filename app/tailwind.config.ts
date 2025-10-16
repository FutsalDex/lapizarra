import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        body: ['"PT Sans"', 'sans-serif'],
        headline: ['"Poppins"', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addBase }) {
      addBase({
        ':root': {
          '--background': '210 20% 98%',
          '--foreground': '224 10% 20%',
          '--card': '0 0% 100%',
          '--card-foreground': '224 10% 20%',
          '--popover': '0 0% 100%',
          '--popover-foreground': '224 10% 20%',
          '--primary': '158 44% 52%',
          '--primary-foreground': '0 0% 100%',
          '--secondary': '210 40% 96.1%',
          '--secondary-foreground': '0 0% 9%',
          '--muted': '210 20% 94%',
          '--muted-foreground': '215 10% 45%',
          '--accent': '158 44% 45%',
          '--accent-foreground': '0 0% 100%',
          '--destructive': '0 84.2% 60.2%',
          '--destructive-foreground': '0 0% 98%',
          '--border': '210 20% 88%',
          '--input': '210 20% 88%',
          '--ring': '158 44% 45%',
          '--radius': '0.5rem',
        },
        '.dark': {
          '--background': '222.2 84% 4.9%',
          '--foreground': '0 0% 98%',
          '--card': '222.2 84% 4.9%',
          '--card-foreground': '0 0% 98%',
          '--popover': '222.2 84% 4.9%',
          '--popover-foreground': '0 0% 98%',
          '--primary': '158 44% 52%',
          '--primary-foreground': '0 0% 100%',
          '--secondary': '0 0% 14.9%',
          '--secondary-foreground': '0 0% 98%',
          '--muted': '0 0% 14.9%',
          '--muted-foreground': '0 0% 63.9%',
          '--accent': '158 44% 45%',
          '--accent-foreground': '0 0% 100%',
          '--destructive': '0 62.8% 30.6%',
          '--destructive-foreground': '0 0% 98%',
          '--border': '0 0% 14.9%',
          '--input': '0 0% 14.9%',
          '--ring': '158 44% 52%',
        },
      });
      addBase({
        '*': {
          '@apply border-border': {},
        },
        'body': {
          '@apply bg-background text-foreground': {},
        },
      });
    },
  ],
} satisfies Config;
