import { LMSProvider } from "@/context/LMSContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LMS Prototype",
  description: "Leave Management System Prototype",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LMSProvider>{children}</LMSProvider>
      </body>
    </html>
  );
}
