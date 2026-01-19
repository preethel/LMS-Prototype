import { useLMS } from "@/context/LMSContext";
import { useNotification } from "@/context/NotificationContext";
import { LeaveNature, LeaveType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useMemo, useRef, useState } from "react";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ApplyLeaveContent({ onClose }: { onClose: () => void }) {
  const { currentUser, applyLeave, balances, users, weekendDays } = useLMS();
  const { addNotification } = useNotification();

  const [type, setType] = useState<LeaveType>("Regular");
  const [nature, setNature] = useState<LeaveNature | "">("Casual");
  
  // HR: Employee Selection
  const isHR = currentUser?.role === "HR";
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  // Determine who we are applying for:
  const targetUserId = isHR && selectedEmployeeId ? selectedEmployeeId : currentUser?.id || "";
  const targetUser = users.find(u => u.id === targetUserId);

  // --- State for Regular Leave (Days) ---
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // --- State for Short Leave (Hourly) ---
  const [shortDate, setShortDate] = useState("");
  const [shortStartTime, setShortStartTime] = useState("");
  const [shortEndTime, setShortEndTime] = useState("");

  const [reason, setReason] = useState("");

  // --- Duration Calculation ---
  const duration = useMemo(() => {
    if (type === "Regular" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) return 0;

      let count = 0;
      const current = new Date(start);
      // Iterate from start to end day inclusive
      while (current <= end) {
        if (!weekendDays.includes(current.getDay())) {
          count++;
        }
        // Move to next day
        current.setDate(current.getDate() + 1);
      }
      return count;

    } else if (type === "Short" && shortDate && shortStartTime && shortEndTime) {
      // Short leave duration calculation (Hours)
      const [startH, startM] = shortStartTime.split(":").map(Number);
      const [endH, endM] = shortEndTime.split(":").map(Number);
      
      let diff = (endH + endM / 60) - (startH + startM / 60);
      if (diff < 0) diff = 0;
      
      return Number(diff.toFixed(2));
    }
    return 0;
  }, [type, startDate, endDate, shortDate, shortStartTime, shortEndTime, weekendDays]);

  // --- Warnings ---
  const warning = useMemo(() => {
    if (
        type === "Regular" &&
        duration > 0 &&
        targetUserId &&
        balances &&
        nature
    ) {
        const myBalance = balances.find((b) => b.userId === targetUserId);
        if (myBalance) {
             if (nature === "Sick") {
                const remainingSick = (myBalance.sickQuota || 14) - (myBalance.sickUsed || 0); // Assuming 14 default if undefined
                if (duration > remainingSick) return `Warning: Exceeds remaining Sick Leave (${remainingSick} days).`;
             } else if (nature === "Casual") {
                const remainingCasual = (myBalance.casualQuota || 10) - (myBalance.casualUsed || 0);
                if (duration > remainingCasual) return `Warning: Exceeds remaining Casual Leave (${remainingCasual} days).`;
             }
        }
    }
    return "";
  }, [type, duration, targetUserId, balances, nature]);


  // --- File Upload ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFileError("");
      const totalFiles = [...selectedFiles, ...newFiles];
      if (totalFiles.length > 5) {
        setFileError("Maximum 5 files allowed.");
        return;
      }
      const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setFileError(`File ${oversizedFiles[0].name} exceeds 10MB.`);
        return;
      }
      setSelectedFiles(totalFiles);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isHR && !selectedEmployeeId) {
        alert("Please select an employee.");
        return;
    }

    if (!reason) return;
    if (type === "Regular" && (!startDate || !endDate)) return;
    if (type === "Regular" && !nature) return; 
    if (type === "Short" && (!shortDate || !shortStartTime || !shortEndTime)) return;

    // Convert Files
    const attachments = selectedFiles.map((file) => ({
      id: `f${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), 
    }));

    let finalStart = "";
    let finalEnd = "";

    if (type === "Regular") {
        // For Regular, we assume full days. 
        // We can append arbitrary times (e.g. 00:00 - 23:59) or just keep dates if backend supports it.
        // Based on previous code, it used T09:00 / T17:00. Let's stick to that for consistency if needed, 
        // or just send ISO Date string. The context implies string dates are OK.
        finalStart = `${startDate}T09:00:00`; 
        finalEnd = `${endDate}T17:00:00`;
    } else {
        finalStart = `${shortDate}T${shortStartTime}`;
        finalEnd = `${shortDate}T${shortEndTime}`;
    }

    applyLeave(
      targetUserId,
      type,
      finalStart,
      finalEnd,
      reason,
      nature as LeaveNature, // Pass nature for both
      type === "Short", // isShortLeave
      type === "Short" ? { start: shortStartTime, end: shortEndTime } : undefined,
      attachments,
      duration
    );

    // Notifications
    // 1. Notify the Applicant (if apply logic allows applying for self or others, good to confirm)
    if (targetUserId === currentUser.id) {
         addNotification({
            userId: currentUser.id,
            title: "Application Submitted",
            message: `Your ${type} leave application has been submitted.`,
            type: "success",
            link: "/dashboard/my-applications",
        });
    } else {
        // HR Applied for someone else
         addNotification({
            userId: currentUser.id,
            title: "Application Submitted",
            message: `Leave application for ${targetUser?.name} submitted successfully.`,
            type: "success",
            link: "/dashboard/approvals", // HR view
        });
        
         addNotification({
            userId: targetUserId,
            title: "Leave Application Submitted",
            message: `Values HR has submitted a ${type} leave application on your behalf.`,
            type: "info",
            link: "/dashboard/my-applications",
        });
    }

    // 2. Notify Approver
    // If HR applied, does it need approval? 
    // Usually HR applying implies auto-approval or strictly recorded.
    // The context `applyLeave` function follows standard flow (starts as Pending for first approver).
    // So we notify the approver.
    const approverId = targetUser?.sequentialApprovers?.[0];
    if (approverId) {
       addNotification({
         userId: approverId,
         title: "New Leave Request",
         message: `${targetUser?.name} has applied for ${type} leave (via HR).`,
         type: "info",
         link: "/dashboard/approvals",
       });
    }

    // 3. Notify other HRs (Audit)
     const hrUsers = users.filter((u) => u.role === "HR");
     hrUsers.forEach((hr) => {
       if (hr.id !== currentUser.id && hr.id !== approverId) { // Don't notify self again
         addNotification({
           userId: hr.id,
           title: "New Leave Request",
           message: `${targetUser?.name} has applied for ${type} leave.`,
           type: "info",
           link: "/dashboard/approvals",
         });
       }
     });

    onClose();
  };

  const DateInput = ({ label, value, onChange, min, required }: { label: string, value: string, onChange: (val: string) => void, min?: string, required?: boolean }) => {
      const inputRef = useRef<HTMLInputElement>(null);
      return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div onClick={() => inputRef.current?.showPicker()} className="relative cursor-pointer">
                <input type="text" readOnly value={value ? formatDate(value) : ""} placeholder="DD-MM-YYYY" required={required} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-gray-700"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">📅</div>
                <input ref={inputRef} type="date" required={required} value={value} min={min} onChange={(e) => onChange(e.target.value)} 
                    className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none" tabIndex={-1}
                />
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Apply for Leave</h2>
                <p className="text-sm text-gray-500 mt-1">Submit your leave request for approval.</p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="p-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* HR Only: Employee Selection */}
                {isHR && (
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-indigo-900 mb-2">Select Employee (HR Mode)</label>
                        <select 
                            value={selectedEmployeeId} 
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-medium"
                        >
                            <option value="">-- Select Employee --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name} {u.employeeCode ? `(${u.employeeCode})` : ""} - {u.designation}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                            ℹ️ You are applying on behalf of this employee.
                        </p>
                    </div>
                )}
                
                {/* Leave Type Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900">Leave Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        <label className={`
                            relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${type === "Regular" ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
                        `}>
                            <input type="radio" name="type" className="sr-only" checked={type === "Regular"} onChange={() => {
                                setType("Regular");
                                // Defaults
                                setStartDate(new Date().toISOString().split('T')[0]);
                                setEndDate(new Date().toISOString().split('T')[0]);
                            }} />
                            <span className={`text-lg mb-1 ${type === "Regular" ? "text-indigo-700" : "text-gray-500"}`}>🗓️</span>
                            <span className={`font-semibold ${type === "Regular" ? "text-indigo-900" : "text-gray-700"}`}>Regular Leave</span>
                        </label>

                        <label className={`
                            relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${type === "Short" ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
                        `}>
                            <input type="radio" name="type" className="sr-only" checked={type === "Short"} onChange={() => {
                                setType("Short");
                            }} />
                            <span className={`text-lg mb-1 ${type === "Short" ? "text-indigo-700" : "text-gray-500"}`}>⏱️</span>
                            <span className={`font-semibold ${type === "Short" ? "text-indigo-900" : "text-gray-700"}`}>Short Leave</span>
                        </label>
                    </div>
                </div>

                {/* Conditional Inputs */}
                {/* Conditional Inputs */}
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    
                    {type === "Regular" ? (
                        <>
                             {/* Category */}
                             <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Leave Category</label>
                                <select value={nature} onChange={(e) => setNature(e.target.value as LeaveNature)} required
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none"
                                >
                                    <option value="Casual">Casual Leave (Paid)</option>
                                    <option value="Sick">Sick Leave (Paid)</option>
                                    <option value="Maternity">Maternity Leave</option>
                                    <option value="Pilgrim">Pilgrim Leave</option>
                                    <option value="Unpaid">Unpaid Leave</option>
                                    <option value="Other">Other</option>
                                </select>
                             </div>

                             {/* Dates */}
                             <div className="grid grid-cols-2 gap-6">
                                <DateInput label="Start Date" value={startDate} onChange={setStartDate} required />
                                <DateInput label="End Date" value={endDate} onChange={setEndDate} min={startDate} required />
                             </div>

                             {/* Duration Warning/Info */}
                             <div className={`p-4 rounded-xl border ${duration > 0 ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"}`}>
                                 <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Total Duration</span>
                                    <span className="text-lg font-bold text-gray-900">{duration} Days</span>
                                 </div>
                                 <p className="text-xs text-gray-500 mt-1">Weekends (Fri-Sat) are excluded.</p>
                                 {warning && <p className="text-xs font-semibold text-amber-600 mt-2">⚠️ {warning}</p>}
                             </div>
                        </>
                    ) : (
                        <>
                             {/* Short Leave Inputs */}
                             <DateInput label="Date" value={shortDate} onChange={setShortDate} required />
                             
                             <div className="grid grid-cols-2 gap-6">
                                 <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Start Time</label>
                                    <input type="time" value={shortStartTime} onChange={(e) => setShortStartTime(e.target.value)} required 
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">End Time</label>
                                    <input type="time" value={shortEndTime} onChange={(e) => setShortEndTime(e.target.value)} required 
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                 </div>
                             </div>
                             
                             <div className={`p-4 rounded-xl border ${duration > 0 ? "bg-indigo-50 border-indigo-100" : "bg-gray-50 border-gray-100"}`}>
                                 <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">Total Hours</span>
                                    <span className="text-lg font-bold text-gray-900">{duration} Hrs</span>
                                 </div>
                                 <p className="text-xs text-indigo-600 font-medium mt-1">Marked as Short Leave (Casual if balanced)</p>
                             </div>
                        </>
                    )}
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Reason</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                        placeholder="Please explain the reason..."
                    />
                </div>

                {/* File Upload */}
                <div>
                   <label className="block text-sm font-semibold text-gray-900 mb-2">Attachments <span className="font-normal text-gray-400">(Max 5)</span></label>
                   <div className="grid grid-cols-5 gap-3">
                       {selectedFiles.map((file, idx) => (
                          <div key={idx} className="relative group aspect-square bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                              <span className="text-2xl mb-1">📄</span>
                              <span className="text-[10px] text-gray-500 w-full truncate">{file.name}</span>
                              <button type="button" onClick={() => removeFile(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                       ))}
                       {selectedFiles.length < 5 && (
                           <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition-all text-gray-400 hover:text-indigo-500">
                               <span className="text-2xl">+</span>
                               <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                           </label>
                       )}
                   </div>
                   {fileError && <p className="text-xs text-red-500 mt-2">{fileError}</p>}
                </div>

                {/* Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:static md:bg-transparent md:border-0 md:p-0 flex justify-end gap-3 z-20">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95">
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
