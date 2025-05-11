
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Navbar from '@/components/layout/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Basel 3 SA Chatbot & RWA Engine',
  description: 'Chatbot for U.S. banking regulations (CFR Title 12) questions and RWA Logic Engine based on standardized approach.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-grow flex flex-col pt-16"> {/* Added pt-16 for navbar height */}
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
