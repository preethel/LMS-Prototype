"use client";

import AttachmentsModal from "@/components/Dashboard/AttachmentsModal";
import EmployeeHistoryModal from "@/components/Dashboard/EmployeeHistoryModal";
import { useLMS } from "@/context/LMSContext";
import { useNotification } from "@/context/NotificationContext";
import { formatDate, formatDuration } from "@/lib/utils";
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
      if (
        step.status === "Approved" &&
        actor &&
        !["HR", "MD"].includes(actor.role)
      ) {
        displayStatus = "Recommended";
      }

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

      // Find where we are in sequence
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
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {requester?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {requester?.name}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {requester?.designation}
                  </p>
                </div>
              </div>

              <div className="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>

              <div className="hidden md:block">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  {currentUser.id === request.userId
                    ? "Projected Balance"
                    : "Current Balance"}
                </p>
                <div className="text-sm font-bold text-indigo-600 flex items-baseline gap-1">
                  {(() => {
                    // Normalize everything to Hours (1 Day = 8 Hours)
                    const totalQuotaHours =
                      (requesterBalance?.totalDays || 0) * 8;

                    const usedHours =
                      (requesterBalance?.usedDays || 0) * 8 +
                      (requesterBalance?.usedHours || 0);

                    let remainingHours = totalQuotaHours - usedHours;

                    // If Applicant View, deduct THIS request's value visually
                    if (
                      currentUser.id === request.userId &&
                      request.status === "Pending"
                    ) {
                      const deduction =
                        request.type === "Short"
                          ? request.daysCalculated // Short leave stored as hours
                          : request.daysCalculated * 8; // Regular leave stored as days
                      remainingHours -= deduction;
                    }

                    const displayDays = Math.floor(remainingHours / 8);
                    const displayHours = remainingHours % 8;

                    return (
                      <>
                        {formatDuration(displayDays)}
                        <span className="text-xs font-normal text-gray-500">
                          Days
                        </span>
                        {displayHours > 0 && (
                          <>
                            {" "}
                            {formatDuration(displayHours)}
                            <span className="text-xs font-normal text-gray-500">
                              Hours
                            </span>
                          </>
                        )}
                      </>
                    );
                  })()}
                  <span className="text-gray-400 font-normal ml-1 text-xs">
                    Remaining
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile-only balance view could go here if needed, but for now we rely on the responsive stack */}
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
              >
                View History
              </button>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                Start Date
              </label>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(request.startDate)}
              </p>
              {request.startTime && (
                <p className="text-sm text-gray-500">{request.startTime}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                End Date
              </label>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(request.endDate)}
              </p>
              {request.endTime && (
                <p className="text-sm text-gray-500">{request.endTime}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                Duration
              </label>
              <p className="text-lg font-medium text-indigo-600">
                {formatDuration(request.daysCalculated)}{" "}
                {request.type === "Short" ? "Hours" : "Days"}
              </p>
            </div>

            <div className="col-span-1 md:col-span-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Reason
              </label>
              <div className="bg-gray-50 p-3 rounded-xl text-gray-600 leading-relaxed">
                {request.reason}
              </div>
            </div>

            {/* Attachments Section */}
            {request.attachments && request.attachments.length > 0 && (
              <div className="col-span-1 md:col-span-3">
                <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                      📎
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-900 text-sm">
                        Attachments
                      </h4>
                      <p className="text-xs text-indigo-600">
                        {request.attachments.length} files attached
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAttachmentsOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    View & Download
                  </button>
                </div>
              </div>
            )}

            {/* Unpaid Field / Administrative - ONLY VISIBLE TO HR/MD */}
            {isFinalAuthority && (
              <div className="col-span-1 md:col-span-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block">
                      Unpaid / LWP Days
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Mark days as Loss of Pay if applicable
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={request.daysCalculated}
                      value={formatDuration(request.unpaidLeaveDays || 0)}
                      onChange={(e) =>
                        updateUnpaidLeaveDays(
                          request.id,
                          Number(e.target.value)
                        )
                      }
                      className="w-24 text-center px-3 py-2 border border-gray-200 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-gray-300"
                    />
                    <span className="text-gray-400 font-medium">
                      / {formatDuration(request.daysCalculated)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(!isReadOnly || hasProcessed) && (
            <div className="p-5 bg-gray-50 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {hasProcessed && isReadOnly
                  ? "My Remarks"
                  : "Remarks (Optional)"}
              </label>
              <textarea
                value={
                  hasProcessed && isReadOnly
                    ? hasProcessed.remarks || ""
                    : remarks
                }
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add a note..."
                disabled={!!(hasProcessed && isReadOnly)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-4 transition-all disabled:bg-gray-100 disabled:text-gray-500"
                rows={2}
              />
              {!isReadOnly && (
                <div className="flex gap-4">
                  {hasProcessed ? (
                    <>
                      <button
                        onClick={handleApprove}
                        disabled={hasProcessed.status === "Approved"}
                        className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
                          hasProcessed.status === "Approved"
                            ? "bg-green-50 text-green-300 cursor-not-allowed border border-green-100"
                            : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5 shadow-green-200"
                        }`}
                      >
                        {hasProcessed.status === "Approved" ||
                        hasProcessed.status === "Recommended"
                          ? isFinalAuthority
                            ? "Approved"
                            : "Recommended"
                          : isFinalAuthority
                          ? "Change to Approve"
                          : "Change to Recommend"}
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={
                          hasProcessed.status === "Rejected" ||
                          hasProcessed.status === "Not Recommended"
                        }
                        className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
                          hasProcessed.status === "Rejected" ||
                          hasProcessed.status === "Not Recommended"
                            ? "bg-red-50 text-red-300 cursor-not-allowed border border-red-100"
                            : "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:shadow-lg hover:-translate-y-0.5"
                        }`}
                      >
                        {hasProcessed.status === "Rejected" ||
                        hasProcessed.status === "Not Recommended"
                          ? isFinalAuthority
                            ? "Rejected"
                            : "Not Recommended"
                          : isFinalAuthority
                          ? "Change to Reject"
                          : "Change to Not Recommend"}
                      </button>
                    </>
                  ) : (
                    <>
                      {isFinalAuthority && !hasProcessed ? (
                        <>
                          {/* HR/Admin Special Actions */}
                          <button
                            onClick={() => {
                              if (hasProcessed) {
                                editApproval(
                                  request.id,
                                  currentUser.id,
                                  "Approved",
                                  remarks
                                );
                              } else {
                                approveLeave(
                                  request.userId,
                                  request.id,
                                  currentUser.id,
                                  remarks,
                                  true // isFinalDecision = true
                                );
                              }
                              router.push("/leave/dashboard");
                            }}
                            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-2.5 rounded-xl font-bold hover:from-green-700 hover:to-green-600 transition-all shadow-lg shadow-green-100 transform hover:-translate-y-0.5"
                          >
                            Approve & Finalize
                          </button>
                          {/* Forward to Director Button - Only for HR */}
                          {currentUser.role === "HR" && (
                            <button
                              onClick={() => {
                                // Forward to Director
                                approveLeave(
                                  request.userId,
                                  request.id,
                                  currentUser.id,
                                  remarks,
                                  false // isFinalDecision = false
                                );
                                router.push("/dashboard");
                              }}
                              className="flex-1 bg-white text-indigo-600 border border-indigo-200 py-2.5 rounded-xl font-bold hover:bg-indigo-50 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              Forward to Director
                            </button>
                          )}
                          <button
                            onClick={handleReject}
                            className="px-6 py-2.5 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-all"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleApprove}
                            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 transform hover:-translate-y-0.5"
                          >
                            {isFinalAuthority ? "Approve" : "Recommend"}
                          </button>
                          <button
                            onClick={handleReject}
                            className="flex-1 bg-white text-red-600 border border-red-200 py-2.5 rounded-xl font-bold hover:bg-red-50 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            {isFinalAuthority ? "Reject" : "Not Recommend"}
                          </button>
                          <button
                            onClick={handleSkip}
                            className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all"
                          >
                            Forward
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
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
