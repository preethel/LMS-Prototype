"use client";

import ApplicationsList from "@/components/Dashboard/ApplicationsList";
// Removed ApplyLeaveModal import
import ApprovalsList from "@/components/Dashboard/ApprovalsList";
import StatCard from "@/components/Dashboard/StatCard";
import { useLMS } from "@/context/LMSContext";
import { formatDuration } from "@/lib/utils";
// Removed useState

export default function Dashboard() {
  const {
    currentUser,
    balances,
    getPendingApprovals,
  } = useLMS();

  if (!currentUser) return null;

  // Personal Data
  const myBalance = balances.find((b) => b.userId === currentUser.id);
  // Approver Data
  const pendingApprovals = getPendingApprovals(currentUser.id).slice(0, 5);

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
        <StatCard
          title="Total Quota"
          value={myBalance ? `${myBalance.totalDays} Days` : "0"}
          subtext="Annual Allocation"
        />
        <StatCard
          title="Remaining"
          value={
            myBalance
              ? (() => {
                  const totalQuotaHours = myBalance.totalDays * 8;
                  const usedHoursTotal =
                    (myBalance.usedDays || 0) * 8 + (myBalance.usedHours || 0);
                  const remainingHours = totalQuotaHours - usedHoursTotal;

                  const rDays = Math.floor(remainingHours / 8);
                  const rHrs = remainingHours % 8;

                  return rHrs > 0
                    ? `${formatDuration(rDays)} Days ${formatDuration(
                        rHrs
                      )} Hrs`
                    : `${formatDuration(rDays)} Days`;
                })()
              : "0"
          }
          subtext="Available Balance"
        />
        <StatCard
          title="Used"
          value={
            myBalance
              ? (() => {
                  const usedDays = myBalance.usedDays || 0;
                  const usedHrs = myBalance.usedHours || 0;
                  return usedHrs > 0
                    ? `${formatDuration(usedDays)} Days ${formatDuration(
                        usedHrs
                      )} Hrs`
                    : `${formatDuration(usedDays)} Days`;
                })()
              : "0"
          }
          subtext="Consumed to Date"
        />
      </div>

      {/* APPROVALS SECTION */}
      
      <div className="mb-8">
        <ApprovalsList limit={5} showHighlight={true} showViewAll={true} />
      </div>

      {/* MY APPLICATIONS */}
      <ApplicationsList limit={5} showViewAll={true} />
    </div>
  );
}
