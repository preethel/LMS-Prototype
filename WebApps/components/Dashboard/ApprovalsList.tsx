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
  const { currentUser, getPendingApprovals, users, approveLeave, rejectLeave } =
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
  const itemsPerPage = 10;

  if (!currentUser) return null;

  // Helper: Get user name
  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || "Unknown User";

  // Data Fetching
  const allPending = getPendingApprovals(currentUser.id);

  // Logic: either limited list OR paginated list
  let displayData = allPending;
  let totalPages = 1;

  if (limit) {
    displayData = allPending.slice(0, limit);
  } else if (enablePagination) {
    totalPages = Math.ceil(allPending.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    displayData = allPending.slice(startIndex, startIndex + itemsPerPage);
  }

  if (displayData.length === 0) {
    // If it's a dashboard widget (limit is set), hide if empty.
    if (limit) return null;
  }

  return (
    <div className="mb-0">
      {/* HEADER SECTION - Conditional generic header for Dashboard usage */}
      {showHighlight && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold text-gray-900">
              Pending Approvals
            </h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
              Action Required
            </span>
          </div>
          {showViewAll && (
            <Link
              href="/leave/approvals"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              View All
            </Link>
          )}
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
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No pending requests found.
                  </td>
                </tr>
              ) : (
                displayData.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      <div>
                        {getUserName(request.userId)}
                        {request.currentApproverId &&
                          request.currentApproverId !== currentUser.id && (
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
                ))
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
