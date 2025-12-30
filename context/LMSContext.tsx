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

    // Simplified Balance Deduction Logic
    // const daysToDeduct = days;
    // const hoursToDeduct = 0;

    if (type === "Short") {
      // daysToDeduct = 0;
      // Mock calculation: 2 hours
      // In a real app we'd parse timeRange
      // hoursToDeduct = 2;
    }

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
      daysCalculated: days,
    };

    setLeaves((prev) => [newLeave, ...prev]);

    // Optimistic balance update? No, update on approval usually.
    // Requirement: "Cancel an already approved leave... balance restored" -> implies balance deducts on approval?
    // usually systems deduct 'pending' balance immediately to prevent overbooking.
    // Let's deduct from 'pending' quota.
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
          // Deduct Balance Here (Actually Confirm Deduction)

          // Find user balance and update
          setBalances((prevBal) =>
            prevBal.map((b) => {
              if (b.userId === submittedUserId) {
                return {
                  ...b,
                  usedDays: b.usedDays + leave.daysCalculated, // Simplified
                };
              }
              return b;
            })
          );

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
    // Restore balance if it was approved
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
