'use client';

import { Manrope } from 'next/font/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import '@/styles/globals.css';
import { ToastContainer } from '@/components/ui/Toast';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="en" className={`${manrope.variable} dark`}>
      <head>
        <title>MyCryptoCoin - Merchant Dashboard</title>
        <meta name="description" content="MyCryptoCoin merchant payment gateway dashboard. Accept crypto payments for your business." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f1117" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="MyCryptoCoin - Merchant Dashboard" />
        <meta property="og:description" content="Accept crypto payments for your business with MyCryptoCoin payment gateway." />
        <meta property="og:url" content="https://mycrypto.co.in" />
        <meta property="og:site_name" content="MyCryptoCoin" />
      </head>
      <body className={`${manrope.className} bg-[#0f1117] text-slate-200 antialiased`}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ToastContainer />
        </QueryClientProvider>
      </body>
    </html>
  );
}
