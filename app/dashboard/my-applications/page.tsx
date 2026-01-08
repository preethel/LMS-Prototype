"use client";

import { useLMS } from "@/context/LMSContext";
import { formatDate, formatDuration } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function MyApplicationsPage() {
  const { currentUser, leaves, cancelLeave } = useLMS();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter State
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const clearFilters = () => {
    setFilterType("All");
    setFilterStatus("All");
    setStartDate("");
    setEndDate("");
  };

  if (!currentUser) return null;

  // Filter Logic
  const myLeaves = leaves
    .filter((l) => l.userId === currentUser.id)
    .filter((l) => {
      if (filterType !== "All" && l.type !== filterType) return false;
      if (filterStatus !== "All" && l.status !== filterStatus) return false;
      if (startDate && new Date(l.startDate) < new Date(startDate))
        return false;
      if (endDate && new Date(l.endDate) > new Date(endDate)) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // Export Logic
  // Export Logic
  const handleExport = () => {
    console.log("handleExport triggered");
    try {
      const dataToExport = myLeaves.map((l) => ({
        Type: l.type,
        Nature: l.nature || "-",
        "Start Date": l.startDate,
        "End Date": l.endDate,
        Duration: `${l.daysCalculated} ${l.type === "Short" ? "Hrs" : "Days"}`,
        Reason: l.reason,
        Status: l.status,
        "Applied On": new Date(l.createdAt).toLocaleDateString(),
      }));
      console.log("Data to export:", dataToExport);

      if (!XLSX) {
        console.error("XLSX library is not loaded or undefined");
        alert("Export failed: Library not loaded");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "My Applications");
      XLSX.writeFile(
        workbook,
        `My_Applications_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      console.log("Export successful");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Check console for details.");
    }
  };

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
      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Leave Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="Regular">Regular</option>
              <option value="Short">Short</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Start Date (From)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              End Date (To)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {(filterType !== "All" ||
            filterStatus !== "All" ||
            startDate !== "" ||
            endDate !== "") && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors shadow-sm"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <span>📊</span> Export XLS
          </button>
        </div>
      </div>

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
                        : `${formatDate(leave.startDate)} to ${formatDate(
                            leave.endDate
                          )}`}
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
