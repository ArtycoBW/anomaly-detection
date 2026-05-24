import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono, Syne } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'iData — Детекция аномалий',
  description: 'Платформа обнаружения аномалий в социально-экономических показателях регионов',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${dmSans.variable} ${syne.variable} ${jetBrainsMono.variable}`}>
      <body className="antialiased">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
