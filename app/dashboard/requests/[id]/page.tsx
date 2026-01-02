"use client";

import AttachmentsModal from "@/components/Dashboard/AttachmentsModal";
import EmployeeHistoryModal from "@/components/Dashboard/EmployeeHistoryModal";
import { useLMS } from "@/context/LMSContext";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
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
    router.push("/dashboard");
  };

  const handleReject = () => {
    if (hasProcessed) {
      editApproval(request.id, currentUser.id, "Rejected", remarks);
    } else {
      rejectLeave(request.id, currentUser.id, remarks);
    }
    router.push("/dashboard");
  };

  const handleSkip = () => {
    skipLeave(request.id, currentUser.id);
    router.push("/dashboard");
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

      const event: any = {
        title: `${displayStatus} by ${actor?.name}`,
        date: step.date,
        status: step.status, // Keep original status for color logic
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
      let nextApproverId = request.currentApproverId;

      // Safety break to prevent infinite loops in circular hierarchy
      let depth = 0;
      const maxDepth = 10;

      while (nextApproverId && depth < maxDepth) {
        const approver = users.find((u) => u.id === nextApproverId);
        if (!approver) break;

        events.push({
          title: depth === 0 ? "Currently Pending" : "Up Next",
          status: depth === 0 ? "Pending" : "Upcoming",
          actor: approver.name,
          role: approver.designation,
        });

        nextApproverId = approver.approver;
        depth++;
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
        return "bg-green-100 text-green-700 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "Pending":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Skipped":
      case "Recommended":
      case "Not Recommended":
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
        return "bg-green-500";
      case "Rejected":
        return "bg-red-500";
      case "Skipped":
        return "bg-gray-400";
      case "Recommended":
        return "bg-teal-500";
      case "Not Recommended":
        return "bg-orange-500";
      case "Pending":
        return "bg-orange-500 animate-pulse";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 text-sm text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {request.nature || request.type} Leave Request
            </h1>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(
                request.status
              )}`}
            >
              {request.status}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Request ID:{" "}
            <span className="font-mono text-gray-400">#{request.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Stats (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Request Details
              </h2>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {requester?.name.charAt(0)}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">
                    {requester?.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {requester?.designation}
                  </p>
                </div>
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
                  {request.daysCalculated}{" "}
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
                        value={request.unpaidLeaveDays || 0}
                        onChange={(e) =>
                          updateUnpaidLeaveDays(
                            request.id,
                            Number(e.target.value)
                          )
                        }
                        className="w-24 text-center px-3 py-2 border border-gray-200 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-gray-300"
                      />
                      <span className="text-gray-400 font-medium">
                        / {request.daysCalculated}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(!isReadOnly || hasProcessed) && (
              <div className="p-5 bg-gray-50 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {hasProcessed && isReadOnly ? "My Remarks" : "Remarks (Optional)"}
                </label>
                <textarea
                  value={hasProcessed && isReadOnly ? hasProcessed.remarks || "" : remarks}
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
                          className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${hasProcessed.status === "Approved"
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
                          className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${hasProcessed.status === "Rejected" ||
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline (1/3) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Employee Balance Stats (Moved Here) */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-lg text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5"></div>
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <h3 className="text-indigo-200 font-medium uppercase tracking-wider text-sm mb-1">
                  Leave Balance
                </h3>
                <div className="text-4xl font-bold">
                  {request.type === "Short"
                    ? (requesterBalance?.totalHours || 0) -
                    (requesterBalance?.usedHours || 0)
                    : (requesterBalance?.totalDays || 0) -
                    (requesterBalance?.usedDays || 0)}{" "}
                  <span className="text-lg text-indigo-300 font-normal">
                    Remaining
                  </span>
                </div>
                <p className="text-indigo-200 text-sm mt-2 opacity-80">
                  Total Quota:{" "}
                  {request.type === "Short"
                    ? requesterBalance?.totalHours + " Hours"
                    : requesterBalance?.totalDays + " Days"}{" "}
                  • Used:{" "}
                  {request.type === "Short"
                    ? requesterBalance?.usedHours + " Hours"
                    : requesterBalance?.usedDays + " Days"}
                </p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
              >
                View History
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Request Timeline
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-0 relative">
                {/* Vertical Line Line */}
                <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-100"></div>

                {timelineEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="relative pl-10 pb-8 last:pb-0 group"
                  >
                    {/* Node Dot */}
                    <div
                      className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${getTimelineIconColor(
                        event.status
                      )}`}
                    ></div>

                    {/* Card Content */}
                    <div className="transition-all hover:translate-x-1">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">
                        {event.date
                          ? formatDate(event.date)
                          : "Expected"}
                      </p>
                      <h4 className="text-sm font-bold text-gray-900">
                        {event.title}
                      </h4>
                      {event.actor && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {event.role || "System"}
                        </p>
                      )}
                      {event.remarks && (
                        <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600 italic border-l-2 border-gray-200">
                          &quot;{event.remarks}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
