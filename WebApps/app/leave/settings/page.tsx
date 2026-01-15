"use client";

import { useLMS } from "@/context/LMSContext";
import { useState } from "react";

export default function SettingsPage() {
  const { currentUser, users, setDelegate } = useLMS();
  const [isActive, setIsActive] = useState<boolean>(!!currentUser?.delegatedTo);
  const [selectedDelegate, setSelectedDelegate] = useState<string>(
    currentUser?.delegatedTo || ""
  );
  const [startDate, setStartDate] = useState<string>(
    currentUser?.delegationStartDate || ""
  );
  const [endDate, setEndDate] = useState<string>(
    currentUser?.delegationEndDate || ""
  );

  if (!currentUser) {
    return <div className="p-8">Please log in to access settings.</div>;
  }

  // Filter potential delegates:
  // 1. Exclude self.
  // 2. Ideally exclude people lower in hierarchy if strictly hierarchical, but for flexibility often peers or anyone is allowed.
  // 3. For prototype, let's allow anyone except self.
  const potentialDelegates = users.filter((u) => u.id !== currentUser.id);

  const handleToggle = (newState: boolean) => {
    setIsActive(newState);
    if (!newState) {
      // Turned OFF: Disable delegation immediately
      setDelegate(currentUser.id, null);
    }
  };

  const updateSettings = (delegateId: string, start: string, end: string) => {
    if (delegateId) {
      setDelegate(currentUser.id, delegateId, start, end);
    }
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
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-gray-700">
                Enable Delegation
              </label>
              <div
                className={`w-14 h-7 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors ${
                  isActive ? "bg-purple-600" : ""
                }`}
                onClick={() => handleToggle(!isActive)}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${
                    isActive ? "translate-x-7" : ""
                  }`}
                ></div>
              </div>
            </div>

            {isActive && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delegate To
                  </label>
                  <select
                    value={selectedDelegate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDelegate(val);
                      updateSettings(val, startDate, endDate);
                    }}
                    className="w-full max-w-md px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow"
                  >
                    <option value="">-- Select Employee --</option>
                    {potentialDelegates.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} - {u.designation}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStartDate(val);
                        updateSettings(selectedDelegate, val, endDate);
                      }}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEndDate(val);
                        updateSettings(selectedDelegate, startDate, val);
                      }}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Approvals will only be delegated during this time window. Only
                  pending requests matching this window will be visible to the
                  delegate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
