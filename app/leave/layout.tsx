"use client";

import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { useLMS } from "@/context/LMSContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useLMS();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
}
