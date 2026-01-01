"use client";

import { useLMS } from "@/context/LMSContext";
import { LeaveNature, LeaveType } from "@/lib/types";
import { useState } from "react";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplyLeaveModal({
  isOpen,
  onClose,
}: ApplyLeaveModalProps) {
  const { currentUser, applyLeave } = useLMS();

  const [type, setType] = useState<LeaveType>("Regular");
  const [nature, setNature] = useState<LeaveNature | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Short Leave State
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const resetForm = () => {
    setType("Regular");
    setNature("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setStartTime("");
    setEndTime("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Basic validation
    if (!startDate || !reason) return;
    if (type === "Regular" && !endDate) return;
    if (type === "Regular" && !nature) return;
    if (type === "Short" && (!startTime || !endTime)) return;

    applyLeave(
      currentUser.id,
      type,
      startDate,
      type === "Short" ? startDate : endDate,
      reason,
      type === "Regular" ? (nature as LeaveNature) : undefined,
      type === "Short",
      type === "Short" ? { start: startTime, end: endTime } : undefined
    );

    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            New Leave Application
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1 transition-colors">
                  <input
                    type="radio"
                    name="type"
                    checked={type === "Regular"}
                    onChange={() => {
                      setType("Regular");
                      setEndDate("");
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span
                    className={`font-medium ${
                      type === "Regular" ? "text-indigo-700" : "text-gray-600"
                    }`}
                  >
                    Regular Leave (Days)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 flex-1 transition-colors">
                  <input
                    type="radio"
                    name="type"
                    checked={type === "Short"}
                    onChange={() => {
                      setType("Short");
                      setEndDate(startDate);
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span
                    className={`font-medium ${
                      type === "Short" ? "text-indigo-700" : "text-gray-600"
                    }`}
                  >
                    Short Leave (Hours)
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {type === "Regular"
                  ? "Calculated in full days (8 hours)."
                  : "Calculated in hours only."}
              </p>
            </div>

            {/* Leave Nature (Only for Regular) */}
            {type === "Regular" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Category
                </label>
                <select
                  value={nature}
                  onChange={(e) => setNature(e.target.value as LeaveNature)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Pilgrim">Pilgrim Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              {type === "Regular" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* Short Leave Time Inputs */}
            {type === "Short" && (
              <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description / Reason
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g. Sick leave, personal errand..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
