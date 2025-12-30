"use client";

import StatCard from "@/components/Dashboard/StatCard";
import { useLMS } from "@/context/LMSContext";
import Link from "next/link";

export default function Dashboard() {
  const {
    currentUser,
    balances,
    leaves,
    cancelLeave,
    getPendingApprovals,
    getApprovalHistory,
    users,
  } = useLMS();

  if (!currentUser) return null;

  // Personal Data
  const myBalance = balances.find((b) => b.userId === currentUser.id);
  const myLeaves = leaves
    .filter((l) => l.userId === currentUser.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // Approver Data
  const pendingApprovals = getPendingApprovals(currentUser.id);

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

  // Approval History Data
  const approvalHistory = getApprovalHistory(currentUser.id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {currentUser.name}</p>
        </div>
        <Link
          href="/dashboard/apply"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + New Leave Application
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Annual Quota"
          value={myBalance?.totalDays || 0}
          subtext="Days / Year"
        />
        <StatCard
          title="Remaining"
          value={myBalance ? myBalance.totalDays - myBalance.usedDays : 0}
          subtext="Days Available"
        />
        <StatCard
          title="Used"
          value={myBalance?.usedDays || 0}
          subtext="Days Taken"
        />
      </div>

      {/* APPROVALS SECTION (Only if there are pending requests) */}
      {pendingApprovals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Pending Approvals
            </h3>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
              Action Required
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden border-l-4 border-l-indigo-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-indigo-50 text-indigo-900 font-medium">
                  <tr>
                    <th className="px-6 py-3">Applicant</th>
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
                      <td className="px-6 py-4">{request.type}</td>
                      <td className="px-6 py-4">
                        {request.daysCalculated}{" "}
                        {request.type === "Short" ? "Hrs" : "Days"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {request.startDate}
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

      {/* APPROVAL HISTORY */}
      {approvalHistory.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              My Approval History
            </h3>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Applicant</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">My Decision</th>
                    <th className="px-6 py-3">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approvalHistory.map((request) => {
                    const myAction = request.approvalChain.find(
                      (chain) => chain.approverId === currentUser.id
                    );
                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {getUserName(request.userId)}
                        </td>
                        <td className="px-6 py-4">{request.type}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(myAction?.date || "").toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span
                              className={`font-medium ${
                                myAction?.status === "Approved"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {myAction?.status}
                            </span>
                            {myAction?.remarks && (
                              <span className="text-xs text-gray-400 italic">
                                &quot;{myAction.remarks}&quot;
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MY APPLICATIONS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">My Applications</h3>
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
                        ? leave.startDate
                        : `${leave.startDate} - ${leave.endDate}`}
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
                      {["Pending", "Approved"].includes(leave.status) && (
                        <button
                          onClick={() => cancelLeave(leave.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors"
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
    </div>
  );
}
