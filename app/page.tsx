"use client";

import { useLMS } from "@/context/LMSContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { users, login } = useLMS();
  const router = useRouter();

  const handleLogin = (userId: string) => {
    login(userId);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-[1.01]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500">Select an account to enter</p>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleLogin(user.id)}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all group flex items-center space-x-4 bg-white"
            >
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">{user.designation}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          LMS Prototype v1.0
        </div>
      </div>
    </div>
  );
}
