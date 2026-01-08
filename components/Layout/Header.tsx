"use client";

import { useLMS } from "@/context/LMSContext";
import { usePathname, useRouter } from "next/navigation";
import NotificationPopover from "../Notification/NotificationPopover";

export default function Header() {
  const { currentUser, leaves } = useLMS();
  const pathname = usePathname();
  const router = useRouter();

  const renderHeaderContent = () => {
    // Check if we are on a Request Details page
    if (pathname.includes("/dashboard/requests/")) {
      const id = pathname.split("/").pop(); // Extract ID from URL
      const request = leaves.find((l) => l.id === id);

      if (request) {
        // Status Color Mapper
        const getStatusColor = (s: string) => {
          switch (s) {
            case "Approved":
              return "text-green-600 bg-green-50 border-green-200";
            case "Rejected":
              return "text-red-600 bg-red-50 border-red-200";
            case "Pending":
              return "text-orange-600 bg-orange-50 border-orange-200";
            default:
              return "text-gray-600 bg-gray-50 border-gray-200";
          }
        };

        return (
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="px-2 py-1 -ml-2 text-sm text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1 rounded-md hover:bg-gray-100"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {request.type} Leave Request
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(
                    request.status
                  )}`}
                >
                  {request.status}
                </span>
                <span className="text-sm text-gray-400">
                  Request ID: #{request.id}
                </span>
              </div>
            </div>
          </div>
        );
      }
    }

    // Default Header Content
    let title = "Dashboard";
    if (pathname === "/dashboard") title = "Dashboard";
    else if (pathname.includes("/approvals")) title = "Approvals";
    else if (pathname.includes("/my-applications")) title = "My Applications";
    else if (pathname.includes("/notifications")) title = "Notifications";
    else if (pathname.includes("/settings")) title = "Settings";

    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {currentUser && (
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {currentUser.name}
          </p>
        )}
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
      {renderHeaderContent()}
      <div className="flex items-center space-x-4">
        <NotificationPopover />
      </div>
    </header>
  );
}
