import '../styles/globals.css';
import '../styles/layout.css';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://flashroom.io'),
  title: 'FlashRoom — QR-Powered Temporary Chat for Businesses',
  description:
    'One permanent QR code. Instant anonymous group chat. Zero data retained when the session ends. No app, no signup — just scan and chat.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FlashRoom',
  },
  openGraph: {
    title: 'FlashRoom — Scan. Chat. Disappear.',
    description:
      'One permanent QR code that opens a fresh, anonymous chat room every session. Built for restaurants, events, hotels and anywhere people need to talk.',
    siteName: 'FlashRoom',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={'min-h-full dark'}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#7C3AED" />
      </head>
      <body>
        {children}
        <Toaster />
        <Sonner richColors position="top-center" />
      </body>
    </html>
  );
}
