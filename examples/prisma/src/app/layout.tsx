import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PixelProvider } from '@pixel/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PixelProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </PixelProvider>
  );
}
