"use client";

import { useLMS } from "@/context/LMSContext";
import { formatDate, formatDuration } from "@/lib/utils";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const { currentUser, leaves, users, balances } = useLMS();

  // State for filters
  const [selectedEmployee, setSelectedEmployee] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Helper: Get user name
  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.name || "Unknown User";

  // Filter Logic
  const filteredLeaves = leaves.filter((leave) => {
    // 1. Employee Filter
    if (selectedEmployee !== "All" && leave.userId !== selectedEmployee) {
      return false;
    }

    // 2. Type Filter
    if (selectedType !== "All" && leave.type !== selectedType) {
      return false;
    }

    // 3. Date Range Filter
    if (startDate) {
      if (new Date(leave.startDate) < new Date(startDate)) return false;
    }
    if (endDate) {
      if (new Date(leave.endDate) > new Date(endDate)) return false;
    }

    return true;
  });

  // Summary Logic
  const summary = useMemo(() => {
    if (selectedEmployee === "All") return null;

    const userBalance = balances.find((b) => b.userId === selectedEmployee);
    const selectedUser = users.find((u) => u.id === selectedEmployee);

    // Filter Stats (Within selected range)
    const approvedInFilter = filteredLeaves.filter((l) => l.status === "Approved");
    
    // 1. Sick
    const sickDays = approvedInFilter
        .filter(l => l.nature === 'Sick')
        .reduce((acc, curr) => acc + curr.daysCalculated, 0);

    // 2. Casual
    const casualDays = approvedInFilter
        .filter(l => l.nature === 'Casual')
        .reduce((acc, curr) => acc + curr.daysCalculates, 0);

    // 3. Unpaid (Nature=Unpaid OR explicit unpaid days)
    const unpaidDays = approvedInFilter.reduce((acc, curr) => {
        if (curr.nature === 'Unpaid') return acc + curr.daysCalculated;
        return acc + (curr.unpaidLeaveDays || 0);
    }, 0);

    // 4. Paid (Everything else that isn't Sick, Casual, or Unpaid portion)
    // Formula: Total Days - Unpaid Portion - Sick - Casual
    // Note: If nature is 'Sick' but has unpaid days, we subtract unpaid from it? 
    // Simplified: "Paid" category usually refers to "Earned" or "Privilege".
    // Let's count explicitly: Nature NOT IN (Sick, Casual, Unpaid) - UnpaidPortion
    const allApprovedDays = approvedInFilter.reduce((acc, curr) => acc + curr.daysCalculated, 0);
    const paidDays = allApprovedDays - sickDays - casualDays - unpaidDays; 
    
    // Safety check if calculation goes negative (unlikely with valid data)
    const safePaid = Math.max(0, paidDays);

    return {
        user: selectedUser,
        sickDays,
        casualDays,
        paidDays: safePaid,
        unpaidDays,
        balance: userBalance
    };
  }, [filteredLeaves, selectedEmployee, balances, users]);


  // Export Logic
  const handleExport = () => {
    const exportData = filteredLeaves.map((l) => ({
      "Request ID": l.id,
      Employee: getUserName(l.userId),
      Type: l.type,
      Status: l.status,
      "Start Date": l.startDate,
      "End Date": l.endDate,
      "Days/Hours":
        formatDuration(l.daysCalculated) +
        (l.type === "Short" ? " Hrs" : " Days"),
      Reason: l.reason,
      "Applied On": l.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Report");
    XLSX.writeFile(
      workbook,
      `Leave_Report_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const clearFilters = () => {
    setSelectedEmployee("All");
    setSelectedType("All");
    setStartDate("");
    setEndDate("");
  };

  const setFilterThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toDateInput = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };
    setStartDate(toDateInput(start));
    setEndDate(toDateInput(end));
  }

  const setFilterThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    const toDateInput = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };
    setStartDate(toDateInput(start));
    setEndDate(toDateInput(end));
  }

  if (!currentUser || currentUser.role !== "HR") {
    return (
      <div className="p-8 text-center text-gray-500">
        Access Denied. Only HR can view reports.
      </div>
    );
  }

  return (
    <div>
      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-gray-50 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Filter Options</h2>
          
          <div className="flex items-center gap-2">
             {/* Quick Filters - Integrated into Header */}
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:inline-block">Quick:</span>
             <button onClick={setFilterThisMonth} className="px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors">
                 This Month
             </button>
             <button onClick={setFilterThisYear} className="px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors">
                 This Year
             </button>
             <div className="h-4 w-px bg-gray-200 mx-1 hidden md:block"></div>
             <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700 font-bold underline decoration-gray-300 hover:decoration-gray-500"
            >
                Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* Inputs (removed bottom quick filter row) */}
          {/* Employee Select */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Employees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Select */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Leave Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Types</option>
              <option value="Casual">Casual</option>
              <option value="Sick">Sick</option>
              <option value="Earned">Earned</option>
              <option value="Short">Short</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Employee Summary Card - CONDITIONAL */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 animate-in fade-in slide-in-from-top-4">
            {/* User Info */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    👤
                 </div>
                 <div>
                     <p className="text-sm font-bold text-gray-900">{summary.user?.name}</p>
                     <p className="text-xs text-gray-500">{summary.user?.designation}</p>
                 </div>
            </div>

            {/* Sick */}
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-sm">
                 <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Sick Leave</p>
                 <p className="text-2xl font-bold text-rose-700 mt-1">{summary.sickDays} <span className="text-sm font-medium opacity-70">Days</span></p>
                 <p className="text-[10px] text-rose-600/70 mt-1">Medical/Health</p>
            </div>

            {/* Casual */}
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Casual Leave</p>
                 <p className="text-2xl font-bold text-blue-700 mt-1">{summary.casualDays} <span className="text-sm font-medium opacity-70">Days</span></p>
                 <p className="text-[10px] text-blue-600/70 mt-1">Personal/Casual</p>
            </div>

            {/* Paid/Earned */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Paid Leave</p>
                 <p className="text-2xl font-bold text-emerald-700 mt-1">{summary.paidDays} <span className="text-sm font-medium opacity-70">Days</span></p>
                 <p className="text-[10px] text-emerald-600/70 mt-1">Earned/Privilege</p>
            </div>

            {/* Unpaid */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm">
                 <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Unpaid Leave</p>
                 <p className="text-2xl font-bold text-amber-700 mt-1">{summary.unpaidDays} <span className="text-sm font-medium opacity-70">Days</span></p>
                 <p className="text-[10px] text-amber-600/70 mt-1">LWP / Deducted</p>
            </div>

        </div>
      )}

      {/* Results & Actions */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-bold text-gray-900">
            {filteredLeaves.length}
          </span>{" "}
          records
        </p>
        <button
          onClick={handleExport}
          disabled={filteredLeaves.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>📥</span> Export to Excel
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Applied On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {getUserName(request.userId)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          request.nature === "Sick"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : request.nature === "Casual"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-purple-50 text-purple-600 border-purple-100"
                        }`}
                      >
                        {request.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatDuration(request.daysCalculated)}{" "}
                      {request.type === "Short" ? "Hrs" : "Days"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(request.startDate)}{" "}
                      <span className="text-gray-300">→</span>{" "}
                      {formatDate(request.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          request.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : request.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {request.createdAt.split("T")[0]}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
