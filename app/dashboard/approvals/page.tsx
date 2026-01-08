"use client";

import { useLMS } from "@/context/LMSContext";
import { formatDate, formatDuration } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ApprovalsPage() {
  const { currentUser, getPendingApprovals, getApprovalHistory, users } =
    useLMS();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab =
    (searchParams.get("tab") as "Pending" | "History") || "Pending";

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!currentUser) return null;

  // Helper: Get user name
  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || "Unknown User";

  // Data Source
  let data = [];
  if (activeTab === "Pending") {
    data = getPendingApprovals(currentUser.id);
  } else {
    data = getApprovalHistory(currentUser.id).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Pagination Logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = data.slice(startIndex, startIndex + itemsPerPage);

  const handleTabChange = (tab: "Pending" | "History") => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
    setCurrentPage(1);
  };

  return (
    <div>


      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button
          onClick={() => handleTabChange("Pending")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "Pending"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
            }`}
        >
          Pending Requests
          {activeTab !== "Pending" && (
            <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
              {getPendingApprovals(currentUser.id).length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange("History")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "History"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
            }`}
        >
          History
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Applicant</th>
                {activeTab === "Pending" && (
                  <th className="px-6 py-3">Last Approver</th>
                )}
                <th className="px-6 py-3">Type</th>
                {activeTab === "Pending" ? (
                  <>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Dates</th>
                  </>
                ) : (
                  <>
                    <>
                      <th className="px-6 py-3">Duration</th>
                      <th className="px-6 py-3">Dates</th>
                      <th className="px-6 py-3">My Decision</th>
                    </>
                  </>
                )}
                <th className="px-6 py-3">
                  {activeTab === "Pending" ? "Action" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No {activeTab.toLowerCase()} requests found.
                  </td>
                </tr>
              ) : (
                currentItems.map((request) => {
                  if (activeTab === "Pending") {
                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {getUserName(request.userId)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
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
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/requests/${request.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs border border-indigo-200 px-3 py-1.5 rounded transition-colors"
                          >
                            Review Request
                          </Link>
                        </td>
                      </tr>
                    );
                  } else {
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
                        <td className="px-6 py-4">
                          {formatDuration(request.daysCalculated)}{" "}
                          {request.type === "Short" ? "Hrs" : "Days"}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {formatDate(request.startDate)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span
                              className={`font-medium ${myAction?.status === "Approved" || myAction?.status === "Recommended"
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
                          <Link
                            href={`/dashboard/requests/${request.id}?readOnly=true`}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs border border-indigo-200 px-3 py-1.5 rounded transition-colors"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                })
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
