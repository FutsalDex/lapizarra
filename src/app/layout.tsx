import type { Metadata } from "next";
import "./globals.css";
import { cn } from "../lib/utils";
import { Toaster } from "../components/ui/toaster";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { AuthProvider } from '../context/AuthContext';
import FirebaseErrorListener from '../components/layout/FirebaseErrorListener';

export const metadata: Metadata = {
  title: "LaPizarra - Tu Asistente de Futsal",
  description:
    "Plataforma integral para entrenadores de fútbol sala. Planifica, gestiona y analiza con IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn("min-h-screen font-body antialiased", "dark")}>
        <AuthProvider>
          <FirebaseErrorListener />
          <div className="relative flex min-h-dvh flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
