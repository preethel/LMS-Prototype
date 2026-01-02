"use client";

import EmployeeHistoryModal from "@/components/Dashboard/EmployeeHistoryModal";
import { useLMS } from "@/context/LMSContext";
import { useRouter } from "next/navigation";
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
  } = useLMS();
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { id } = use(params);
  const request = leaves.find((l) => l.id === id);

  if (!request || !currentUser)
    return <div className="p-8">Request not found</div>;

  const requester = users.find((u) => u.id === request.userId);
  const requesterBalance = balances.find((b) => b.userId === request.userId);

  const hasProcessed = request.approvalChain.find(
    (s) => s.approverId === currentUser.id
  );

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

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-gray-500 hover:text-gray-900 flex items-center"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Leave Request
              </h1>
              <p className="text-gray-500 mt-1">
                Submitted by {requester?.name}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                request.type === "Regular"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {request.type === "Regular" && request.nature
                ? `${request.type} - ${request.nature}`
                : request.type}{" "}
              Leave
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Start Date</span>
                  <span className="font-medium text-gray-900">
                    {request.startDate}
                  </span>
                </div>
                {request.type === "Regular" && (
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">End Date</span>
                    <span className="font-medium text-gray-900">
                      {request.endDate}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-bold text-indigo-600">
                    {request.daysCalculated}{" "}
                    {request.type === "Short" ? "Hours" : "Days"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Reason
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-500 border border-gray-200">
                {request.reason}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Employee Stats
                </h3>
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  View History
                </button>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-indigo-800">Total Quota</span>
                  <span className="font-bold text-indigo-900">
                    {requesterBalance?.totalDays} Days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-800">Used So Far</span>
                  <span className="font-bold text-indigo-900">
                    {requesterBalance?.usedDays} Days
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-200 flex justify-between items-center">
                  <span className="text-indigo-800 text-xs uppercase font-bold">
                    Remaining
                  </span>
                  <span className="font-bold text-xl text-indigo-700">
                    {(requesterBalance?.totalDays || 0) -
                      (requesterBalance?.usedDays || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Approval Hierarchy
              </h3>
              <div className="space-y-4">
                {/* Application Event */}
                <div className="flex items-start text-xs text-gray-500">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 mr-3 flex-shrink-0"></div>
                  <div>
                    <span className="font-semibold text-gray-700 block text-sm">
                      Applied by {requester?.name}
                    </span>
                    <span>
                      {new Date(request.createdAt).toLocaleDateString()} at{" "}
                      {new Date(request.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Approval Steps */}
                {request.approvalChain.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start text-xs text-gray-500"
                  >
                    <div
                      className={`h-2 w-2 rounded-full mt-1.5 mr-3 flex-shrink-0 ${
                        step.status === "Approved"
                          ? "bg-green-500"
                          : step.status === "Rejected"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <div>
                      <span className="font-semibold text-gray-700 block text-sm">
                        {step.status} by{" "}
                        {users.find((u) => u.id === step.approverId)?.name}
                      </span>
                      <span>
                        {new Date(step.date).toLocaleDateString()} at{" "}
                        {new Date(step.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {step.remarks && (
                        <p className="mt-1 italic text-gray-400">
                          &quot;{step.remarks}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks (Optional)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add a note for the applicant..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            rows={2}
          />
        </div>

        <div className="p-8 pt-0 flex space-x-4">
          {/* LOGIC: Check if already processed by current user */}
          {hasProcessed ? (
            <div className="w-full">
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center">
                <span className="text-gray-700 font-medium">
                  You have{" "}
                  <span className="font-bold">{hasProcessed.status}</span> this
                  request.
                </span>
              </div>
              <div className="flex space-x-4">
                {/* Logic: Allow switching to Approved or Rejected regardless of whether it was Skipped */}
                <button
                  onClick={handleApprove}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg transform hover:-translate-y-0.5 ${
                    hasProcessed.status === "Approved"
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed" // Already Approved
                      : "bg-green-600 text-white hover:bg-green-700 shadow-green-200"
                  }`}
                  disabled={hasProcessed.status === "Approved"}
                >
                  Change to Approved
                </button>
                <button
                  onClick={handleReject}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg transform hover:-translate-y-0.5 ${
                    hasProcessed.status === "Rejected"
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-red-600 border border-red-200 hover:bg-red-50"
                  }`}
                  disabled={hasProcessed.status === "Rejected"}
                >
                  Change to Rejected
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleApprove}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 transform hover:-translate-y-0.5"
              >
                Approve Request
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-white text-red-600 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-50 transition-all"
              >
                Reject
              </button>
              <button
                onClick={handleSkip}
                className="px-6 py-3 text-gray-500 border border-indigo-200 font-medium hover:text-gray-700 hover:bg-indigo-100 rounded-xl transition-all"
              >
                Forward
              </button>
            </>
          )}
        </div>
      </div>

      <EmployeeHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        userId={request.userId}
        employeeName={requester?.name || "Employee"}
      />
    </div>
  );
}
