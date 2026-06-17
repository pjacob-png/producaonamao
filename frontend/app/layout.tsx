import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Produção na Mão",
  description: "Gestão de fichas técnicas, CMV e markup para restaurantes",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
