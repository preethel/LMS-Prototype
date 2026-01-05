"use client";

import { useLMS } from "@/context/LMSContext";
import { formatDuration } from "@/lib/utils";

interface EmployeeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  employeeName: string;
}

export default function EmployeeHistoryModal({
  isOpen,
  onClose,
  userId,
  employeeName,
}: EmployeeHistoryModalProps) {
  const { leaves } = useLMS();

  if (!isOpen) return null;

  // Filter for approved leaves (All time)
  const history = leaves
    .filter((l) => l.userId === userId && l.status === "Approved")
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            {employeeName}&apos;s Leave History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approved leaves found for this year.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 rounded-r-lg">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {leave.type}
                      {leave.nature && (
                        <span className="block text-xs text-gray-500">
                          {leave.nature}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {leave.startDate === leave.endDate
                        ? leave.startDate
                        : `${leave.startDate} to ${leave.endDate
                          .split("-")
                          .slice(1)
                          .join("-")}`}
                    </td>
                    <td className="px-4 py-3 text-indigo-600 font-semibold">
                      {formatDuration(leave.daysCalculated)}{" "}
                      {leave.type === "Short" ? "Hrs" : "Days"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 italic truncate max-w-[200px]">
                      {leave.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
