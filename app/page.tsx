"use client";

import { useLMS } from "@/context/LMSContext";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { users, login } = useLMS();
  const router = useRouter();

  const handleLogin = (userId: string) => {
    login(userId);
    router.push("/dashboard");
  };

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const UserCard = ({ user }: { user: User }) => (
    <button
      onClick={() => handleLogin(user.id)}
      className="w-full text-left group relative bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all duration-200 flex items-center space-x-4"
    >
      <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        {getInitials(user.name)}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
          {user.name}
        </h3>
        <p className="text-sm text-gray-500">{user.designation}</p>
      </div>
      <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">
        →
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-indigo-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="relative z-10">
          <div className="h-12 w-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center mb-8">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Leave Management <br /> Simplified.
          </h1>
          <p className="text-indigo-200 text-lg max-w-md">
            Experience a streamlined workflow for leave applications, recursive
            approvals, and real-time balance tracking.
          </p>
        </div>

        <div className="relative z-10 text-sm text-indigo-300">
          © 2024 Corporate Systems Inc. All rights reserved.
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-900 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50"></div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-gray-600">
              Select an account to login to the prototype.
            </p>
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {/* Approvers Group */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Management
              </h3>
              {users
                .filter(
                  (u) =>
                    u.designation.includes("Director") ||
                    u.designation.includes("Lead") ||
                    u.designation.includes("Manager")
                )
                .map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
            </div>

            {/* Employees Group */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Employees
              </h3>
              {users
                .filter(
                  (u) =>
                    !u.designation.includes("Director") &&
                    !u.designation.includes("Lead") &&
                    !u.designation.includes("Manager")
                )
                .map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            Prototype Version 1.0.2 • No password required
          </div>
        </div>
      </div>
    </div>
  );
}
