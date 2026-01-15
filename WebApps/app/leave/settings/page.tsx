"use client";

import { useLMS } from "@/context/LMSContext";
import { formatDateTime } from "@/lib/utils";
import { Ban, Check, Clock, Edit2, Trash2, X } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { currentUser, users, addDelegation, cancelDelegation, stopDelegation, extendDelegation, updateDelegation } = useLMS();
  
  // Local state for the "Add Delegation" form
  const [selectedDelegate, setSelectedDelegate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);

  // State for Extension (Active Delegation)
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extensionDate, setExtensionDate] = useState<string>("");

  if (!currentUser) {
    return <div className="p-8">Please log in to access settings.</div>;
  }

  const potentialDelegates = users.filter((u) => u.id !== currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDelegate && startDate && endDate) {
      if (editingId) {
         updateDelegation(currentUser.id, editingId, selectedDelegate, startDate, endDate);
         setEditingId(null);
      } else {
         addDelegation(currentUser.id, selectedDelegate, startDate, endDate);
      }
      // Reset form
      setSelectedDelegate("");
      setStartDate("");
      setEndDate("");
    }
  };

  const handleEditClick = (history: any) => {
      setEditingId(history.id);
      setSelectedDelegate(history.delegatedToId);
      setStartDate(history.startDate);
      setEndDate(history.endDate);
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setSelectedDelegate("");
      setStartDate("");
      setEndDate("");
  };

  const handleExtend = (historyId: string) => {
    if (extensionDate) {
      extendDelegation(currentUser.id, historyId, extensionDate);
      setExtendingId(null);
      setExtensionDate("");
    }
  };

  const activeDelegations = currentUser.delegationHistory?.filter(h => {
     const now = new Date();
     const start = new Date(h.startDate);
     const end = new Date(h.endDate);
     return now >= start && now <= end;
  }) || [];

  const currentDelegateUser = activeDelegations.length > 0 
    ? users.find(u => u.id === activeDelegations[0].delegatedToId) 
    : null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
           Approval Delegation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your approval authority and delegation history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Controls */}
        <div className="space-y-6 lg:col-span-1">
            
            {/* 1. Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 text-sm">Current Status</h3>
                </div>
                <div className="p-5">
                    {currentDelegateUser && activeDelegations[0] ? (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">⚠️</span>
                                <h4 className="font-bold text-amber-800 text-sm">Delegation Active</h4>
                            </div>
                            <p className="text-xs text-amber-700 leading-relaxed mb-3">
                                You have delegated approval authority to:
                                <br/>
                                <strong className="text-amber-900 block mt-1">{currentDelegateUser.name}</strong>
                                <span className="opacity-75">{currentDelegateUser.designation}</span>
                            </p>
                            <button
                                onClick={() => stopDelegation(currentUser.id, activeDelegations[0].id)}
                                className="w-full py-2 bg-white border border-amber-300 text-amber-700 text-xs font-bold rounded hover:bg-amber-100 transition-colors"
                            >
                                Stop Delegation
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 text-gray-600">
                             <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                🛡️
                             </div>
                             <div>
                                 <p className="text-sm font-medium text-gray-900">Active</p>
                                 <p className="text-xs text-gray-500 mt-0.5">You are currently managing your own approvals.</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Schedule Form Card */}
            <div className={`bg-white rounded-xl shadow-sm border-2 ${editingId ? 'border-purple-200 ring-2 ring-purple-50' : 'border-gray-200'} overflow-hidden transition-all`}>
                <div className={`p-4 border-b ${editingId ? 'bg-purple-50 border-purple-100' : 'bg-gray-50/50 border-gray-100'} flex justify-between items-center`}>
                    <h3 className={`font-bold text-sm ${editingId ? 'text-purple-700' : 'text-gray-800'}`}>
                        {editingId ? "Edit Scheduled Delegation" : "Schedule Delegation"}
                    </h3>
                    {editingId && (
                        <button onClick={handleCancelEdit} className="text-xs text-purple-600 hover:text-purple-800 underline">
                            Cancel
                        </button>
                    )}
                </div>
                <div className="p-5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                Delegate To
                            </label>
                            <select
                                value={selectedDelegate}
                                onChange={(e) => setSelectedDelegate(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                            >
                                <option value="">-- Select Employee --</option>
                                {potentialDelegates.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                             <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Start Date
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    End Date
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={endDate}
                                    min={startDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                />
                             </div>
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm mt-2 ${editingId ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}
                        >
                            {editingId ? "Update Delegation" : "Confirm Schedule"}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: History */}
        <div className="lg:col-span-2">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm">Delegation History</h3>
                    <span className="text-xs text-gray-400">
                        {currentUser.delegationHistory?.length || 0} records
                    </span>
                </div>
                <div className="p-0">
                     {currentUser.delegationHistory && currentUser.delegationHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                    <tr>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Delegate</th>
                                    <th className="px-4 py-3 font-semibold">Period</th>
                                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[...currentUser.delegationHistory]
                                    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
                                    .map((history) => {
                                        const delegateUser = users.find((u) => u.id === history.delegatedToId);
                                        const start = new Date(history.startDate);
                                        const end = new Date(history.endDate);
                                        const now = new Date();

                                        let status = "Past";
                                        let statusColor = "bg-gray-100 text-gray-500";
                                        
                                        if (now >= start && now <= end) {
                                            status = "Active";
                                            statusColor = "bg-green-100 text-green-700";
                                        } else if (now < start) {
                                            status = "Scheduled";
                                            statusColor = "bg-blue-100 text-blue-700";
                                        }

                                        const isExtending = extendingId === history.id;
                                        const isEditing = editingId === history.id;

                                        return (
                                            <tr key={history.id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-purple-50 hover:bg-purple-50' : ''}`}>
                                                <td className="px-4 py-3 align-top">
                                                     <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>
                                                        {status}
                                                     </span>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <div className="font-medium text-gray-900 text-sm">
                                                        {delegateUser ? delegateUser.name : "Unknown"}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {delegateUser?.designation}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <div className="flex flex-col text-xs space-y-0.5">
                                                        <span className="text-gray-600">From: {formatDateTime(history.startDate)}</span>
                                                        <span className="text-gray-600">To: {formatDateTime(history.endDate)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-top text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        {/* Scheduled: Edit & Cancel */}
                                                        {status === "Scheduled" && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleEditClick(history)}
                                                                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Edit2 className="w-3 h-3" />
                                                                    Edit
                                                                </button>
                                                                <button 
                                                                    onClick={() => cancelDelegation(currentUser.id, history.id)}
                                                                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        )}

                                                        { status === "Active" && !isExtending && (
                                                            <>
                                                                <button 
                                                                    onClick={() => stopDelegation(currentUser.id, history.id)}
                                                                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Ban className="w-3 h-3" />
                                                                    Stop
                                                                </button>
                                                                <button 
                                                                    onClick={() => setExtendingId(history.id)}
                                                                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Clock className="w-3 h-3" />
                                                                    Extend
                                                                </button>
                                                            </>
                                                        )}

                                                         {/* Extension UI (Inline Float) */}
                                                        {isExtending && (
                                                            <div className="flex items-center gap-2 bg-white border border-blue-200 p-1.5 rounded-lg shadow-lg relative z-10 animate-in fade-in zoom-in-95">
                                                                <input 
                                                                    type="datetime-local" 
                                                                    className="text-xs border border-gray-300 rounded px-2 py-1 w-36 outline-none focus:border-blue-500"
                                                                    onChange={(e) => setExtensionDate(e.target.value)}
                                                                    autoFocus
                                                                />
                                                                <div className="flex gap-1">
                                                                    <button 
                                                                        onClick={() => handleExtend(history.id)}
                                                                        className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                                        title="Confirm"
                                                                    >
                                                                        <Check className="w-3 h-3" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setExtendingId(null)}
                                                                        className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                                                                        title="Cancel"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                     ) : (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3 text-gray-400">
                                🕒
                            </div>
                            <h3 className="text-gray-500 font-medium">No History</h3>
                            <p className="text-gray-400 text-sm mt-1">You haven't delegated any approvals yet.</p>
                        </div>
                     )}
                </div>
             </div>
        </div>

      </div>
    </div>
  );
}
