export type LeaveType = 'Regular' | 'Short';
export type LeaveNature = 'Casual' | 'Sick' | 'Maternity' | 'Pilgrim' | 'Unpaid' | 'Other';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Skipped';

export interface User {
    id: string;
    name: string;
    email: string;
    approver?: string; // ID of the next person in the hierarchy
    avatarUrl?: string;
    designation: string;
}

export interface LeaveBalance {
    userId: string;
    year: number; // e.g., 2024 (representing 2024-2025 session)
    totalDays: number;
    usedDays: number;
    pendingDays: number;
    totalHours: number; // For short leave
    usedHours: number;
    // Split Quotas (Internal Separation)
    sickQuota: number;
    sickUsed: number;
    casualQuota: number;
    casualUsed: number;
}

export interface LeaveRequest {
    id: string;
    userId: string;
    type: LeaveType;
    nature?: LeaveNature; // Specific nature if Regular
    startDate: string; // ISO Date
    endDate: string; // ISO Date
    startTime?: string; // For Short Leave (HH:mm)
    endTime?: string; // For Short Leave (HH:mm)
    reason: string;
    status: LeaveStatus;
    currentApproverId?: string; // Who needs to approve this right now?
    approvalChain: {
        approverId: string;
        status: 'Approved' | 'Rejected' | 'Skipped';
        date: string;
        remarks?: string;
    }[];
    createdAt: string;
    daysCalculated: number; // Stored calculation
}
