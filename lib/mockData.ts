import { LeaveBalance, LeaveRequest, User } from './types';

// Hierarchy:
// Employee (Dev) -> Team Lead -> Manager -> Director

export const MOCK_USERS: User[] = [
    {
        id: 'u1',
        name: 'John Junior',
        email: 'john@company.com',
        designation: 'Frontend Developer',
        approver: 'u2', // Reports to Team Lead
    },
    {
        id: 'u2',
        name: 'Sarah Lead',
        email: 'sarah@company.com',
        designation: 'Team Lead',
        approver: 'u3', // Reports to Manager
    },
    {
        id: 'u3',
        name: 'Mike Manager',
        email: 'mike@company.com',
        designation: 'Engineering Manager',
        approver: 'u4', // Reports to Director
    },
    {
        id: 'u4',
        name: 'Diana Director',
        email: 'diana@company.com',
        designation: 'Director of Engineering',
        // No approver = Final node
    },
    {
        id: 'u5',
        name: 'Emily Employee',
        email: 'emily@company.com',
        designation: 'UI Designer',
        approver: 'u2', // Also reports to Sarah
    },
];

export const MOCK_BALANCES: LeaveBalance[] = [
    { userId: 'u1', year: 2024, totalDays: 20, usedDays: 2, pendingDays: 0, totalHours: 16, usedHours: 0 },
    { userId: 'u2', year: 2024, totalDays: 20, usedDays: 5, pendingDays: 0, totalHours: 16, usedHours: 4 },
    { userId: 'u3', year: 2024, totalDays: 20, usedDays: 0, pendingDays: 0, totalHours: 16, usedHours: 0 },
    { userId: 'u4', year: 2024, totalDays: 25, usedDays: 1, pendingDays: 0, totalHours: 16, usedHours: 0 },
    { userId: 'u5', year: 2024, totalDays: 20, usedDays: 3, pendingDays: 1, totalHours: 16, usedHours: 0 },
];

