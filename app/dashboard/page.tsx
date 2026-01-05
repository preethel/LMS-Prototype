"use client";

import ApplyLeaveModal from "@/components/Dashboard/ApplyLeaveModal";
import StatCard from "@/components/Dashboard/StatCard";
import { useLMS } from "@/context/LMSContext";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function Dashboard() {
  const {
    currentUser,
    balances,
    leaves,
    cancelLeave,
    getPendingApprovals,
    users,
  } = useLMS();

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!currentUser) return null;

  // Personal Data
  const myBalance = balances.find((b) => b.userId === currentUser.id);
  const myLeaves = leaves
    .filter((l) => l.userId === currentUser.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // Approver Data
  const pendingApprovals = getPendingApprovals(currentUser.id).slice(0, 5);

  // Helper: Get user name
  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || "Unknown User";

  // Helper to colorize status
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
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {currentUser.name}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + New Leave Application
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Quota"
          value={myBalance ? `${myBalance.totalDays} Days` : "0"}
          subtext="Annual Allocation"
        />
        <StatCard
          title="Remaining"
          value={
            myBalance
              ? `${myBalance.totalDays - myBalance.usedDays} Days ${myBalance.totalHours - (myBalance.usedHours || 0)
              } Hrs`
              : "0"
          }
          subtext="Available Balance"
        />
        <StatCard
          title="Used"
          value={
            myBalance
              ? `${myBalance.usedDays} Days ${myBalance.usedHours || 0} Hrs`
              : "0"
          }
          subtext="Consumed to Date"
        />
      </div>

      {/* APPROVALS SECTION (Only if there are pending requests) */}
      {pendingApprovals.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-bold text-gray-900">
                Pending Approvals
              </h3>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                Action Required
              </span>
            </div>
            <Link
              href="/dashboard/approvals"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              View All
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden border-l-4 border-l-indigo-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-indigo-50 text-indigo-900 font-medium">
                  <tr>
                    <th className="px-6 py-3">Applicant</th>
                    <th className="px-6 py-3">Last Approver</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Dates</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingApprovals.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {getUserName(request.userId)}
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
                        {request.daysCalculated}{" "}
                        {request.type === "Short" ? "Hrs" : "Days"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(request.startDate)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/requests/${request.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs border border-indigo-200 px-3 py-1.5 rounded transition-colors"
                        >
                          Review Request
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL HISTORY - Moved to dedicated page */}

      {/* MY APPLICATIONS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">My Applications</h3>
          <Link
            href="/dashboard/my-applications"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View All
          </Link>
        </div>
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
              {myLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No history found.
                  </td>
                </tr>
              ) : (
                myLeaves.map((leave) => (
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
                    <td className="px-6 py-4">
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
      </div>

      <ApplyLeaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
