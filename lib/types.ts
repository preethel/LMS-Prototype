export type LeaveType = 'Regular' | 'Short';
export type LeaveNature = 'Casual' | 'Sick' | 'Maternity' | 'Pilgrim' | 'Unpaid' | 'Other';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Skipped' | 'Recommended' | 'Not Recommended';

export interface User {
    id: string;
    name: string;
    email: string;
    approver?: string; // ID of the next person in the hierarchy
    avatarUrl?: string;
    designation: string;
    role: 'Employee' | 'TeamLead' | 'Manager' | 'HR' | 'MD';
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
        status: 'Approved' | 'Rejected' | 'Skipped' | 'Recommended' | 'Not Recommended';
        date: string;
        remarks?: string;
    }[];
    createdAt: string;
    daysCalculated: number; // Stored calculation
    unpaidLeaveDays?: number; // Days marked as Unpaid / LWP
    attachments?: Attachment[]; // File attachments
}

export interface Attachment {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string; // Mock URL or Base64
}
