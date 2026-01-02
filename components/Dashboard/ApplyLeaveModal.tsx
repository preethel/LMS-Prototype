"use client";

import { useLMS } from "@/context/LMSContext";
import { LeaveNature, LeaveType } from "@/lib/types";
import { useMemo, useState } from "react";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ApplyLeaveContent({ onClose }: { onClose: () => void }) {
  const { currentUser, applyLeave, balances } = useLMS();

  const [type, setType] = useState<LeaveType>("Regular");
  const [nature, setNature] = useState<LeaveNature | "">("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Short Leave State
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Derived State: Duration
  const duration = useMemo(() => {
    if (type === "Regular" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else if (type === "Short" && startTime && endTime) {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      let diff = endH - startH + (endM - startM) / 60;
      if (diff < 0) diff = 0;
      return diff;
    }
    return 0;
  }, [type, startDate, endDate, startTime, endTime]);

  // Derived State: Warning
  const warning = useMemo(() => {
    if (
      type === "Regular" &&
      duration > 0 &&
      currentUser &&
      balances &&
      nature
    ) {
      const myBalance = balances.find((b) => b.userId === currentUser.id);
      if (myBalance) {
        if (nature === "Sick") {
          const remainingSick =
            (myBalance.sickQuota || 10) - (myBalance.sickUsed || 0);
          if (duration > remainingSick) {
            return `Warning: You have ${remainingSick} Sick Leave days remaining. Applying for ${duration} days will exceed your quota.`;
          }
        } else if (nature === "Casual") {
          const remainingCasual =
            (myBalance.casualQuota || 10) - (myBalance.casualUsed || 0);
          if (duration > remainingCasual) {
            return `Warning: You have ${remainingCasual} Casual Leave days remaining. Applying for ${duration} days will exceed your quota.`;
          }
        }
      }
    }
    return "";
  }, [type, duration, currentUser, balances, nature]);

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFileError("");

      // Combined list
      const totalFiles = [...selectedFiles, ...newFiles];

      // 1. Validate Count
      if (totalFiles.length > 5) {
        setFileError("Maximum 5 files allowed.");
        return;
      }

      // 2. Validate Size
      const oversizedFiles = newFiles.filter(
        (file) => file.size > 10 * 1024 * 1024
      ); // 10MB
      if (oversizedFiles.length > 0) {
        setFileError(`File ${oversizedFiles[0].name} exceeds 10MB limit.`);
        return;
      }

      setSelectedFiles(totalFiles);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Basic validation
    if (!startDate || !reason) return;
    if (type === "Regular" && !endDate) return;
    if (type === "Regular" && !nature) return;
    if (type === "Short" && (!startTime || !endTime)) return;

    // Mock File Upload (Convert File objects to Attachments)
    const attachments = selectedFiles.map((file) => ({
      id: `f${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Mock URL for blob
    }));

    applyLeave(
      currentUser.id,
      type,
      startDate,
      type === "Short" ? startDate : endDate,
      reason,
      type === "Regular" ? (nature as LeaveNature) : undefined,
      type === "Short",
      type === "Short" ? { start: startTime, end: endTime } : undefined,
      attachments
    );

    onClose();
  };

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
            type="button"
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
                Cause of Leave
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

            {/* Attachments Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments (Optional)
              </label>
              <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <span className="text-indigo-600 font-medium hover:text-indigo-800">
                    Click to upload
                  </span>
                  <span className="text-gray-400 text-xs mt-1">
                    Max 5 files, 10MB each
                  </span>
                </label>
              </div>

              {fileError && (
                <p className="text-red-500 text-xs mt-2">{fileError}</p>
              )}

              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded border border-gray-100"
                    >
                      <span className="truncate max-w-[200px] text-gray-600">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warning Message */}
            {warning && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">{warning}</p>
                  </div>
                </div>
              </div>
            )}

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

export default function ApplyLeaveModal({
  isOpen,
  onClose,
}: ApplyLeaveModalProps) {
  if (!isOpen) return null;
  return <ApplyLeaveContent onClose={onClose} />;
}
