"use client";

import { useLMS } from "@/context/LMSContext";
import { LeaveRequest } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/utils";
import { Calendar, Check, Eye, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ActionModal from "./ActionModal";
import LeaveCalendarModal from "./LeaveCalendarModal";

interface ApprovalsListProps {
  limit?: number;
  showHighlight?: boolean;
  showViewAll?: boolean;
  enablePagination?: boolean;
}

export default function ApprovalsList({
  limit,
  showHighlight = false,
  showViewAll = false,
  enablePagination = false,
}: ApprovalsListProps) {
  const { currentUser, getPendingApprovals, getApprovalHistory, users, approveLeave, rejectLeave } =
    useLMS();
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarData, setCalendarData] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "approve" | "reject";
    request: LeaveRequest | null;
  }>({
    isOpen: false,
    type: "approve",
    request: null,
  });

  // Filters State
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const itemsPerPage = 10;

  if (!currentUser) return null;

  // Helper: Get user name
  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || "Unknown User";

  // Data Fetching & Merging
  const pendingRequests = getPendingApprovals(currentUser.id);
  const historyRequests = getApprovalHistory(currentUser.id);
  
  // If limit is set (Dashboard), we likely only focus on Pending.
  // If no limit (Full Page), we show everything.
  // However, user asked to unify. Let's assume on Dashboard we still just want "Action Items".
  // On Full Page, we want Unified Table.
  
  let baseData = pendingRequests;
  if (!limit) {
      // Merge unique
      const map = new Map();
      pendingRequests.forEach(r => map.set(r.id, r));
      historyRequests.forEach(r => map.set(r.id, r));
      baseData = Array.from(map.values());
      
      // Sort by date desc
      baseData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Filtering
  const filteredData = baseData.filter(request => {
      // Status
      if (filterStatus !== "All") {
          // logic: "Pending" matches direct status. "Approved"/"Rejected" matches final status.
          // But wait, "Pending" in this list might be "Approved by me, but Pending final". 
          // If I approved it, it is in history. Its status might be "Pending" (waiting for next).
          // If I want to see "My Actions", I might want to filter by "My Decision" vs "Request Status".
          // User said "Status". Usually Request Status.
          if (request.status !== filterStatus) return false;
      }
      
      // Type
      if (filterType !== "All") {
          if (request.type !== filterType) return false;
      }
      
      // Employee
      if (filterEmployee) {
          const name = getUserName(request.userId).toLowerCase();
          if (!name.includes(filterEmployee.toLowerCase())) return false;
      }
      
      // Date (Check if Start or End date overlaps or matches?)
      // Simplest: Check if date is within [StartDate, EndDate]
      if (filterDate) {
          const target = new Date(filterDate);
          const start = new Date(request.startDate);
          const end = new Date(request.endDate);
          // Ignore time for comparison?
          target.setHours(0,0,0,0);
          const s = new Date(start); s.setHours(0,0,0,0);
          const e = new Date(end); e.setHours(0,0,0,0);
          
          if (target < s || target > e) return false;
      }
      
      return true;
  });

  // Pagination Logic
  let displayData = filteredData;
  let totalPages = 1;

  if (limit) {
    displayData = filteredData.slice(0, limit);
  } else if (enablePagination) {
    totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    displayData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  }

  // Removed early return to show empty state

  return (
    <div className="mb-0">
      {/* HEADER SECTION - Conditional generic header for Dashboard usage */}
      {/* FILTER / HEADER SECTION */}
      {limit ? (
          // Dashboard Header
          showHighlight && (
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-gray-900">
                  Pending Approvals
                </h3>
                {displayData.length > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                      Action Required
                    </span>
                )}
              </div>
              {/* Only show View All if we have data or always? Probably always for history access? */}
              {showViewAll && (
                <Link
                  href="/leave/approvals"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View All
                </Link>
              )}
            </div>
          )
      ) : (
          // Full Page Filter Bar
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Employee Search */}
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Employee</label>
                      <input 
                        type="text" 
                        placeholder="Search by name..." 
                        value={filterEmployee}
                        onChange={(e) => setFilterEmployee(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
                  
                  {/* Status */}
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                      </select>
                  </div>

                  {/* Type */}
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Type</label>
                      <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                          <option value="All">All Types</option>
                          <option value="Sick">Sick</option>
                          <option value="Casual">Casual</option>
                          <option value="Earned">Earned</option>
                          <option value="Short">Short</option>
                          <option value="LWP">LWP</option>
                      </select>
                  </div>

                  {/* Date */}
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Date</label>
                      <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
              </div>
          </div>
      )}

      {/* TABLE CARD */}
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${
          showHighlight ? "border-l-4 border-l-indigo-500" : ""
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead
              className={`font-medium ${
                showHighlight
                  ? "bg-indigo-50 text-indigo-900"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              <tr>
                <th className="px-6 py-3">Applicant</th>
                <th className="px-6 py-3">Last Approver</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">From</th>
                <th className="px-6 py-3">To</th>
                <th className="px-6 py-3">Actions</th>
                <th className="px-6 py-3 text-center">Calendar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayData.length === 0 ? (
                <tr>
                  <td
                    colSpan={9} // Adjusted colspan to match header columns (Applicant, Last Approver, Type, Status, Duration, From, To, Actions, Calendar = 9)
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    {limit ? "No pending approvals." : "No requests found matching your filters."}
                  </td>
                </tr>
              ) : (
                displayData.map((request) => {
                  // Check if this request is actionable by the current user (exists in pendingRequests)
                  const canAct = pendingRequests.some(p => p.id === request.id);
                  const applicant = users.find(u => u.id === request.userId);

                  return (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{applicant?.name || "Unknown User"}</div>
                        <div className="text-xs text-gray-500">{applicant?.designation || "N/A"}</div>
                        
                        {request.currentApproverId &&
                          request.currentApproverId !== currentUser.id && canAct && (
                            <span className="block text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit mt-1">
                              Via {getUserName(request.currentApproverId)}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium text-xs">
                      {request.approvalChain.length > 0
                        ? getUserName(
                            request.approvalChain[
                              request.approvalChain.length - 1
                            ].approverId
                          )
                        : "Direct"}
                    </td>
                    <td className="px-6 py-4">{request.type}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            request.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            request.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {request.status}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatDuration(request.daysCalculated)}{" "}
                      {request.type === "Short" ? "Hrs" : "Days"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(request.startDate)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(request.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/leave/requests/${request.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </Link>
                        {canAct && (
                            <>
                                <button
                                  onClick={() => {
                                    setActionModal({
                                      isOpen: true,
                                      type: "approve",
                                      request: request,
                                    });
                                  }}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                  title="Quick Approve"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setActionModal({
                                      isOpen: true,
                                      type: "reject",
                                      request: request,
                                    });
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                  title="Quick Reject"
                                >
                                  <X size={18} />
                                </button>
                            </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          setCalendarData({
                            start: request.startDate,
                            end: request.endDate,
                          })
                        }
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        title="View in Calendar"
                      >
                        <Calendar size={18} />
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION (Only if enabled and needed) */}
        {enablePagination && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {calendarData && (
        <LeaveCalendarModal
          isOpen={!!calendarData}
          onClose={() => setCalendarData(null)}
          startDate={calendarData.start}
          endDate={calendarData.end}
        />
      )}

      {/* Action Modal */}
      {actionModal.isOpen && actionModal.request && (
        <ActionModal
          isOpen={actionModal.isOpen}
          onClose={() => setActionModal({ ...actionModal, isOpen: false })}
          title={
            actionModal.type === "approve"
              ? "Approve Request"
              : "Reject Request"
          }
          message={
            actionModal.type === "approve"
              ? `Are you sure you want to approve the leave request for ${getUserName(
                  actionModal.request.userId
                )}?`
              : `Are you sure you want to reject the leave request for ${getUserName(
                  actionModal.request.userId
                )}?`
          }
          type={actionModal.type === "approve" ? "success" : "danger"}
          confirmLabel={
            actionModal.type === "approve" ? "Approve" : "Reject Request"
          }
          inputRequired={false} // NOW OPTIONAL FOR BOTH
          showInput={true} // ALWAYS SHOW INPUT
          inputPlaceholder={
            actionModal.type === "approve"
              ? "Enter remarks (optional)..."
              : "Enter reason for rejection (optional)..."
          }
          onConfirm={(remarks) => {
            if (actionModal.request) {
              if (actionModal.type === "approve") {
                approveLeave(
                  actionModal.request.userId,
                  actionModal.request.id,
                  currentUser.id,
                  remarks
                );
              } else {
                rejectLeave(actionModal.request.id, currentUser.id, remarks);
              }
            }
          }}
        />
      )}
    </div>
  );
}
