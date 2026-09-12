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
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
