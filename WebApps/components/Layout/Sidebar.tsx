"use client";

import { useLMS } from "@/context/LMSContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { currentUser, users } = useLMS();
  const pathname = usePathname();

  if (!currentUser) return null;

  // Common styles
  const activeClass = "bg-indigo-600 text-white";
  const inactiveClass = "text-gray-300 hover:bg-gray-800 hover:text-white";

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white flex flex-col">
      <div className="p-6 flex justify-center border-b border-gray-800 mb-4">
        <div className="p-2 rounded-lg w-full flex justify-center">
          <Image
            src="/logo.png"
            alt="Hawar IT"
            width={160}
            height={45}
            className="object-contain h-8 w-auto"
            priority
          />
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-4 overflow-y-auto">
        {/* LEAVE MANAGEMENT GROUP */}
        <div className="bg-gray-800/30 rounded-xl p-3">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">
            Leave Management
          </h3>
          <div className="space-y-0.5">
            <Link
              href="/leave/dashboard"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/leave/dashboard" ? activeClass : inactiveClass
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/leave/my-applications"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/leave/approvals" ? activeClass : inactiveClass
                }`}
              >
                Approvals
              </Link>
            )}
            {["HR", "Director", "MD"].includes(currentUser.role) && (
              <Link
                href="/leave/employees"
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/leave/employees" ? activeClass : inactiveClass
                }`}
              >
                Approver Config
              </Link>
            )}
            {currentUser.role === "HR" && (
              <Link
                href="/leave/reports"
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === "/leave/reports" ? activeClass : inactiveClass
                }`}
              >
                Reports
              </Link>
            )}
            <Link
              href="/leave/delegation"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/leave/delegation" ? activeClass : inactiveClass
              }`}
            >
              Approval Delegation
            </Link>
          </div>
        </div>

        {/* EMPLOYEE ASSIGNMENT GROUP */}
        <div className="bg-gray-800/30 rounded-xl p-3">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">
            Employee Assignment
          </h3>
          <div className="space-y-0.5">
            <div className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 cursor-not-allowed">
              Project Allocation
            </div>
            <div className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 cursor-not-allowed">
              Resource Planning
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
