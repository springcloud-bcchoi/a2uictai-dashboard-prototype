import type {Metadata} from "next";
import "./globals.css";
import { WebSocketProvider } from '@/components/Wss';
import { inter } from "@/public/fonts/fonts";
import Sidebar from "@/components/sidebar/Sidebar";
import { ChakraProvider } from "@chakra-ui/react";
import { SearchProvider } from "@/components/searchbar/SearchContext";


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
      <body className={inter.className}>
      <ChakraProvider>
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
      <Sidebar/>
      </div>
      <SearchProvider>
      <div className="flex-grow p-6 md:overflow-y-auto md:py-12">{children}</div>
      </SearchProvider>
      </div>
      </ChakraProvider>
        </body>
    </WebSocketProvider>
    </html>
  );
}
