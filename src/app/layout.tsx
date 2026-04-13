import '../styles/globals.css';
import '../styles/layout.css';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL('https://tempcha.io'),
  title: 'Tempcha — Free Temporary Chat Application | QR Code Group Chat',
  description:
    'Tempcha is a free temporary chat application. Create an anonymous group chat room in seconds with a QR code. No signup, no app, no data stored. Ideal for restaurants, events, classrooms and hotels.',
  keywords: [
    'temporary chat application',
    'temporary chat room',
    'anonymous group chat',
    'QR code chat room',
    'no signup chat',
    'temporary messaging app',
    'ephemeral chat',
    'anonymous chat room',
    'instant chat room',
    'temporary group chat',
    'chat room for events',
    'QR code messaging',
    'disposable chat room',
    'private temporary chat',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tempcha',
  },
  openGraph: {
    title: 'Tempcha — Chat now. Gone forever.',
    description:
      'Free temporary chat application. Open a QR-code chat room in seconds — no app, no account, no data stored. Every message deletes itself when the session ends.',
    siteName: 'Tempcha',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tempcha — Free Temporary Chat Application',
    description:
      'QR code group chat. No signup. No permanent storage. Open a temporary chat room in seconds.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="min-h-full dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0d1f1e" />
        {/* Structured data — SoftwareApplication schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Tempcha',
              applicationCategory: 'CommunicationApplication',
              description:
                'A free temporary chat application that lets anyone join an anonymous group chat room by scanning a QR code. No signup required. All messages auto-delete when the session ends.',
              operatingSystem: 'Web, iOS, Android',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </head>
      <body>
        {children}
        <Toaster />
        <Sonner richColors position="top-center" />
      </body>
    </html>
  );
}
