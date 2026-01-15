"use client";

import AttachmentsModal from "@/components/Dashboard/AttachmentsModal";
import EmployeeHistoryModal from "@/components/Dashboard/EmployeeHistoryModal";
import { useLMS } from "@/context/LMSContext";
import { useNotification } from "@/context/NotificationContext";
import { formatDate, formatDateTime, formatDuration } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useState } from "react";

export default function LeaveRequestDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    leaves,
    users,
    balances,
    currentUser,
    approveLeave,
    rejectLeave,
    editApproval,
    skipLeave,
    updateUnpaidLeaveDays,
  } = useLMS();
  const { addNotification } = useNotification();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReadOnly = searchParams.get("readOnly") === "true";
  const [remarks, setRemarks] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);

  const { id } = use(params);
  const request = leaves.find((l) => l.id === id);

  if (!request || !currentUser)
    return (
      <div className="p-12 text-center text-gray-500">
        Request not found or not logged in
      </div>
    );

  const isFinalAuthority =
    currentUser.role === "HR" || currentUser.role === "MD";

  const requester = users.find((u) => u.id === request.userId);
  const requesterBalance = balances.find((b) => b.userId === request.userId);

  const hasProcessed = request.approvalChain.find(
    (s) => s.approverId === currentUser.id
  );

  // --- Actions ---
  const handleApprove = () => {
    if (hasProcessed) {
      editApproval(request.id, currentUser.id, "Approved", remarks);
    } else {
      approveLeave(request.userId, request.id, currentUser.id, remarks);
    }

    // Notify Requester
    if (requester && requester.id !== currentUser.id) {
      addNotification({
        userId: requester.id,
        title: "Leave Request Updated",
        message: `Your leave request has been marked as Approved by ${currentUser.name}.`,
        type: "success",
        link: `/leave/requests/${request.id}`,
      });
    }

    router.push("/leave/dashboard");
  };

  const handleReject = () => {
    if (hasProcessed) {
      editApproval(request.id, currentUser.id, "Rejected", remarks);
    } else {
      rejectLeave(request.id, currentUser.id, remarks);
    }

    // Notify Requester
    if (requester && requester.id !== currentUser.id) {
      addNotification({
        userId: requester.id,
        title: "Leave Request Rejected",
        message: `Your leave request has been Rejected by ${currentUser.name}.`,
        type: "error",
        link: `/leave/requests/${request.id}`,
      });
    }

    router.push("/leave/dashboard");
  };

  const handleSkip = () => {
    skipLeave(request.id, currentUser.id);
    router.push("/leave/dashboard");
  };

  // --- Timeline Logic ---
  const getTimelineEvents = () => {
    const events: {
      title: string;
      date?: string;
      status:
        | "Calculated"
        | "Pending"
        | "Upcoming"
        | "Approved"
        | "Rejected"
        | "Skipped"
        | "Recommended"
        | "Not Recommended"
        | "Applied";
      actor?: string;
      role?: string;
      remarks?: string;
      isConnector?: boolean;
    }[] = [];

    // 1. Applied
    events.push({
      title: "Application Submitted",
      date: request.createdAt,
      status: "Applied",
      actor: requester?.name,
      role: requester?.designation,
    });

    // 2. Past Actions (Approval Chain)
    request.approvalChain.forEach((step) => {
      const actor = users.find((u) => u.id === step.approverId);

      // Determine display status (Recommend vs Approve)
      let displayStatus = step.status;
      if (displayStatus === "Recommended") displayStatus = "Approved";
      if (displayStatus === "Not Recommended") displayStatus = "Rejected";

      const event: {
        title: string;
        date?: string;
        status:
          | "Calculated"
          | "Pending"
          | "Upcoming"
          | "Approved"
          | "Rejected"
          | "Skipped"
          | "Recommended"
          | "Not Recommended"
          | "Applied";
        actor?: string;
        role?: string;
        remarks?: string;
        isConnector?: boolean;
      } = {
        title: displayStatus,
        date: step.date,
        status: step.status as any, // Cast specific approval status to general status
        actor: actor?.name,
        role: actor?.designation,
      };

      // Add delegation note to remarks if present (or handle display otherwise)
      // Since `remarks` is simple string, let's append or handle in render.
      // Better: Add a `delegatedFrom` field to event object if I want clean structure.
      if (step.delegatedFromId) {
        const delegatedUser = users.find((u) => u.id === step.delegatedFromId);
        if (delegatedUser) {
          (event as any).delegatedFromName = delegatedUser.name;
        }
      }

      // Only show remarks if NOT the applicant
      if (currentUser.id !== request.userId) {
        event.remarks = step.remarks;
      }

      events.push(event);
    });

    // 3. Current & Future (If still pending/active)
    if (request.status === "Pending") {
      const seqApprovers = requester?.sequentialApprovers || [];
      const currentApproverId = request.currentApproverId;

      // I will read the loop first before replacing.e in sequence
      let currentIndex = -1;
      if (currentApproverId) {
        currentIndex = seqApprovers.indexOf(currentApproverId);
      }

      // 3.1: Current Pending Step
      if (currentApproverId) {
        const currentParams = users.find((u) => u.id === currentApproverId);
        if (currentParams) {
          events.push({
            title: "Currently Pending",
            status: "Pending",
            actor: currentParams.name,
            role: currentParams.designation,
          });
        }
      }

      // 3.2: Future Steps (Sequence)
      if (currentIndex !== -1) {
        // Show remaining sequential approvers
        for (let i = currentIndex + 1; i < seqApprovers.length; i++) {
          const u = users.find((user) => user.id === seqApprovers[i]);
          if (u) {
            events.push({
              title: "Up Next",
              status: "Upcoming",
              actor: u.name,
              role: u.designation,
            });
          }
        }
      }

      // 3.3: Future Steps (HR / Final)
      // If we are still in sequence (seqIndex < length) OR if currently with HR/MD, we might need to show next steps.
      // Logic simplified: If the last predicted step wasn't HR/MD, add HR as "Up Next" (unless HR is already current/past)

      const lastEventActor = events[events.length - 1];
      const lastActorUser = users.find((u) => u.name === lastEventActor?.actor);

      if (
        lastActorUser &&
        !["HR", "MD", "Director"].includes(lastActorUser.role)
      ) {
        const hrUser = users.find((u) => u.role === "HR");
        if (hrUser && hrUser.id !== request.currentApproverId) {
          events.push({
            title: "Up Next",
            status: "Upcoming",
            actor: hrUser.name,
            role: hrUser.designation,
          });
        }
      }
    } else if (request.status === "Approved") {
      events.push({
        title: "Request Finalized",
        date: request.approvalChain[request.approvalChain.length - 1]?.date,
        status: "Approved",
        actor: "System",
      });
    } else if (request.status === "Rejected") {
      events.push({
        title: "Request Closed",
        date: request.approvalChain[request.approvalChain.length - 1]?.date,
        status: "Rejected",
        actor: "System",
      });
    }

    return events;
  };

  const timelineEvents = getTimelineEvents();

  // --- Render Helpers ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
      case "Recommended":
        return "bg-green-100 text-green-700 border-green-200";
      case "Rejected":
      case "Not Recommended":
        return "bg-red-100 text-red-700 border-red-200";
      case "Pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Skipped":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Applied":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-500 border-gray-100";
    }
  };

  const getTimelineIconColor = (status: string) => {
    switch (status) {
      case "Applied":
        return "bg-blue-500";
      case "Approved":
      case "Recommended":
        return "bg-green-500";
      case "Rejected":
      case "Not Recommended":
        return "bg-red-500";
      case "Skipped":
        return "bg-gray-400";
      case "Pending":
        return "bg-orange-500 animate-pulse";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <div className="w-full">
      {/* Horizontal Timeline Section */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Request Timeline
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="relative flex justify-between">
            {/* Horizontal Line Background */}
            <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-100 -z-0"></div>

            {timelineEvents.map((event, idx) => {
              // Calculate width for the progress bar (if we wanted a colored progress bar)
              // For now, simple static line is fine.
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center relative z-10 flex-1 group"
                >
                  {/* Node Dot */}
                  <div
                    className={`w-7 h-7 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${getTimelineIconColor(
                      event.status
                    )} transition-transform group-hover:scale-110`}
                  ></div>

                  {/* Content */}
                  <div className="mt-4 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">
                      {event.date ? formatDate(event.date) : "Expected"}
                    </p>
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">
                      {event.title}
                    </h4>
                    {event.actor && (
                      <div className="mt-0.5">
                        <p className="text-xs font-semibold text-gray-700">
                          {event.actor}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {event.role}
                        </p>
                        {(event as any).delegatedFromName && (
                          <p className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded w-fit mx-auto mt-0.5">
                            Via {(event as any).delegatedFromName}
                          </p>
                        )}
                      </div>
                    )}
                    {event.remarks && (
                      <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600 border border-gray-100 max-w-[200px] mx-auto">
                        {event.remarks}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Main Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header: Requester Info & Balance */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {requester?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{requester?.name}</p>
                  <p className="text-gray-500 text-xs">{requester?.designation}</p>
                </div>
             </div>
             <button
                 onClick={() => setIsHistoryOpen(true)}
                 className="text-indigo-600 text-xs font-bold hover:underline"
              >
                 View History
              </button>
          </div>

          {/* Body: Compact Details Grid */}
          <div className="p-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Leave Type</span>
                    <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold border border-indigo-100">
                        {request.nature} ({request.type})
                    </span>
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Duration</span>
                    <span className="text-sm font-bold text-gray-900">
                        {(() => {
                            if (request.type === "Short") {
                                return `${formatDuration(request.daysCalculated)} Hours`;
                            }
                            // Calculate days/hours from stored value
                            // Assuming stored value is "Days" where 1 day = 8 hours
                            // If calculated correctly, e.g. 1.13 = 1 Day 1 Hour
                            // But usually users see 1.13 and get confused. 
                            // Let's re-use the logic: duration * 8 = total hours
                            const totalHours = request.daysCalculated * 8;
                            const d = Math.floor(totalHours / 8);
                            const h = Math.round(totalHours % 8);
                            let text = "";
                            if (d > 0) text += `${d} Day${d > 1 ? 's' : ''}`;
                            if (h > 0) text += `${d > 0 ? ' ' : ''}${h} Hour${h > 1 ? 's' : ''}`;
                            return text || "0 Days";
                        })()}
                    </span>
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Start Date</span>
                    <span className="text-sm font-medium text-gray-700 block">
                        {formatDateTime(request.startDate)}
                    </span>
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">End Date</span>
                    <span className="text-sm font-medium text-gray-700 block">
                        {formatDateTime(request.endDate)}
                    </span>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Reason</span>
                     <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 leading-relaxed border border-gray-100 h-25 overflow-y-auto">
                        {request.reason}
                     </div>
                </div>
                <div>
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Attachments</span>
                        {request.attachments && request.attachments.length > 0 && (
                            <button onClick={() => setIsAttachmentsOpen(true)} className="text-xs text-indigo-600 font-bold hover:underline">
                                View All
                            </button>
                        )}
                     </div>
                     <div className="bg-white border border-gray-200 rounded-lg p-3 h-25 overflow-y-auto">
                        {request.attachments && request.attachments.length > 0 ? (
                           <div className="flex flex-wrap gap-3">
                              {request.attachments.map((file, i) => (
                                  <div 
                                    key={i} 
                                    className="relative w-16 h-16 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center group overflow-hidden shadow-sm cursor-pointer hover:bg-indigo-50 transition-colors" 
                                    title={file.name || "Attachment"} 
                                    onClick={() => setIsAttachmentsOpen(true)}
                                  >
                                      <span className="text-2xl">📄</span>
                                      <span className="text-[9px] text-gray-500 w-full px-1 text-center truncate absolute bottom-1">
                                          {file.size ? `${(file.size / 1024).toFixed(0)}KB` : file.name}
                                      </span>
                                  </div>
                              ))}
                           </div>
                        ) : (
                           <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                             No attachments
                           </div>
                        )}
                     </div>
                </div>
             </div>
          </div>
          
          {/* Action Section - Separated */}
          {(!isReadOnly || hasProcessed) && (
              <div className="bg-gray-50 border-t border-gray-100 p-5">
                 
                 {/* Unpaid Days - Admin Only */}
                 {isFinalAuthority && (
                   <div className="mb-4 flex items-center gap-3">
                      <label className="text-xs font-bold text-gray-500 uppercase">Unpaid / LWP:</label>
                      <div className="flex items-center gap-1">
                        <input
                           type="number"
                           min="0"
                           max={request.daysCalculated}
                           value={formatDuration(request.unpaidLeaveDays || 0)}
                           onChange={(e) => updateUnpaidLeaveDays(request.id, Number(e.target.value))}
                           className="w-16 text-center px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <span className="text-xs text-gray-400">/ {formatDuration(request.daysCalculated)} Days</span>
                      </div>
                   </div>
                 )}

                 <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-grow w-full md:w-auto">
                        <textarea
                            value={hasProcessed && isReadOnly ? hasProcessed.remarks || "" : remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add your remarks here..."
                            disabled={!!(hasProcessed && isReadOnly)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow mb-0"
                            rows={1}
                        />
                    </div>
                    <div className="w-full md:w-auto flex flex-row gap-2 shrink-0">
                        {hasProcessed ? (
                            <>
                                <button
                                    onClick={handleApprove}
                                    disabled={hasProcessed.status === "Approved"}
                                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                                        hasProcessed.status === "Approved"
                                            ? "bg-green-100 text-green-700 cursor-not-allowed"
                                            : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                                    }`}
                                >
                                    {hasProcessed.status === "Approved" ? "Approved" : "Change to Approve"}
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={hasProcessed.status === "Rejected"}
                                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                                        hasProcessed.status === "Rejected"
                                            ? "bg-red-100 text-red-700 cursor-not-allowed"
                                            : "bg-white text-red-600 border border-red-200 hover:bg-red-50"
                                    }`}
                                >
                                    {hasProcessed.status === "Rejected" ? "Rejected" : "Change to Reject"}
                                </button>
                            </>
                        ) : (
                           <>
                             {/* Action Buttons Group */}
                             {isFinalAuthority ? (
                                <>
                                  <button onClick={() => {
                                      approveLeave(request.userId, request.id, currentUser.id, remarks, true);
                                      router.push("/leave/dashboard");
                                  }} className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm">
                                     Approve
                                  </button>
                                  
                                  {currentUser.role === "HR" && (
                                     <button 
                                        onClick={() => {
                                            approveLeave(request.userId, request.id, currentUser.id, remarks, false);
                                            router.push("/leave/dashboard");
                                        }}
                                        className="flex-1 md:flex-none px-4 py-2 bg-white text-indigo-600 border border-indigo-200 text-sm font-bold rounded-lg hover:bg-indigo-50"
                                     >
                                        Forward to Director
                                     </button>
                                  )}

                                  <button onClick={handleReject} className="flex-1 md:flex-none px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-50">
                                     Reject
                                  </button>
                                </>
                             ) : (
                                <>
                                  <button onClick={handleApprove} className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm">
                                     Approve
                                  </button>
                                  <button onClick={handleReject} className="flex-1 md:flex-none px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-50">
                                     Reject
                                  </button>
                                   <button onClick={handleSkip} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg text-sm">
                                      Forward
                                    </button>
                                </>
                             )}
                           </>
                        )}
                    </div>
                 </div>
              </div>
          )}
        </div>
      </div>

      <EmployeeHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        userId={request.userId}
        employeeName={requester?.name || "Employee"}
      />

      <AttachmentsModal
        isOpen={isAttachmentsOpen}
        onClose={() => setIsAttachmentsOpen(false)}
        attachments={request.attachments || []}
      />
    </div>
  );
}
