import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@formhaus/core/style.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Formhaus + Next.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
