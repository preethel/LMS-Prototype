"use client";

import { useLMS } from "@/context/LMSContext";
import { useState } from "react";

export default function SettingsPage() {
  const { currentUser, users, setDelegate } = useLMS();
  const [selectedDelegate, setSelectedDelegate] = useState<string>(
    currentUser?.delegatedTo || ""
  );

  if (!currentUser) {
    return <div className="p-8">Please log in to access settings.</div>;
  }

  // Filter potential delegates:
  // 1. Exclude self.
  // 2. Ideally exclude people lower in hierarchy if strictly hierarchical, but for flexibility often peers or anyone is allowed.
  // 3. For prototype, let's allow anyone except self.
  const potentialDelegates = users.filter((u) => u.id !== currentUser.id);

  const handleSave = () => {
    if (selectedDelegate === "") {
      setDelegate(currentUser.id, null);
    } else {
      setDelegate(currentUser.id, selectedDelegate);
    }
    // Optional: Feedback toast could go here
    alert("Delegation settings updated.");
  };

  const currentDelegateUser = users.find(
    (u) => u.id === currentUser.delegatedTo
  );

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
              🛡️
            </span>
            Approval Delegation
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-9">
            Delegate your approval authority to another employee when you are
            unavailable.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {currentUser.delegatedTo && currentDelegateUser ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <div className="text-amber-500 mt-0.5">⚠️</div>
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Delegation Active
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Your approval rights are currently delegated to{" "}
                  <span className="font-bold">{currentDelegateUser.name}</span>{" "}
                  ({currentDelegateUser.designation}). They can view and approve
                  requests on your behalf.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                You are currently managing your own approvals. No delegation is
                active.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Delegate To
            </label>
            <select
              value={selectedDelegate}
              onChange={(e) => setSelectedDelegate(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow"
            >
              <option value="">-- Nobody (Disable Delegation) --</option>
              {potentialDelegates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} - {u.designation}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2">
              Select an employee who will act on your behalf.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
