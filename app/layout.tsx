import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GiaFarm",
  description: "Gestionale agricolo web per campi, lavorazioni, documenti e finanza."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
