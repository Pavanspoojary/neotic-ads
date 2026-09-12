import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'SponsorSlot — In-App Micro-Sponsorship Registry & Marketplace',
  description: 'Connect high-engagement developer tools and Chrome extensions with context-driven B2B advertisers on flat-rate 30-day terms.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#090a0f] text-zinc-100 antialiased font-sans selection:bg-indigo-500 selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:font-semibold focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-[#090a0f] transition-transform"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

