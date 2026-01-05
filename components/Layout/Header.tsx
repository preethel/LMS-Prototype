"use client";

import { useLMS } from "@/context/LMSContext";
import { usePathname } from "next/navigation";
import NotificationPopover from "../Notification/NotificationPopover";

export default function Header() {
  const { currentUser } = useLMS();
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.includes("/approvals")) return "Approvals";
    if (pathname.includes("/my-applications")) return "My Applications";
    if (pathname.includes("/notifications")) return "Notifications";
    if (pathname.includes("/requests")) return "Request Details";
    return "Dashboard";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
        {currentUser && (
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {currentUser.name}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <NotificationPopover />
      </div>
    </header>
  );
}
