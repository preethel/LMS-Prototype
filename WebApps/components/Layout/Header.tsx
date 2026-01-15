"use client";

import { useLMS } from "@/context/LMSContext";
import { ChevronDown, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ApplyLeaveModal from "../Dashboard/ApplyLeaveModal";
import NotificationPopover from "../Notification/NotificationPopover";

export default function Header() {
  const { currentUser, leaves, logout } = useLMS();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };


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
    let description = currentUser ? `Welcome back, ${currentUser.name}` : "";

    if (pathname === "/dashboard") {
      title = "Dashboard";
      description = currentUser ? `Welcome back, ${currentUser.name}` : "";
    } else if (pathname.includes("/approvals")) {
      title = "Approvals";
      description = "Manage pending requests and review history";
    } else if (pathname.includes("/my-applications")) {
      title = "My Applications";
      description = "Track your leave history and status";
    } else if (pathname.includes("/notifications")) {
      title = "Notifications";
      description = "Stay updated with latest activities";
    } else if (pathname.includes("/delegation")) {
      title = "Approval Delegation";
      description = "Manage your approval authority and delegation history.";
    } else if (pathname.includes("/employees")) {
      title = "Team Allocation";
      description = "Manage employee settings and approvals";
    } else if (pathname.includes("/reports")) {
      title = "Reports";
      description = "Generate and export leave reports";
    }

    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
      {renderHeaderContent()}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-bold"
        >
          + New Leave Application
        </button>
        <NotificationPopover />
        
        {/* Profile Dropdown */}
        <div className="relative pl-4 border-l border-gray-200">
            <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 focus:outline-none group"
            >
                 <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200 group-hover:border-indigo-300 transition-colors">
                    {currentUser?.name?.charAt(0)}
                 </div>
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors">{currentUser?.name}</p>
                    <p className="text-xs text-gray-400">{currentUser?.role}</p>
                 </div>
                 <ChevronDown size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </button>

            {isProfileOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 overflow-hidden ring-1 ring-black ring-opacity-5">
                         <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                            <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                            <p className="text-xs text-gray-500">{currentUser?.designation}</p>
                         </div>
                         <button 
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                         >
                            <LogOut size={16} />
                            <span>Log Out</span>
                         </button>
                    </div>
                </>
            )}
        </div>
      </div>

      <ApplyLeaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </header>
  );
}
