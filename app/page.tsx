"use client";

import { useLMS } from "@/context/LMSContext";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Image from "next/image";

export default function LoginPage() {
  const { users, login } = useLMS();
  const router = useRouter();
  const [view, setView] = useState<"quick" | "standard">("quick");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleQuickLogin = (userId: string) => {
    login(userId);
    router.push("/dashboard");
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Demo Logic: Try to find user by email, otherwise default to first user (Admin usually)
    // In a real app, this would verify password.
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      login(user.id);
      router.push("/dashboard");
    } else {
      // Fallback for demo if email doesn't match specific user, just login as first user
      // Or show error? User asked for a "demo", usually implies flexible.
      // But let's be slightly strict to show it "works".
      setError(
        "User not found. Try 'john@corp.com' or check Quick Login list."
      );
    }
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
      onClick={() => handleQuickLogin(user.id)}
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
          <div className="p-4 rounded-xl inline-block mb-8">
            <Image
              src="/logo.png"
              alt="Hawar IT"
              width={200}
              height={60}
              className="object-contain h-12 w-auto"
              priority
            />
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">WorkSphere</h1>
          <p className="text-indigo-200 text-lg max-w-md">
            Your unified workspace for leave management, approvals, and team
            coordination.
          </p>
        </div>

        <div className="relative z-10 text-sm text-indigo-300">
          © 2025 HawarIT. All rights reserved.
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
              {view === "quick"
                ? "Select an account to login to the prototype."
                : "Enter your credentials to access your account."}
            </p>
          </div>

          {/* Toggle View */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setView("quick")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                view === "quick"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Quick Demo Login
            </button>
            <button
              onClick={() => setView("standard")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                view === "standard"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Standard Login
            </button>
          </div>

          {view === "quick" ? (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
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
          ) : (
            <form onSubmit={handleStandardLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address / EmpId
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          <div className="pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            Prototype Version 1.0.3 •{" "}
            {view === "quick" ? "No password required" : "Secure Login Demo"}
          </div>
        </div>
      </div>
    </div>
  );
}
