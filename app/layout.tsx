import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import { WebSocketProvider } from '@/components/Wss';

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "A2UICT IOT Dashboard",
  description: "A2UICT Dashboard for managing and monitoring A2UICT IOT",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <WebSocketProvider>
      <body className={inter.className}>{children}</body>
    </WebSocketProvider>
    </html>
  );
}
