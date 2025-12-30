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
    {
        id: 'l1',
        userId: 'u1',
        type: 'Regular',
        startDate: '2024-07-10',
        endDate: '2024-07-11',
        reason: 'Personal emergency',
        status: 'Approved',
        daysCalculated: 2,
        currentApproverId: undefined, // Finished
        approvalChain: [
            { approverId: 'u2', status: 'Approved', date: '2024-07-09T10:00:00Z' },
            { approverId: 'u3', status: 'Approved', date: '2024-07-09T14:00:00Z' },
            // Director didn't need to approve? Or maybe chain was shorter then. 
            // Let's assume full chain for future requests.
        ],
        createdAt: '2024-07-09T09:00:00Z',
    }
];
