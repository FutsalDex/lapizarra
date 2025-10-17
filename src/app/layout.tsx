import './globals.css';
import { Providers } from '@/components/providers';
import Header from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { Poppins, PT_Sans } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata = {
  title: 'FutsalDex',
  description: 'Tu compañero para entrenamientos y gestión de fútbol sala',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${poppins.variable} ${ptSans.variable}`}>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}