"use client";

import { useLMS } from "@/context/LMSContext";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";

export default function SettingsPage() {
  const { currentUser, users, addDelegation, cancelDelegation, stopDelegation, extendDelegation } = useLMS();
  
  // Local state for the "Add Delegation" form
  const [selectedDelegate, setSelectedDelegate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // State for Extension
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extensionDate, setExtensionDate] = useState<string>("");

  if (!currentUser) {
    return <div className="p-8">Please log in to access settings.</div>;
  }

  const potentialDelegates = users.filter((u) => u.id !== currentUser.id);

  const handleAddDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDelegate && startDate && endDate) {
      addDelegation(currentUser.id, selectedDelegate, startDate, endDate);
      // Reset form
      setSelectedDelegate("");
      setStartDate("");
      setEndDate("");
    }
  };

  const handleExtend = (historyId: string) => {
    if (extensionDate) {
      extendDelegation(currentUser.id, historyId, extensionDate);
      setExtendingId(null);
      setExtensionDate("");
    }
  };

  const activeDelegations = currentUser.delegationHistory?.filter(h => {
     const now = new Date();
     const start = new Date(h.startDate);
     const end = new Date(h.endDate);
     return now >= start && now <= end;
  }) || [];

  const currentDelegateUser = activeDelegations.length > 0 
    ? users.find(u => u.id === activeDelegations[0].delegatedToId) 
    : null;

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
            unavailable. You can schedule multiple delegations.
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* Active Status Banner */}
          {currentDelegateUser && activeDelegations[0] ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                 <div className="text-amber-500 mt-0.5">⚠️</div>
                 <div>
                    <p className="text-sm font-bold text-amber-800">
                      Delegation Active
                    </p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Your approval rights are currently delegated to{" "}
                      <span className="font-bold">{currentDelegateUser.name}</span>{" "}
                      ({currentDelegateUser.designation}).
                    </p>
                 </div>
              </div>
               <button
                 onClick={() => stopDelegation(currentUser.id, activeDelegations[0].id)}
                 className="px-3 py-1.5 bg-white border border-amber-300 text-amber-700 text-xs font-bold rounded shadow-sm hover:bg-amber-50 hover:text-amber-800 transition-colors"
               >
                 Stop Delegation
               </button>
            </div>
          ) : (
             <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                You are currently managing your own approvals. No delegation is active right now.
              </p>
            </div>
          )}

          {/* Add Delegation Form */}
          <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
             <h3 className="text-md font-bold text-gray-800 mb-4">
                Schedule New Delegation
             </h3>
             <form onSubmit={handleAddDelegation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delegate To
                  </label>
                  <select
                    value={selectedDelegate}
                    onChange={(e) => setSelectedDelegate(e.target.value)}
                    required
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
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                 <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Add Delegation
                </button>
             </form>
          </div>

          {/* Delegation History / Schedule List */}
          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-md font-bold text-gray-800 mb-4">
              Delegation Schedule & History
            </h3>
            {currentUser.delegationHistory && currentUser.delegationHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Delegated To</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Assigned At</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...currentUser.delegationHistory]
                      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
                      .map((history) => {
                      const delegateUser = users.find(
                        (u) => u.id === history.delegatedToId
                      );
                      const start = new Date(history.startDate);
                      const end = new Date(history.endDate);
                      // Use new standard formatter
                      const assigned = formatDateTime(history.assignedAt);
                      const now = new Date();

                      let status = "Past";
                      let statusColor = "bg-gray-100 text-gray-600";
                      
                      if (now >= start && now <= end) {
                          status = "Active";
                          statusColor = "bg-green-100 text-green-700";
                      } else if (now < start) {
                          status = "Scheduled";
                          statusColor = "bg-blue-100 text-blue-700";
                      }

                      const isExtending = extendingId === history.id;

                      return (
                        <tr key={history.id} className="bg-white border-b hover:bg-gray-50">
                           <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                                  {status}
                              </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {delegateUser ? delegateUser.name : "Unknown User"}
                            <span className="block text-xs text-gray-400 font-normal">
                              {delegateUser?.designation}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span>From: {formatDateTime(start)}</span>
                              <span className="text-gray-400">To: {formatDateTime(end)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {assigned}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                {/* Actions based on Status */}
                                {status === "Scheduled" && (
                                    <button 
                                      onClick={() => cancelDelegation(currentUser.id, history.id)}
                                      className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline"
                                    >
                                        Delete
                                    </button>
                                )}

                                {status === "Active" && !isExtending && (
                                    <>
                                      <button 
                                        onClick={() => stopDelegation(currentUser.id, history.id)}
                                        className="text-amber-600 hover:text-amber-800 text-xs font-medium hover:underline"
                                      >
                                          Stop
                                      </button>
                                      <span className="text-gray-300">|</span>
                                      <button 
                                        onClick={() => setExtendingId(history.id)}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                                      >
                                          Extend
                                      </button>
                                    </>
                                )}

                                {/* Extension UI */}
                                {isExtending && (
                                   <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                                       <input 
                                          type="datetime-local" 
                                          className="text-xs border rounded px-1 py-0.5 w-32"
                                          onChange={(e) => setExtensionDate(e.target.value)}
                                       />
                                       <button 
                                          onClick={() => handleExtend(history.id)}
                                          className="text-green-600 text-xs font-bold hover:underline"
                                       >
                                         ✔
                                       </button>
                                       <button 
                                          onClick={() => setExtendingId(null)}
                                          className="text-gray-500 text-xs hover:underline"
                                       >
                                         ✖
                                       </button>
                                   </div>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                No delegation history available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
