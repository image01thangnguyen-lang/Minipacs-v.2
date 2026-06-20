/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vin: {
          root: 'var(--vin-bg-root)',
          shell: 'var(--vin-bg-shell)',
          sidebar: 'var(--vin-bg-sidebar)',
          panel: 'var(--vin-bg-panel)',
          panel2: 'var(--vin-bg-panel-2)',
          table: 'var(--vin-bg-table)',
          tableAlt: 'var(--vin-bg-table-alt)',
          tableHover: 'var(--vin-bg-table-hover)',
          tableSelected: 'var(--vin-bg-table-selected)',
          border: 'var(--vin-border-subtle)',
          borderStrong: 'var(--vin-border-strong)',
          accent: 'var(--vin-accent)',
          accentHover: 'var(--vin-accent-hover)',
          text: 'var(--vin-text-primary)',
          text2: 'var(--vin-text-secondary)',
          muted: 'var(--vin-text-muted)',
          faint: 'var(--vin-text-faint)',
          'status-new-bg': 'var(--vin-status-new-bg)',
          'status-new-text': 'var(--vin-status-new-text)',
          'status-approved-bg': 'var(--vin-status-approved-bg)',
          'status-approved-text': 'var(--vin-status-approved-text)',
          'status-warning-bg': 'var(--vin-status-warning-bg)',
          'status-danger-bg': 'var(--vin-status-danger-bg)',
        },
      },
    },
  },
  plugins: [],
}
