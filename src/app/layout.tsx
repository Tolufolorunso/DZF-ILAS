import type { Metadata } from 'next';
import ThemeRegistry from '@/theme/ThemeRegistry';
import './globals.css';

export const metadata: Metadata = {
  title: 'DZF-ILLS | Dzuels Integrated Library & Learning System',
  description: 'Internal staff workspace and digital library system for Dzuels Educational Foundation.',
  icons: {
    icon: [
      { url: '/images/logo.png', type: 'image/png' },
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logo.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/images/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
