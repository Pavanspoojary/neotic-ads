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
      <body className="min-h-screen bg-[#130f18] text-[#8b94a3] antialiased font-sans selection:bg-[#73e5bf] selection:text-[#130f18]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#ff4070] focus:text-white focus:font-semibold focus:rounded-btn focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#73e5bf] transition-transform"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

