"use client";

import { useLMS } from "@/context/LMSContext";
import { useNotification } from "@/context/NotificationContext";
import { LeaveNature, LeaveType } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useMemo, useRef, useState } from "react";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ApplyLeaveContent({ onClose }: { onClose: () => void }) {
  const { currentUser, applyLeave, balances, users } = useLMS();
  const { addNotification } = useNotification();

  const [type, setType] = useState<LeaveType>("Regular");
  const [nature, setNature] = useState<LeaveNature | "">("Casual");
  
  // Consolidated DateTime State for Regular Leave
  // Default to Today 09:00 AM and Today 05:00 PM
  const [startDateTime, setStartDateTime] = useState(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return `${today}T09:00`;
  });
  const [endDateTime, setEndDateTime] = useState(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return `${today}T17:00`;
  });

  const [reason, setReason] = useState("");

  // Short Leave State (remains Day + Start/End Time for intraday)
  const [shortDate, setShortDate] = useState("");
  const [shortStartTime, setShortStartTime] = useState("");
  const [shortEndTime, setShortEndTime] = useState("");

  // Helper to init default times if needed
  // User asked for "Initial 9:00AM / 5:00PM" logic. 
  // With datetime-local, we usually need a date. 
  // We can let user pick, or defaulted on mount? Let's keep it empty for explicit user selection to avoid accidental "today" submissions.

  // Derived State: Duration
  const duration = useMemo(() => {
    if (type === "Regular" && startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      
      if (end <= start) return 0;

      // Workday Defines
      const WORK_START_HOUR = 9;
      const WORK_END_HOUR = 17;
      const MINS_PER_DAY = (WORK_END_HOUR - WORK_START_HOUR) * 60; // 480 mins

      // Helper: Get minutes from midnight
      const getMins = (d: Date) => d.getHours() * 60 + d.getMinutes();
      
      const startDay = new Date(start).setHours(0,0,0,0);
      const endDay = new Date(end).setHours(0,0,0,0);
      
      let totalMins = 0;

      if (startDay === endDay) {
         // Same Day
         // Clamp start/end to work hours
         const sMins = Math.max(getMins(start), WORK_START_HOUR * 60);
         const eMins = Math.min(getMins(end), WORK_END_HOUR * 60);
         
         const diff = eMins - sMins;
         totalMins = diff > 0 ? diff : 0;
      } else {
         // Different Days
         
         // 1. Start Day contribution (Start Time -> 17:00)
         const sMins = Math.max(getMins(start), WORK_START_HOUR * 60);
         const sContribution = Math.max(0, (WORK_END_HOUR * 60) - sMins);
         
         // 2. End Day contribution (09:00 -> End Time)
         const eMins = Math.min(getMins(end), WORK_END_HOUR * 60);
         const eContribution = Math.max(0, eMins - (WORK_START_HOUR * 60));
         
         // 3. Full Days Between
         const oneDay = 24 * 60 * 60 * 1000;
         const diffDays = Math.round((endDay - startDay) / oneDay);
         const fullDays = diffDays - 1; 
         
         totalMins = sContribution + eContribution + (fullDays * MINS_PER_DAY);
      }

      // Final Duration in Days
      const days = totalMins / MINS_PER_DAY;
      
      // Round to 2 decimals, but if it's practically integer (e.g. 1.00), allow it.
      return Number(days.toFixed(2));

    } else if (type === "Short" && shortDate && shortStartTime && shortEndTime) {
      // Short leave duration (Hours)
      const [startH, startM] = shortStartTime.split(":").map(Number);
      const [endH, endM] = shortEndTime.split(":").map(Number);
      let diff = endH - startH + (endM - startM) / 60;
      if (diff < 0) diff = 0;
      return diff;
    }
    return 0;
  }, [type, startDateTime, endDateTime, shortDate, shortStartTime, shortEndTime]);

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
    if (!reason) return;
    if (type === "Regular" && (!startDateTime || !endDateTime)) return;
    if (type === "Regular" && !nature) return;
    if (type === "Short" && (!shortDate || !shortStartTime || !shortEndTime)) return;

    // Mock File Upload (Convert File objects to Attachments)
    const attachments = selectedFiles.map((file) => ({
      id: `f${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Mock URL for blob
    }));

    // Prepare Dates
    let finalStart = "";
    let finalEnd = "";

    if (type === "Regular") {
      finalStart = startDateTime; // Already ISO-like YYYY-MM-DDTHH:mm
      finalEnd = endDateTime;
    } else {
       // Short leave construction
       finalStart = `${shortDate}T${shortStartTime}`;
       finalEnd = `${shortDate}T${shortEndTime}`;
    }

    // Perform Application
    applyLeave(
      currentUser.id,
      type,
      finalStart,
      finalEnd,
      reason,
      type === "Regular" ? (nature as LeaveNature) : undefined,
      type === "Short",
      type === "Short" ? { start: shortStartTime, end: shortEndTime } : undefined,
      attachments,
      duration
    );

    // --- Notification Logic ---

    // 1. Notify Applicant (Self)
    addNotification({
      userId: currentUser.id,
      title: "Application Submitted",
      message: `Your ${type} leave application has been submitted successfully.`,
      type: "success",
      link: "/dashboard/my-applications",
    });

    // 2. Notify Approver
    const approverId = currentUser.sequentialApprovers?.[0];
    if (approverId) {
      addNotification({
        userId: approverId,
        title: "New Leave Request",
        message: `${currentUser.name} has applied for ${type} leave.`,
        type: "info",
        link: "/dashboard/approvals", // Or link to specific request if we had the ID returned
      });
    }

    // 3. Notify HR
    const hrUsers = users.filter((u) => u.role === "HR");
    hrUsers.forEach((hr) => {
      // Avoid duplicate if HR is also the approver (unlikely but possible)
      if (hr.id !== approverId) {
        addNotification({
          userId: hr.id,
          title: "New Leave Request",
          message: `${currentUser.name} has applied for ${type} leave.`,
          type: "info",
          link: "/dashboard/approvals",
        });
      }
    });

    onClose();
  };

  const DateInput = ({
    label,
    value,
    onChange,
    min,
    required,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    min?: string;
    required?: boolean;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div
          onClick={() => inputRef.current?.showPicker()}
          className="relative cursor-pointer"
        >
          <input
            type="text"
            readOnly
            value={value ? formatDate(value) : ""}
            placeholder="DD-MM-YYYY"
            required={required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer bg-white"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            📅
          </div>
          <input
            ref={inputRef}
            type="date"
            required={required}
            value={value}
            min={min}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
            tabIndex={-1}
          />
        </div>
      </div>
    );
  };

  const DateTimeInput = ({
    label,
    value,
    onChange,
    min,
    required,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    min?: string;
    required?: boolean;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div
          onClick={() => inputRef.current?.showPicker()}
          className="relative cursor-pointer"
        >
          <input
            type="text"
            readOnly
            value={value ? formatDateTime(value) : ""}
            placeholder="DD-MM-YYYY HH:mm AM/PM"
            required={required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer bg-white"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            📅
          </div>
          <input
            ref={inputRef}
            type="datetime-local"
            required={required}
            value={value}
            min={min}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
            tabIndex={-1}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
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

        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Row 1: Type & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Leave Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Leave Type
                  </label>
                  <div className="flex space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer p-2.5 border rounded-lg hover:bg-gray-50 flex-1 transition-colors justify-center">
                      <input
                        type="radio"
                        name="type"
                        checked={type === "Regular"}
                        onChange={() => {
                          setType("Regular");
                          // Reset inputs on switch to defaults
                          const now = new Date();
                          const today = now.toISOString().split('T')[0];
                          setStartDateTime(`${today}T09:00`);
                          setEndDateTime(`${today}T17:00`);
                        }}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span
                        className={`font-medium text-sm ${
                          type === "Regular" ? "text-indigo-700" : "text-gray-600"
                        }`}
                      >
                        Regular (Days)
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-2.5 border rounded-lg hover:bg-gray-50 flex-1 transition-colors justify-center">
                      <input
                        type="radio"
                        name="type"
                        checked={type === "Short"}
                        onChange={() => {
                          setType("Short");
                          setShortDate("");
                          setShortStartTime("");
                          setShortEndTime("");
                        }}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span
                        className={`font-medium text-sm ${
                          type === "Short" ? "text-indigo-700" : "text-gray-600"
                        }`}
                      >
                        Short (Hours)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Leave Category (Only for Regular) - or Spacer */}
                {type === "Regular" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Leave Category
                    </label>
                    <select
                      value={nature}
                      onChange={(e) => setNature(e.target.value as LeaveNature)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white"
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
                ) : <div className="hidden md:block"></div>}
            </div>

            {/* Leave Type Description */}
            <p className="text-xs text-gray-400 -mt-3">
                {type === "Regular"
                  ? "Calculated in full days (8 hours)."
                  : "Calculated in hours only."}
              </p>

            {/* Row 2: Dates */}
            <div className="space-y-4">
              {/* Regular Leave Inputs: DateTime Pickers */}
              {type === "Regular" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <DateTimeInput
                          label="Start Date & Time"
                          required
                          value={startDateTime}
                          onChange={setStartDateTime}
                        />
                    </div>
                    <div>
                        <DateTimeInput
                          label="End Date & Time"
                          required
                          value={endDateTime}
                          min={startDateTime}
                          onChange={setEndDateTime}
                        />
                    </div>
                </div>
              )}

              {/* Short Leave Inputs (Date + Times) */}
              {type === "Short" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <DateInput
                        label="Date"
                        value={shortDate}
                        onChange={(val) => setShortDate(val)}
                        required
                      />
                     <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          required
                          value={shortStartTime}
                          onChange={(e) => setShortStartTime(e.target.value)}
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
                          value={shortEndTime}
                          onChange={(e) => setShortEndTime(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                </div>
              )}
            </div>

            {/* Row 3: Reason & Attachments */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Reason */}
                <div className="flex flex-col">
                     <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Reason
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow resize-none flex-grow"
                        rows={3} // Reduced rows
                        placeholder="Please briefly explain the reason for your leave..."
                      />
                </div>
                
                {/* File Upload - Compact Grid */}
                <div>
                     <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-medium text-gray-700">
                          Attachments (Optional)
                        </label>
                        <span className="text-xs text-gray-400">
                          Max 5 files
                        </span>
                     </div>
                     
                     <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 min-h-[100px] relative">
                         <div className="flex flex-wrap gap-3 relative z-10">
                            {/* Existing Files */}
                            {selectedFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="relative w-16 h-16 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center group overflow-hidden shadow-sm"
                                title={file.name}
                              >
                                <span className="text-2xl">📄</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeFile(idx)}}
                                  className="absolute top-0.5 right-0.5 bg-red-100 text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ✕
                                </button>
                                <span className="text-[9px] text-gray-500 w-full px-1 text-center truncate absolute bottom-1">
                                  {(file.size / 1024).toFixed(0)}KB
                                </span>
                              </div>
                            ))}

                            {/* Add Button Logic within Grid */}
                            {selectedFiles.length < 5 && (
                              <div className="relative w-16 h-16 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer text-gray-400 hover:text-indigo-500">
                                   <span className="text-xl">+</span>
                                    <input
                                      type="file"
                                      multiple
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      onChange={handleFileChange}
                                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                    />
                              </div>
                            )}
                         </div>

                         {/* Fallback Text if Empty */}
                         {selectedFiles.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"> 
                                <p className="text-xs text-gray-400">Drag & drop or Click +</p>
                            </div>
                         )}
                     </div>
                     {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
                </div>
             </div>

            {/* Warning Message */}
            {warning && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">{warning}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show Duration Info for Regular Leave (Compact) */}
            {type === "Regular" && duration > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg flex items-center justify-between">
                   <p className="text-sm text-blue-700 font-medium">Calculated Duration: <span className="font-bold">{(() => {
                        const totalHours = duration * 8;
                        const d = Math.floor(totalHours / 8);
                        const h = Math.round(totalHours % 8);
                        let text = "";
                        if (d > 0) text += `${d} Day${d > 1 ? 's' : ''}`;
                        if (h > 0) text += `${d > 0 ? ' ' : ''}${h} Hour${h > 1 ? 's' : ''}`;
                        return text || "0 Days";
                   })()}</span></p>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50 bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
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
