"use client";

import { MOCK_BALANCES, MOCK_HOLIDAYS, MOCK_LEAVES, MOCK_USERS } from "@/lib/mockData";
import {
    Attachment,
    DelegationHistory,
    LeaveBalance,
    LeaveNature,
    LeaveRequest,
    LeaveType,
    User
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
    attachments?: Attachment[],
    duration?: number
  ) => void;
  approveLeave: (
    submiitedByUserId: string,
    leaveId: string,
    ApproverId: string,
    remarks?: string,
    isFinalDecision?: boolean
  ) => void;
  rejectLeave: (leaveId: string, approverId: string, remarks?: string) => void;
  // setDelegate: (userId: string, delegateId: string | null, start?: string, end?: string) => void; // Deprecated
  addDelegation: (userId: string, delegateId: string, startDate: string, endDate: string) => void;
  cancelDelegation: (userId: string, historyId: string) => void;
  stopDelegation: (userId: string, historyId: string) => void;
  extendDelegation: (userId: string, historyId: string, newEndDate: string) => void;
  updateDelegation: (userId: string, historyId: string, delegateId: string, startDate: string, endDate: string) => void;
  updateUserApprovers: (userId: string, approverIds: string[]) => void;

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
  // Holidays
  holidays: import("@/lib/types").Holiday[];
  addHoliday: (name: string, date: string, type: 'Public' | 'Company' | 'Optional') => void;
  deleteHoliday: (id: string) => void;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

