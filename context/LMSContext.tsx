"use client";

import { MOCK_BALANCES, MOCK_LEAVES, MOCK_USERS } from "@/lib/mockData";
import {
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
    timeRange?: { start: string; end: string }
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
    timeRange?: { start: string; end: string }
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
      startTime: timeRange?.start,
      endTime: timeRange?.end,
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

  const getApprovalHistory = (approverId: string) => {
    return leaves.filter((l) =>
      l.approvalChain.some((step) => step.approverId === approverId)
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