export const MOCK_LEAVES: LeaveRequest[] = [
    // --- Past Approved Leaves for U1 (My Applications History) ---
    {
        id: 'l1', userId: 'u1', type: 'Regular', startDate: '2024-01-10', endDate: '2024-01-12',
        reason: 'Sickness', status: 'Approved', daysCalculated: 3, createdAt: '2024-01-05T09:00:00Z',
        approvalChain: [{ approverId: 'u2', status: 'Approved', date: '2024-01-06T10:00:00Z' }]
    },
    {
        id: 'l2', userId: 'u1', type: 'Short', startDate: '2024-02-15', endDate: '2024-02-15',
        startTime: '10:00', endTime: '12:00', reason: 'Dentist', status: 'Approved', daysCalculated: 2, createdAt: '2024-02-14T09:00:00Z',
        approvalChain: [{ approverId: 'u2', status: 'Approved', date: '2024-02-14T15:00:00Z' }]
    },
    {
        id: 'l3', userId: 'u1', type: 'Regular', startDate: '2024-03-01', endDate: '2024-03-05',
        reason: 'Vacation', status: 'Approved', daysCalculated: 5, createdAt: '2024-02-20T09:00:00Z',
        approvalChain: [{ approverId: 'u2', status: 'Approved', date: '2024-02-21T10:00:00Z' }]
    },
    {
        id: 'l4', userId: 'u1', type: 'Regular', startDate: '2024-04-10', endDate: '2024-04-11',
        reason: 'Personal', status: 'Rejected', daysCalculated: 2, createdAt: '2024-04-01T09:00:00Z',
        approvalChain: [{ approverId: 'u2', status: 'Rejected', date: '2024-04-02T10:00:00Z', remarks: 'Team offline offsite' }]
    },
    {
        id: 'l5', userId: 'u1', type: 'Regular', startDate: '2024-05-20', endDate: '2024-05-22',
        reason: 'Conference', status: 'Approved', daysCalculated: 3, createdAt: '2024-05-10T09:00:00Z',
        approvalChain: [{ approverId: 'u2', status: 'Approved', date: '2024-05-11T10:00:00Z' }]
    },
    {
        id: 'l6', userId: 'u1', type: 'Short', startDate: '2024-06-01', endDate: '2024-06-01',
        startTime: '14:00', endTime: '16:00', reason: 'Bank work', status: 'Approved', daysCalculated: 2, createdAt: '2024-05-30T09:00:00Z',
        approvalChain: [{ approverId: 'u2', status: 'Approved', date: '2024-05-31T10:00:00Z' }]
    },
    {
        id: 'l7', userId: 'u1', type: 'Regular', startDate: '2024-07-15', endDate: '2024-07-15',
        reason: 'Sick', status: 'Approved', daysCalculated: 1, createdAt: '2024-07-14T09:00:00Z',
        approvalChain: [{ approverId: 'u2', status: 'Approved', date: '2024-07-14T12:00:00Z' }]
    },
    {
        id: 'l8', userId: 'u1', type: 'Regular', startDate: '2024-08-01', endDate: '2024-08-01',
        reason: 'Personal', status: 'Pending', daysCalculated: 1, createdAt: '2024-07-30T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },
    {
        id: 'l9', userId: 'u1', type: 'Regular', startDate: '2024-08-10', endDate: '2024-08-12',
        reason: 'Family event', status: 'Pending', daysCalculated: 3, createdAt: '2024-08-01T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },
    {
        id: 'l10', userId: 'u1', type: 'Short', startDate: '2024-08-20', endDate: '2024-08-20',
        startTime: '09:00', endTime: '11:00', reason: 'Car service', status: 'Pending', daysCalculated: 2, createdAt: '2024-08-18T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },
    {
        id: 'l11', userId: 'u1', type: 'Regular', startDate: '2024-09-01', endDate: '2024-09-05',
        reason: 'Planned Trip', status: 'Pending', daysCalculated: 5, createdAt: '2024-08-25T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },
    {
        id: 'l12', userId: 'u1', type: 'Regular', startDate: '2024-10-01', endDate: '2024-10-01',
        reason: 'Wedding', status: 'Pending', daysCalculated: 1, createdAt: '2024-09-20T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },

    // --- Approvals for U2 (Pending Requests from U1 and U5) ---
    {
        id: 'l13', userId: 'u5', type: 'Regular', startDate: '2024-08-05', endDate: '2024-08-06',
        reason: 'Sick Leave', status: 'Pending', daysCalculated: 2, createdAt: '2024-08-04T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },
    {
        id: 'l14', userId: 'u5', type: 'Short', startDate: '2024-08-08', endDate: '2024-08-08',
        startTime: '15:00', endTime: '17:00', reason: 'Early leave', status: 'Pending', daysCalculated: 2, createdAt: '2024-08-07T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },
    {
        id: 'l15', userId: 'u5', type: 'Regular', startDate: '2024-08-25', endDate: '2024-08-25',
        reason: 'Urgent', status: 'Pending', daysCalculated: 1, createdAt: '2024-08-24T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },
    {
        id: 'l16', userId: 'u5', type: 'Regular', startDate: '2024-09-10', endDate: '2024-09-12',
        reason: 'Vacation', status: 'Pending', daysCalculated: 3, createdAt: '2024-09-01T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },
    {
        id: 'l17', userId: 'u5', type: 'Regular', startDate: '2024-10-05', endDate: '2024-10-05',
        reason: 'Personal', status: 'Pending', daysCalculated: 1, createdAt: '2024-09-29T09:00:00Z',
        currentApproverId: 'u2', approvalChain: []
    },

    // --- Approvals for U3 (Pending Requests from U2 - Sarah's Applications) ---
    {
        id: 'l18', userId: 'u2', type: 'Regular', startDate: '2024-09-01', endDate: '2024-09-02',
        reason: 'Offsite', status: 'Pending', daysCalculated: 2, createdAt: '2024-08-15T09:00:00Z',
        currentApproverId: 'u3', approvalChain: []
    },
    {
        id: 'l19', userId: 'u2', type: 'Short', startDate: '2024-09-05', endDate: '2024-09-05',
        startTime: '10:00', endTime: '12:00', reason: 'Meeting', status: 'Pending', daysCalculated: 2, createdAt: '2024-09-04T09:00:00Z',
        currentApproverId: 'u3', approvalChain: []
    },
    {
        id: 'l21', userId: 'u2', type: 'Regular', startDate: '2024-12-24', endDate: '2024-12-26',
        reason: 'Christmas Holiday', status: 'Pending', daysCalculated: 3, createdAt: '2024-12-10T09:00:00Z',
        currentApproverId: 'u3', approvalChain: []
    },
    {
        id: 'l22', userId: 'u2', type: 'Short', startDate: '2024-12-31', endDate: '2024-12-31',
        startTime: '14:00', endTime: '16:00', reason: 'New Year Prep', status: 'Pending', daysCalculated: 2, createdAt: '2024-12-28T09:00:00Z',
        currentApproverId: 'u3', approvalChain: []
    },
    {
        id: 'l23', userId: 'u2', type: 'Regular', startDate: '2024-10-15', endDate: '2024-10-18',
        reason: 'Team Building', status: 'Approved', daysCalculated: 4, createdAt: '2024-10-01T09:00:00Z',
        approvalChain: [{ approverId: 'u3', status: 'Approved', date: '2024-10-02T10:00:00Z' }]
    },
    {
        id: 'l24', userId: 'u2', type: 'Regular', startDate: '2024-11-05', endDate: '2024-11-05',
        reason: 'Sick leave', status: 'Rejected', daysCalculated: 1, createdAt: '2024-11-04T08:00:00Z',
        approvalChain: [{ approverId: 'u3', status: 'Rejected', date: '2024-11-04T09:00:00Z', remarks: 'Important meeting scheduled' }]
    },

    // --- Special Test Case: Multi-level Approval (John -> Sarah -> Mike) ---
    // John applied, Sarah approved, now pending for Mike.
    {
        id: 'l20', userId: 'u1', type: 'Regular', startDate: '2024-11-20', endDate: '2024-11-25',
        reason: 'Project Verification', status: 'Pending', daysCalculated: 5, createdAt: '2024-11-15T09:00:00Z',
        currentApproverId: 'u3',
        approvalChain: [
            { approverId: 'u2', status: 'Approved', date: '2024-11-16T10:00:00Z', remarks: 'Verified, forwarding to Manager' }
        ]
    },
];
