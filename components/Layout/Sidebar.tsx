"use client";

import { useLMS } from "@/context/LMSContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const { currentUser, logout, users } = useLMS();
  const pathname = usePathname();
  const router = useRouter();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Common styles
  const activeClass = "bg-indigo-600 text-white";
  const inactiveClass = "text-gray-300 hover:bg-gray-800 hover:text-white";

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white flex flex-col">
      <div className="p-6 flex justify-center">
        <div className="p-3 rounded-lg w-full flex justify-center">
          <Image
            src="/logo.png"
            alt="Hawar IT"
            width={180}
            height={50}
            className="object-contain h-10 w-auto"
            priority
          />
        </div>
      </div>

      <div className="px-6 mb-8 flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
          {currentUser.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">{currentUser.name}</p>
          <p className="text-xs text-gray-400 truncate w-32">
            {currentUser.designation}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto mt-4">
        {/* LEAVE MANAGEMENT GROUP */}
        <div>
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Leave Management
          </h3>
          <div className="space-y-1">
            <Link
              href="/leave/dashboard"
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/leave/dashboard" ? activeClass : inactiveClass
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/leave/my-applications"
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/leave/my-applications"
                  ? activeClass
                  : inactiveClass
              }`}
            >
              My Applications
            </Link>
            {(["TeamLead", "Manager", "HR", "MD", "Director"].includes(
              currentUser.role
            ) ||
              users.some((u) => u.delegatedTo === currentUser.id)) && (
              <Link
                href="/leave/approvals"
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/leave/approvals" ? activeClass : inactiveClass
                }`}
              >
                Approvals
              </Link>
            )}
            {["HR", "Director", "MD"].includes(currentUser.role) && (
              <Link
                href="/leave/employees"
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/leave/employees" ? activeClass : inactiveClass
                }`}
              >
                Approver Configurations
              </Link>
            )}
          </div>
        </div>

        <div>
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Employee Assignment
          </h3>
          <div className="space-y-1">
            <Link
              href=""
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "" ? activeClass : inactiveClass
              }`}
            >
              Assign
            </Link>
            <Link
              href=""
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "" ? activeClass : inactiveClass
              }`}
            >
              Open
            </Link>
          </div>
        </div>

        {/* SYSTEM GROUP - HR Only */}

        <div>
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            System
          </h3>
          <div className="space-y-1">
            {currentUser.role === "HR" && (
              <Link
                href="/leave/reports"
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/leave/reports" ? activeClass : inactiveClass
                }`}
              >
                Reports
              </Link>
            )}
            <Link
              href="/leave/settings"
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/leave/settings" ? activeClass : inactiveClass
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
