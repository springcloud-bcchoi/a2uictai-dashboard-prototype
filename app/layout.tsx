import type {Metadata} from "next";
import "./globals.css";
import { WebSocketProvider } from '@/components/Wss';
import { inter } from "@/public/fonts/fonts";


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
