import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import ThemeToggle from '@/components/ThemeToggle';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Días de Salario',
  description: 'Descubre cuántos días de salario cuesta lo que deseas comprar',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Días de Salario</h1>
            </div>
            <div>
              <ThemeToggle />
            </div>
          </div>

          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
