"use client";

import { useLMS } from "@/context/LMSContext";
import Link from "next/link";
import { useState } from "react";
import { formatDate } from "@/lib/utils";

export default function MyApplicationsPage() {
  const { currentUser, leaves, cancelLeave } = useLMS();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!currentUser) return null;

  const myLeaves = leaves
    .filter((l) => l.userId === currentUser.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const totalPages = Math.ceil(myLeaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeaves = myLeaves.slice(startIndex, startIndex + itemsPerPage);

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Applications</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Result</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No applications found.
                  </td>
                </tr>
              ) : (
                currentLeaves.map((leave) => (
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
                      {leave.startDate === leave.endDate
                        ? formatDate(leave.startDate)
                        : `${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {leave.daysCalculated}{" "}
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
                    <td className="px-6 py-4 flex items-center space-x-2">
                      <Link
                        href={`/dashboard/requests/${leave.id}?readOnly=true`}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs border border-indigo-200 px-3 py-1.5 rounded transition-colors"
                      >
                        Details
                      </Link>
                      {["Pending", "Approved"].includes(leave.status) && (
                        <button
                          onClick={() => cancelLeave(leave.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors ml-2"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
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
    </div>
  );
}
