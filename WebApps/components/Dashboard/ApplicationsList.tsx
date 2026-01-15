"use client";

import { useLMS } from "@/context/LMSContext";
import { LeaveRequest } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/utils";
import { Calendar, Eye, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ActionModal from "./ActionModal";
import LeaveCalendarModal from "./LeaveCalendarModal";

interface ApplicationsListProps {
  limit?: number;
  showViewAll?: boolean;
  enablePagination?: boolean;
  customData?: LeaveRequest[];
}

export default function ApplicationsList({
  limit,
  showViewAll = false,
  enablePagination = false,
  customData,
}: ApplicationsListProps) {
  const { currentUser, leaves, cancelLeave } = useLMS();
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarData, setCalendarData] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [leaveToCancel, setLeaveToCancel] = useState<string | null>(null);
  const itemsPerPage = 10;

  if (!currentUser) return null;

  // Data Source Logic
  let displayData: LeaveRequest[] = [];

  if (customData) {
    displayData = customData;
  } else {
    // Default fetch: My leaves, sorted by date desc
    displayData = leaves
      .filter((l) => l.userId === currentUser.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  // Pagination / Limiting Logic
  let paginatedData = displayData;
  let totalPages = 1;

  if (limit) {
    paginatedData = displayData.slice(0, limit);
  } else if (enablePagination) {
    totalPages = Math.ceil(displayData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    paginatedData = displayData.slice(startIndex, startIndex + itemsPerPage);
  }

  // Helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Removed the 'return null' block to ensure empty state is displayed as requested.

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* HEADER */}
      {(showViewAll || limit) && (
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">My Applications</h3>
          {showViewAll && (
            <Link
              href="/leave/my-applications"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              View All
            </Link>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">From</th>
              <th className="px-6 py-3">To</th>
              <th className="px-6 py-3">Result</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3 text-center">Calendar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  No applications found.
                </td>
              </tr>
            ) : (
              paginatedData.map((leave) => (
                <tr
                  key={leave.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {leave.type}
                    {leave.nature && (
                      <span className="block text-xs text-gray-500">
                        {leave.nature}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(leave.startDate)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(leave.endDate)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDuration(leave.daysCalculated)}{" "}
                    {leave.type === "Short" ? "Hrs" : "Days"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        leave.status
                      )}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Link
                      href={`/leave/requests/${leave.id}?readOnly=true`}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </Link>
                    {["Pending", "Approved"].includes(leave.status) && (
                      <button
                        onClick={() => setLeaveToCancel(leave.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Cancel Application"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() =>
                        setCalendarData({
                          start: leave.startDate,
                          end: leave.endDate,
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

      {/* Pagination */}
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

      {calendarData && (
        <LeaveCalendarModal
          isOpen={!!calendarData}
          onClose={() => setCalendarData(null)}
          startDate={calendarData.start}
          endDate={calendarData.end}
        />
      )}

      <ActionModal
        isOpen={!!leaveToCancel}
        onClose={() => setLeaveToCancel(null)}
        title="Cancel Application"
        message="Are you sure you want to cancel this application?"
        type="danger"
        confirmLabel="Yes, Cancel"
        onConfirm={() => {
          if (leaveToCancel) {
            cancelLeave(leaveToCancel);
            setLeaveToCancel(null);
          }
        }}
      />
    </div>
  );
}
