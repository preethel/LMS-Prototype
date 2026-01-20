"use client";

import { useLMS } from "@/context/LMSContext";
import { User } from "@/lib/types";
import { useState } from "react";

import HolidayManager from "@/components/Dashboard/HolidayManager";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function EmployeeManagementPage() {
  const { users, currentUser, updateUserApprovers } = useLMS();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempApprovers, setTempApprovers] = useState<string[]>([]);
  const [availableApproverId, setAvailableApproverId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"employees" | "holidays">("employees");

  // Only Admin/HR/Manager?? For prototype, let's assume current user can manage everyone or just filtering?
  // Let's list all "Employees" for now.
  const employees = users.filter(
    (u) => u.role !== "Director" && u.role !== "MD"
  );

  const handleManageClick = (user: User) => {
    setSelectedUser(user);
    setTempApprovers(user.sequentialApprovers || []);
    setIsModalOpen(true);
  };

  const handleAddApprover = () => {
    if (availableApproverId && !tempApprovers.includes(availableApproverId)) {
      setTempApprovers([...tempApprovers, availableApproverId]);
      setAvailableApproverId("");
    }
  };

  const handleRemoveApprover = (idToRemove: string) => {
    setTempApprovers(tempApprovers.filter((id) => id !== idToRemove));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...tempApprovers];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    setTempApprovers(newArr);
  };

  const handleMoveDown = (index: number) => {
    if (index === tempApprovers.length - 1) return;
    const newArr = [...tempApprovers];
    [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    setTempApprovers(newArr);
  };

  const handleSave = () => {
    if (selectedUser) {
      updateUserApprovers(selectedUser.id, tempApprovers);
      setIsModalOpen(false);
      setSelectedUser(null);
    }
  };

  if (!currentUser) return null;

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
            <button 
                onClick={() => setActiveTab("employees")}
                className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors ${activeTab === 'employees' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
                Employees & Approvals
            </button>
            <button 
                onClick={() => setActiveTab("holidays")}
                className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors ${activeTab === 'holidays' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
                Holiday & Weekend Manager
            </button>
        </div>

      {activeTab === "holidays" ? (
          <HolidayManager />
      ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3">Employee</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Sequential Approvers</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p>{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{emp.role}</td>
                <td className="px-6 py-4 text-gray-600">
                  {emp.sequentialApprovers &&
                  emp.sequentialApprovers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {emp.sequentialApprovers.map((appId, idx) => {
                        const approverUser = users.find((u) => u.id === appId);
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            <span className="mr-1 text-gray-400">
                              {idx + 1}.
                            </span>{" "}
                            {approverUser?.name || appId}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Default</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleManageClick(emp)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-3 py-1.5 rounded transition-colors"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Configure Approvers for {selectedUser.name}
            </h3>

            <div className="mb-6 space-y-4">
              {/* Add Approver */}
              <div className="flex gap-2">
                <div className="flex-1">
                 <SearchableSelect
                  value={availableApproverId}
                  onChange={(val) => setAvailableApproverId(val)}
                  options={users
                    .filter((u) => u.id !== selectedUser.id) // Cant approve self
                    .map((u) => ({
                        value: u.id,
                        label: `${u.name} (${u.role})`
                    }))}
                  placeholder="Select Approver"
                />
                </div>
                <button
                  onClick={handleAddApprover}
                  disabled={!availableApproverId}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {/* List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {tempApprovers.length === 0 && (
                  <div className="p-4 text-center text-gray-400 text-sm italic">
                    No sequential approvers configured.
                  </div>
                )}
                {tempApprovers.map((appId, index) => {
                  const approverUser = users.find((u) => u.id === appId);
                  return (
                    <div
                      key={appId}
                      className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700 font-medium">
                        {index + 1}. {approverUser?.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === tempApprovers.length - 1}
                          className="p-1 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                          title="Move Down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveApprover(appId)}
                          className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500">
                Notes:
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>
                    Approvals will follow this Order (1 &rarr; 2 &rarr; 3).
                  </li>
                  <li>
                    After the final approver, the request goes to{" "}
                    <strong>HR</strong> for final validation.
                  </li>
                  <li>Any rejection in the chain stops the process.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