export const LMSProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(MOCK_LEAVES);
  const [balances, setBalances] = useState<LeaveBalance[]>(MOCK_BALANCES);
  const [holidays, setHolidays] = useState<import("@/lib/types").Holiday[]>(MOCK_HOLIDAYS); 
  
  // Use effect or direct init if import allows, but explicit import in useState might be quirky. 
  // Let's use the imported MOCK_HOLIDAYS from line 3 if possible, or re-import properly.
  // Line 3 has: import { MOCK_BALANCES, MOCK_LEAVES, MOCK_USERS } from "@/lib/mockData";
  // I need to add MOCK_HOLIDAYS to that import first? No, I can just use require or fix the top import.
  // Actually, I'll just init with empty and load, OR fix the top import. Best to fix top import.
  // For now, let's just fix the duplicate line and use empty array or hardcoded for safety until I fix imports.
  // Actually, I'll just add MOCK_HOLIDAYS to the top import in a separate step if needed, or dynamically require.
  // Wait, I can just use the fully qualified import if it works, but the error said property does not exist on Promise.
  // Ah, `import(...)` returns a Promise if used as expression? No, `import type` is different.
  // Let's just fix the duplicate `leaves` line first.

  const addHoliday = (name: string, date: string, type: 'Public' | 'Company' | 'Optional') => {
      setHolidays(prev => [...prev, {
          id: `h${Date.now()}`,
          name,
          date,
          type
      }]);
  };

  const deleteHoliday = (id: string) => {
      setHolidays(prev => prev.filter(h => h.id !== id));
  };

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
    attachments?: Attachment[],
    duration?: number
  ) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    // Calculate duration
    let quantity = 0;

    if (duration !== undefined) {
        quantity = duration;
    } else {
        // Fallback Logic (Old behavior)
        // Check if it's a "Regular" leave with Time (indicated by 'T' in ISO string)
        const isRegularWithTime = type === "Regular" && start.includes("T") && end.includes("T");

        if (isRegularWithTime) {
           const startDate = new Date(start);
           const endDate = new Date(end);
           const diffTime = endDate.getTime() - startDate.getTime();
           // Exact Difference in Days (Float) e.g. 0.5 for half day
           const days = diffTime / (1000 * 60 * 60 * 24);
           quantity = Number(days.toFixed(2));
        } else if (type === "Regular") {
             // Standard Day-based inclusive calculation
             const startDate = new Date(start);
             const endDate = new Date(end);
             const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
         // +1 because if start=10th, end=10th, it is 1 day.
         const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
         quantity = days;
    } else if (type === "Short" && timeRange) {
      const [startH, startM] = timeRange.start.split(":").map(Number);
      const [endH, endM] = timeRange.end.split(":").map(Number);
      quantity = endH - startH + (endM - startM) / 60; // Hours
    } else {
       // Fallback logic
       const startDate = new Date(start);
       const endDate = new Date(end);
       const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
       quantity = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    }

    // Immediate Balance Deduction

    // Immediate Balance Deduction Logic
    setBalances((prevBal) =>
      prevBal.map((b) => {
        if (b.userId === userId) {
          if (type === "Short") {
            // New Logic: 
            // 1. Try to deduct from Casual Leave (Hours to Days conversion: 8 hours = 1 day)
            // 2. If not enough Casual, mark as Unpaid (conceptually) or just track as usedHours.
            // User requirement: "casual leave theke deduct hobe. jokhon shesh..., tokhon unpaid"
            
            const hoursAsDays = quantity / 8;
            const remainingCasual = (b.casualQuota || 0) - (b.casualUsed || 0);

            if (remainingCasual >= hoursAsDays) {
                // Deduct from Casual
                return { 
                    ...b, 
                    usedHours: (b.usedHours || 0) + quantity,
                    casualUsed: (b.casualUsed || 0) + hoursAsDays 
                };
            } else {
                // Not enough Casual -> Unpaid
                // Deduct what is possible? Or all Unpaid? 
                // "jokhon shesh hoye jabe" implies if exhausted, THEN unpaid.
                // Simplified: If exhausted, do NOT increment casualUsed, just increment usedHours (and maybe tracking unpaid elsewhere if needed).
                // Or we can simple allow negative/overdraft if that's the system.
                // But usually fallback means use Unpaid Quota (or just track as Unpaid).
                // Let's just track `usedHours` as usual, but we ONLY increment `casualUsed` if we had balance.
                // Wait, if I don't increment casualUsed, the balance remains same.
                // User said "deduct from casual". So I MUST increment casualUsed IF available.
                
                // Let's implement partial? No, simpler: check if fully covered.
                // If not covered, fallback to Unpaid (don't touch Casual).
                // Or deduction until 0?
                // Let's do: Deduct from Casual as much as possible? No, usually "Is Paid?" check.
                // If I have 0.5 Casual days left and request 0.25 days (2 hrs), it deducts.
                // If I have 0 Casual days, it is Unpaid.
                
                // We'll increment casualUsed ONLY if remainingCasual > 0. 
                // Actually, let's keep it simple: If effective balance allows, deduct.
                // If not, it's unpaid (no casual deduction).
                
                if (remainingCasual > 0) {
                     // Even if partial? Let's check if we can cover at least some?
                     // Let's assumes strictly: If you have balance, use it.
                     const toDeduct = Math.min(remainingCasual, hoursAsDays);
                     // If we only deduct partial, the rest is unpaid. 
                     // But `casualUsed` is simple counter.
                     return {
                        ...b,
                        usedHours: (b.usedHours || 0) + quantity,
                        casualUsed: (b.casualUsed || 0) + toDeduct
                     }
                }
                
                // Else, pure Unpaid (only hours tracked for record)
                return { ...b, usedHours: (b.usedHours || 0) + quantity };
            }

          } else {
             // Regular Logic (Nature specific)
             if (nature === 'Casual') return { ...b, casualUsed: (b.casualUsed || 0) + quantity };
             if (nature === 'Sick') return { ...b, sickUsed: (b.sickUsed || 0) + quantity };
             // ... others ...
             return b; // For 'Other'/'Unpaid' we might not deduct from quota, just track.
          }
        }
        return b;
      })
    );

    // Determine nature for the record
    // If it was Short, and we deducted from Casual, effectively nature is "Casual"
    // If we didn't (fallback), it is "Unpaid".
    // We need to mirror the balance logic calculation to set the correct nature in the leave request object.
    let finalNature = nature;
    if (type === "Short") {
        const userBal = balances.find(b => b.userId === userId);
        if (userBal) {
            const hoursAsDays = quantity / 8;
            const remainingCasual = (userBal.casualQuota || 0) - (userBal.casualUsed || 0);
            if (remainingCasual >= hoursAsDays) finalNature = "Casual";
            else finalNature = "Unpaid";
        } else {
            finalNature = "Unpaid"; // Safety
        }
    }

    // Determine Initial Approver
    let initialApproverId: string | undefined;

    if (user.sequentialApprovers && user.sequentialApprovers.length > 0) {
      initialApproverId = user.sequentialApprovers[0];
    } else {
      const hrUser = users.find((u) => u.role === "HR");
      initialApproverId = hrUser?.id;
    }

    const newLeave: LeaveRequest = {
      id: `l${Date.now()}`,
      userId,
      type,
      nature: finalNature, // Use calculated nature
      startDate: start,
      endDate: end,
      reason,
      status: "Pending",
      currentApproverId: initialApproverId,
      approvalChain: [],
      createdAt: new Date().toISOString(),
      daysCalculated: quantity,
      unpaidLeaveDays: finalNature === 'Unpaid' && type === 'Regular' ? quantity : 0, // Simplified
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
    remarks?: string,
    isFinalDecision?: boolean // New Parameter
  ) => {
    setLeaves((prev) =>
      prev.map((leave) => {
        if (leave.id !== leaveId) return leave;

        // Determine who is logically approving this (the "Role" being performed)
        // If approverId is the assigned approver, then actingForId = approverId
        // If assigned approver has DELEGATED to approverId, then actingForId = assigned approver (leave.currentApproverId)

        let actingForId = approverId;
        const assignedApproverUser = users.find(
          (u) => u.id === leave.currentApproverId
        );

        if (
          assignedApproverUser &&
          assignedApproverUser.delegatedTo === approverId
        ) {
          actingForId = assignedApproverUser.id;
        }

        const actingForUser = users.find((u) => u.id === actingForId);

        // isFinalAuthority logic: If passed explicitly OR if role is MD/Director (who are implicitly final)
        // HR is potentially final if they choose to be.
        // NOTE: Uses actingForUser to determine authority level.
        // If I delegate to my junior, they approve AS ME (Manager).
        const isFinalAuthority =
          isFinalDecision ||
          actingForUser?.role === "MD" ||
          actingForUser?.role === "Director";

        // Determine Action Status
        const actionStatus = isFinalAuthority ? "Approved" : "Recommended";

        // Add to chain
        const newChain = [
          ...leave.approvalChain,
          {
            approverId,
            status: actionStatus as any, // Cast to avoid transient type errors before dependent file updates
            date: new Date().toISOString(),
            remarks,
            delegatedFromId:
              actingForId !== approverId ? actingForId : undefined, // Track if delegated
          },
        ];

        if (isFinalAuthority) {
          // Final Approval
          return {
            ...leave,
            approvalChain: newChain,
            currentApproverId: undefined,
            status: "Approved",
          };
        } else {
          // Move up hierarchy
          let nextApproverId: string | undefined;
          const submittingUser = users.find((u) => u.id === leave.userId);
          const seqApprovers = submittingUser?.sequentialApprovers || [];
          // Use actingForId to find position in sequence
          const currentSeqIndex = seqApprovers.indexOf(actingForId);

          if (
            currentSeqIndex !== -1 &&
            currentSeqIndex < seqApprovers.length - 1
          ) {
            // 1. If current approver is in the sequence and not the last, move to the next in sequence
            nextApproverId = seqApprovers[currentSeqIndex + 1];
          } else {
            // 2. If end of sequence OR not in sequence
            if (actingForUser?.role !== "HR") {
              // Standard path: Forward to HR
              const hrUser = users.find((u) => u.role === "HR");
              nextApproverId = hrUser?.id;
            } else {
              // HR Forwarding path: Forward to Director/MD
              const director = users.find(
                (u) => u.role === "Director" || u.role === "MD"
              );
              nextApproverId = director?.id;
            }
          }

          // --- INTERCEPTION LOGIC ---
          // If next is MD/Director, and current approver is NOT HR, route to HR first.
          if (nextApproverId) {
            const nextUser = users.find((u) => u.id === nextApproverId);
            const isTargetMD =
              nextUser?.role === "MD" || nextUser?.role === "Director";

            if (isTargetMD && actingForUser?.role !== "HR") {
              const hrUser = users.find((u) => u.role === "HR");
              if (hrUser) {
                nextApproverId = hrUser.id;
              }
            }
          }
          // --- END INTERCEPTION ---

          if (nextApproverId) {
            return {
              ...leave,
              approvalChain: newChain,
              currentApproverId: nextApproverId, // Move to next
            };
          } else {
            // Edge case: No next approver but not HR/MD? Should likely finish as Approved or stay Pending?
            // Assuming chain ends at MD anyway.
            return {
              ...leave,
              approvalChain: newChain,
              currentApproverId: undefined, // End of chain means approved?
              status: "Approved",
            };
          }
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
    // Note: Balance restoration moved inside setLeaves to depend on role check
    /* if (leave) { ... } */
    setLeaves((prev) =>
      prev.map((leave) => {
        if (leave.id !== leaveId) return leave;

        const currentApproverUser = users.find((u) => u.id === approverId);

        let actingForId = approverId;
        const assignedApproverUser = users.find(
          (u) => u.id === leave.currentApproverId
        );
        if (
          assignedApproverUser &&
          assignedApproverUser.delegatedTo === approverId
        ) {
          actingForId = assignedApproverUser.id;
        }
        const actingForUser = users.find((u) => u.id === actingForId);

        const isFinalAuthority =
          actingForUser?.role === "HR" || actingForUser?.role === "MD";

        if (isFinalAuthority) {
          // Restore Balance ONLY if it's a final Rejection
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
        } else {
          // "Not Recommended" - Moves to next approver

          let nextApproverId: string | undefined;
          const submittingUser = users.find((u) => u.id === leave.userId);
          const seqApprovers = submittingUser?.sequentialApprovers || [];
          const currentSeqIndex = seqApprovers.indexOf(actingForId);

          if (
            currentSeqIndex !== -1 &&
            currentSeqIndex < seqApprovers.length - 1
          ) {
            nextApproverId = seqApprovers[currentSeqIndex + 1];
          } else if (
            seqApprovers.length > 0 &&
            currentSeqIndex === seqApprovers.length - 1
          ) {
            if (actingForUser?.role !== "HR") {
              const hrUser = users.find((u) => u.role === "HR");
              nextApproverId = hrUser?.id;
            }
          } else {
            // Fallback
            if (actingForUser?.role !== "HR") {
              const hrUser = users.find((u) => u.role === "HR");
              nextApproverId = hrUser?.id;
            }
          }

          // --- INTERCEPTION LOGIC ---
          if (nextApproverId) {
            const nextUser = users.find((u) => u.id === nextApproverId);
            const isTargetMD =
              nextUser?.role === "MD" || nextUser?.role === "Director";

            if (isTargetMD && currentApproverUser?.role !== "HR") {
              const hrUser = users.find((u) => u.role === "HR");
              if (hrUser) {
                nextApproverId = hrUser.id;
              }
            }
          }
          // --- END INTERCEPTION ---
          // If no next, then it is effectively rejected? Or stays stuck?
          // Assuming hierarchy leads to MD.

          return {
            ...leave,
            currentApproverId: nextApproverId, // Pass it on
            approvalChain: [
              ...leave.approvalChain,
              {
                approverId,
                status: "Not Recommended" as any,
                date: new Date().toISOString(),
                remarks,
              },
            ],
          };
        }
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

  /* 
    DELEGATION LOGIC REFACTOR:
    - Replaced single-field delegation with history-based scheduling.
    - getPendingApprovals now checks the delegationHistory array.
    - addDelegation appends to history.
    - cancelDelegation removes from history.
  */

  const getPendingApprovals = (approverId: string) => {
    const now = new Date();
    const delegators = users
      .filter((u) => {
        // Check if any history entry makes this user delegated to 'approverId' right now
        // A user is delegated IF:
        // 1. They have a history entry where delegatedToId === approverId
        // 2. AND current time is within [startDate, endDate]
        if (!u.delegationHistory) return false;

        return u.delegationHistory.some(h => {
          if (h.delegatedToId !== approverId) return false;
          const start = new Date(h.startDate);
          const end = new Date(h.endDate);
          return now >= start && now <= end;
        });
      })
      .map((u) => u.id);

    return leaves.filter(
      (l) =>
        l.status === "Pending" &&
        (l.currentApproverId === approverId ||
          (l.currentApproverId && delegators.includes(l.currentApproverId)))
    );
  };

  // Renamed from setDelegate to better reflect "Queue/Schedule" nature
  const addDelegation = (
    userId: string,
    delegateId: string,
    startDate: string,
    endDate: string
  ) => {
    // Helper to update user object
    const updatedUser = (u: typeof currentUser) => {
      if(!u) return u;
      const newHistory = u.delegationHistory || [];
      const entry: DelegationHistory = {
        id: `dh-${Date.now()}`,
        delegatedToId: delegateId,
        startDate,
        endDate,
        assignedAt: new Date().toISOString(),
      };
      
      return {
        ...u,
        delegationHistory: [entry, ...newHistory],
        // Deprecated fields cleared
        delegatedTo: undefined,
        delegationStartDate: undefined,
        delegationEndDate: undefined
      };
    };

    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === userId ? updatedUser(u)! : u))
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => updatedUser(prev));
    }
  };

  const cancelDelegation = (userId: string, historyId: string) => {
      // Logic: Only defined "Future" or "Scheduled" delegations can be cancelled (deleted).
      // Active or Past cannot be deleted to preserve history.
      const updatedUser = (u: typeof currentUser) => {
        if(!u) return u;
        const now = new Date();
        const history = u.delegationHistory || [];
        
        // Filter out ONLY if it hasn't started yet
        const newHistory = history.filter(h => {
          if (h.id === historyId) {
             const start = new Date(h.startDate);
             if (now < start) {
                return false; // Remove it (it's future)
             }
             // If active or past, keep it (immutable) - Consuming UI should handle this but safety here
             console.warn("Cannot delete active or past delegation. Use stopDelegation instead.");
             return true; 
          }
          return true;
        });

        return {
          ...u,
          delegationHistory: newHistory
        };
      };

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? updatedUser(u)! : u))
      );
      if (currentUser?.id === userId) {
        setCurrentUser((prev) => updatedUser(prev));
      }
  };

  const stopDelegation = (userId: string, historyId: string) => {
      // Logic: Cut short an active delegation by setting EndDate to NOW.
      const updatedUser = (u: typeof currentUser) => {
        if(!u) return u;
        const now = new Date();
        const history = u.delegationHistory || [];
        
        const newHistory = history.map(h => {
           if (h.id === historyId) {
              const start = new Date(h.startDate);
              const end = new Date(h.endDate);
              // Only applicable if currently active (or even future/past if we wanted to truncate, but mostly for active)
             if (now >= start && now <= end) {
                 return { ...h, endDate: now.toISOString() };
             }
           }
           return h;
        });

        return { ...u, delegationHistory: newHistory };
      };
      
      setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? updatedUser(u)! : u)));
      if (currentUser?.id === userId) setCurrentUser((prev) => updatedUser(prev));
  };


  const extendDelegation = (userId: string, historyId: string, newEndDate: string) => {
       const updatedUser = (u: typeof currentUser) => {
        if(!u) return u;
        const history = u.delegationHistory || [];
        
        const newHistory = history.map(h => {
           if (h.id === historyId) {
                 return { ...h, endDate: newEndDate };
           }
           return h;
        });

        return { ...u, delegationHistory: newHistory };
      };
      
      setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? updatedUser(u)! : u)));
      if (currentUser?.id === userId) setCurrentUser((prev) => updatedUser(prev));
  };

  const updateDelegation = (userId: string, historyId: string, delegateId: string, startDate: string, endDate: string) => {
       const updatedUser = (u: typeof currentUser) => {
        if(!u) return u;
        const history = u.delegationHistory || [];
        
        const newHistory = history.map(h => {
           if (h.id === historyId) {
                return { 
                  ...h, 
                  delegatedToId: delegateId,
                  startDate,
                  endDate
                };
           }
           return h;
        });

        return { ...u, delegationHistory: newHistory };
      };
      
      setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? updatedUser(u)! : u)));
      if (currentUser?.id === userId) setCurrentUser((prev) => updatedUser(prev));
  };



  const updateUserApprovers = (userId: string, approverIds: string[]) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId ? { ...u, sequentialApprovers: approverIds } : u
      )
    );
  };

  const skipLeave = (leaveId: string, approverId: string) => {
    setLeaves((prev) =>
      prev.map((leave) => {
        if (leave.id !== leaveId) return leave;

        const currentApproverUser = users.find((u) => u.id === approverId);

        let actingForId = approverId;
        const assignedApproverUser = users.find(
          (u) => u.id === leave.currentApproverId
        );
        if (
          assignedApproverUser &&
          assignedApproverUser.delegatedTo === approverId
        ) {
          actingForId = assignedApproverUser.id;
        }
        const actingForUser = users.find((u) => u.id === actingForId);

        let nextApproverId: string | undefined;

        const submittingUser = users.find((u) => u.id === leave.userId);
        const seqApprovers = submittingUser?.sequentialApprovers || [];
        const currentSeqIndex = seqApprovers.indexOf(actingForId);

        if (
          currentSeqIndex !== -1 &&
          currentSeqIndex < seqApprovers.length - 1
        ) {
          nextApproverId = seqApprovers[currentSeqIndex + 1];
        } else if (
          seqApprovers.length > 0 &&
          currentSeqIndex === seqApprovers.length - 1
        ) {
          if (actingForUser?.role !== "HR") {
            const hrUser = users.find((u) => u.role === "HR");
            nextApproverId = hrUser?.id;
          }
        } else {
          if (actingForUser?.role !== "HR") {
            const hrUser = users.find((u) => u.role === "HR");
            nextApproverId = hrUser?.id;
          }
        }

        // --- INTERCEPTION LOGIC ---
        if (nextApproverId) {
          const nextUser = users.find((u) => u.id === nextApproverId);
          const isTargetMD =
            nextUser?.role === "MD" || nextUser?.role === "Director";

          if (isTargetMD && currentApproverUser?.role !== "HR") {
            const hrUser = users.find((u) => u.role === "HR");
            if (hrUser) {
              nextApproverId = hrUser.id;
            }
          }
        }
        // --- END INTERCEPTION ---

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
        addDelegation,
        cancelDelegation,
        stopDelegation,
        extendDelegation,
        updateDelegation,
        updateUserApprovers,
        holidays,
        addHoliday,
        deleteHoliday,

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
