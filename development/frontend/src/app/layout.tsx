import type { Metadata } from 'next';
import { Dela_Gothic_One, Red_Rose } from 'next/font/google';
import './globals.css';

const delaGothic = Dela_Gothic_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const redRose = Red_Rose({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Owtlet™ — 21+ Live Shopping for Cannabis',
  description: 'Shop curated legal cannabis live from premier licensed New York dispensaries.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${delaGothic.variable} ${redRose.variable}`}>
      <body className="antialiased min-h-screen bg-background text-foreground font-body">
        {children}
      </body>
    </html>
  );
}
