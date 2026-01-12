import { LMSProvider } from "@/context/LMSContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HIT Portal",
  description:
    "Your unified workspace for leave management, approvals, and team coordination.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <LMSProvider>{children}</LMSProvider>
      </body>
    </html>
  );
}
