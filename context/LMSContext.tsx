"use client";

import { MOCK_BALANCES, MOCK_LEAVES, MOCK_USERS } from "@/lib/mockData";
import {
  Attachment,
  LeaveBalance,
  LeaveNature,
  LeaveRequest,
  LeaveType,
  User,
} from "@/lib/types";
import { ReactNode, createContext, useContext, useState } from "react";

interface LMSContextType {
  currentUser: User | null;
  users: User[];
  leaves: LeaveRequest[];
  balances: LeaveBalance[];
  login: (userId: string) => void;
  logout: () => void;
  applyLeave: (
    userId: string,
    type: LeaveType,
    start: string,
    end: string,
    reason: string,
    nature?: LeaveNature,
    isShort?: boolean,
    timeRange?: { start: string; end: string },
    attachments?: Attachment[]
  ) => void;
  approveLeave: (
    submiitedByUserId: string,
    leaveId: string,
    ApproverId: string,
    remarks?: string
  ) => void;
  rejectLeave: (leaveId: string, approverId: string, remarks?: string) => void;
  cancelLeave: (leaveId: string) => void;
  getPendingApprovals: (approverId: string) => LeaveRequest[];
  getApprovalHistory: (approverId: string) => LeaveRequest[];
  skipLeave: (leaveId: string, approverId: string) => void;
  editApproval: (
    leaveId: string,
    approverId: string,
    newStatus: "Approved" | "Rejected" | "Skipped",
    newRemarks: string
  ) => void;
  updateUnpaidLeaveDays: (leaveId: string, days: number) => void;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

export const LMSProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users] = useState<User[]>(MOCK_USERS);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(MOCK_LEAVES);
  const [balances, setBalances] = useState<LeaveBalance[]>(MOCK_BALANCES);

  const login = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const logout = () => setCurrentUser(null);

  const applyLeave = (
    userId: string,
    type: LeaveType,
    start: string,
    end: string,

    reason: string,
    nature?: LeaveNature,
    isShort?: boolean,
    timeRange?: { start: string; end: string },
    attachments?: Attachment[]
  ) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    // Calculate days
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    // +1 because if start=10th, end=10th, it is 1 day.

    // Logic for Short Leave (Mock: 0 days, just hours, but for simplicity let's track hours separately if needed)
    // Requirement: "Short Leave is always calculated in hours"
    // Requirement: "1 day = 8 hours"

    // Calculate duration
    let quantity = 0;
    if (type === "Short" && timeRange) {
      const [startH, startM] = timeRange.start.split(":").map(Number);
      const [endH, endM] = timeRange.end.split(":").map(Number);
      quantity = endH - startH + (endM - startM) / 60; // Hours
    } else {
      quantity = days; // Days
    }

    // Immediate Balance Deduction
    setBalances((prevBal) =>
      prevBal.map((b) => {
        if (b.userId === userId) {
          if (type === "Short") {
            return { ...b, usedHours: (b.usedHours || 0) + quantity };
          } else {
            return { ...b, usedDays: (b.usedDays || 0) + quantity };
          }
        }
        return b;
      })
    );

    const newLeave: LeaveRequest = {
      id: `l${Date.now()}`,
      userId,
      type,
      nature,
      startDate: start,
      endDate: end,
      reason,
      status: "Pending",
      currentApproverId: user.approver, // First stop: Direct Approver
      approvalChain: [],
      createdAt: new Date().toISOString(),
      daysCalculated: quantity,
      unpaidLeaveDays: 0,
      startTime: timeRange?.start,
      endTime: timeRange?.end,
      attachments: attachments || [],
    };

    setLeaves((prev) => [newLeave, ...prev]);
  };

  const approveLeave = (
    submittedUserId: string,
    leaveId: string,
    approverId: string,
    remarks?: string
  ) => {
    setLeaves((prev) =>
      prev.map((leave) => {
        if (leave.id !== leaveId) return leave;

        // Add to chain
        const newChain = [
          ...leave.approvalChain,
          {
            approverId,
            status: "Approved" as const,
            date: new Date().toISOString(),
            remarks,
          },
        ];

        // Recursive Logic: Check if *this* approver has an approver
        const currentApproverUser = users.find((u) => u.id === approverId);
        const nextApproverId = currentApproverUser?.approver;

        if (nextApproverId) {
          // Move up
          return {
            ...leave,
            approvalChain: newChain,
            currentApproverId: nextApproverId,
          };
        } else {
          // Final Approval
          // Balance was already deducted at application time.

          return {
            ...leave,
            approvalChain: newChain,
            currentApproverId: undefined,
            status: "Approved",
          };
        }
      })
    );
  };

  const rejectLeave = (
    leaveId: string,
    approverId: string,
    remarks?: string
  ) => {
    // Restore Balance
    const leave = leaves.find((l) => l.id === leaveId);
    if (leave) {
      setBalances((prevBal) =>
        prevBal.map((b) => {
          if (b.userId === leave.userId) {
            if (leave.type === "Short") {
              return {
                ...b,
                usedHours: Math.max(
                  0,
                  (b.usedHours || 0) - leave.daysCalculated
                ),
              };
            } else {
              return {
                ...b,
                usedDays: Math.max(0, (b.usedDays || 0) - leave.daysCalculated),
              };
            }
          }
          return b;
        })
      );
    }
    setLeaves((prev) =>
      prev.map((leave) => {
        if (leave.id !== leaveId) return leave;
        return {
          ...leave,
          status: "Rejected",
          currentApproverId: undefined,
          approvalChain: [
            ...leave.approvalChain,
            {
              approverId,
              status: "Rejected" as const,
              date: new Date().toISOString(),
              remarks,
            },
          ],
        };
      })
    );
  };

  const cancelLeave = (leaveId: string) => {
    // Restore balance
    const leave = leaves.find((l) => l.id === leaveId);
    if (leave) {
      setBalances((prevBal) =>
        prevBal.map((b) => {
          if (b.userId === leave.userId) {
            if (leave.type === "Short") {
              return {
                ...b,
                usedHours: Math.max(
                  0,
                  (b.usedHours || 0) - leave.daysCalculated
                ),
              };
            } else {
              return {
                ...b,
                usedDays: Math.max(0, (b.usedDays || 0) - leave.daysCalculated),
              };
            }
          }
          return b;
        })
      );
    }

    // Update status
    setLeaves((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: "Cancelled" } : l))
    );
  };

  const getPendingApprovals = (approverId: string) => {
    return leaves.filter(
      (l) => l.status === "Pending" && l.currentApproverId === approverId
    );
  };

  const skipLeave = (leaveId: string, approverId: string) => {
    setLeaves((prev) =>
      prev.map((leave) => {
        if (leave.id !== leaveId) return leave;

        const currentApproverUser = users.find((u) => u.id === approverId);
        const nextApproverId = currentApproverUser?.approver;

        if (!nextApproverId) {
          // No next approver to skip to.
          // In real app, this might escalate or fail.
          // For now, treat as "Reviewed but Passed" -> maybe stays Pending or auto-approves?
          // "skip ekta action, mane ekjon skip korle next hairerchy er kache jabe"
          // If last person skips, it's stuck. Let's just create an entry but keep currentApprover undefined?
          // Or maybe it stays with same person?
          // Let's assume hierarchy always has next unless Director. If Director skips, maybe it's Approved?
          // Let's just do nothing if no next.
          return leave;
        }

        return {
          ...leave,
          currentApproverId: nextApproverId,
          approvalChain: [
            ...leave.approvalChain,
            {
              approverId,
              status: "Skipped" as const, // We need to add "Skipped" to type if not there, for now cast as any or string if type is strict
              date: new Date().toISOString(),
              remarks: "Skipped/Delegated",
            },
          ],
        };
      })
    );
  };

  const getApprovalHistory = (approverId: string) => {
    return leaves.filter((l) =>
      l.approvalChain.some((step) => step.approverId === approverId)
    );
  };

  const editApproval = (
    leaveId: string,
    approverId: string,
    newStatus: "Approved" | "Rejected" | "Skipped",
    newRemarks: string
  ) => {
    // 1. Find Leave
    const leave = leaves.find((l) => l.id === leaveId);
    if (!leave) return;

    // 2. Determine Action
    const previousStep = leave.approvalChain.find(
      (step) => step.approverId === approverId
    );
    if (!previousStep) return;

    const previousStatus = previousStep.status;

    if (previousStatus === newStatus) {
      // Just update remarks
      setLeaves((prev) =>
        prev.map((l) => {
          if (l.id !== leaveId) return l;
          return {
            ...l,
            approvalChain: l.approvalChain.map((step) =>
              step.approverId === approverId
                ? { ...step, remarks: newRemarks }
                : step
            ),
          };
        })
      );
      return;
    }

    // Status Changed logic
    if (newStatus === "Rejected") {
      if (previousStatus === "Approved") {
        // Restore Balance
        setBalances((prevBal) =>
          prevBal.map((b) => {
            if (b.userId === leave.userId) {
              if (leave.type === "Short") {
                return {
                  ...b,
                  usedHours: Math.max(
                    0,
                    (b.usedHours || 0) - leave.daysCalculated
                  ),
                };
              } else {
                return {
                  ...b,
                  usedDays: Math.max(
                    0,
                    (b.usedDays || 0) - leave.daysCalculated
                  ),
                };
              }
            }
            return b;
          })
        );
      }
    } else if (newStatus === "Approved") {
      if (previousStatus === "Rejected") {
        // Deduct Balance
        setBalances((prevBal) =>
          prevBal.map((b) => {
            if (b.userId === leave.userId) {
              if (leave.type === "Short") {
                return {
                  ...b,
                  usedHours: (b.usedHours || 0) + leave.daysCalculated,
                };
              } else {
                return {
                  ...b,
                  usedDays: (b.usedDays || 0) + leave.daysCalculated,
                };
              }
            }
            return b;
          })
        );
      }
    }

    // NOTE: Transitions from "Skipped" do not affect balance (since Skip didn't change balance).
    // Transitions TO "Skipped" (e.g. Approved -> Skipped) would imply restoring balance if it was Approved.
    // Ideally we'd handle all permutations.
    // For "Approved" -> "Skipped": Restore balance.
    if (previousStatus === "Approved" && newStatus === "Skipped") {
      setBalances((prevBal) =>
        prevBal.map((b) => {
          if (b.userId === leave.userId) {
            if (leave.type === "Short") {
              return {
                ...b,
                usedHours: Math.max(
                  0,
                  (b.usedHours || 0) - leave.daysCalculated
                ),
              };
            } else {
              return {
                ...b,
                usedDays: Math.max(0, (b.usedDays || 0) - leave.daysCalculated),
              };
            }
          }
          return b;
        })
      );
    }
    // For "Rejected" -> "Skipped": No balance change (since rejected already restored it).

    setLeaves((prev) =>
      prev.map((l) => {
        if (l.id !== leaveId) return l;

        // If editing a Skipped action, we might need to "pull back" the request if it moved to next approver?
        // User said "approvals gulor action poreu change korte parbe".
        // If I skipped, it went to my boss. If I now "Approve", does it recall from boss?
        // Let's assume for this prototype we just update record. The `currentApproverId` logic is complex to revert.
        // We will just update status. If it was finalized by someone else later, this change interacts with history.
        // Simplified: Just update the status string.

        // However, if we change TO Approved/Rejected, we update the global status ONLY IF this was the final/latest action or drives it?
        // We'll update global status to new decision.

        return {
          ...l,
          status:
            newStatus === "Skipped"
              ? "Pending"
              : newStatus === "Rejected"
              ? "Rejected"
              : "Approved",
          approvalChain: l.approvalChain.map((step) =>
            step.approverId === approverId
              ? {
                  ...step,
                  status: newStatus,
                  remarks: newRemarks,
                  date: new Date().toISOString(),
                }
              : step
          ),
        };
      })
    );
  };

  const updateUnpaidLeaveDays = (leaveId: string, days: number) => {
    setLeaves((prev) =>
      prev.map((l) => {
        if (l.id !== leaveId) return l;
        // Validation: Unpaid days cannot exceed total duration
        const validatedDays = Math.min(Math.max(0, days), l.daysCalculated);
        return { ...l, unpaidLeaveDays: validatedDays };
      })
    );
  };

  return (
    <LMSContext.Provider
      value={{
        currentUser,
        users,
        leaves,
        balances,
        login,
        logout,
        applyLeave,
        approveLeave,
        rejectLeave,
        cancelLeave,
        getPendingApprovals,
        getApprovalHistory,
        editApproval,
        skipLeave,
        updateUnpaidLeaveDays,
      }}
    >
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) throw new Error("useLMS must be used within LMSProvider");
  return context;
};
