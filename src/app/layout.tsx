import '../styles/globals.css';
import '../styles/layout.css';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  metadataBase: new URL('https://flashroom.io'),
  title: 'FlashRoom — QR-Powered Temporary Chat',
  description:
    'Scan a QR code, chat instantly, leave nothing behind. FlashRoom creates ephemeral group chat rooms for businesses — no app, no signup, no permanent data.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={'min-h-full dark'}>
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
