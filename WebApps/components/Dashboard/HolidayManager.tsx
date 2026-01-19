import { useLMS } from "@/context/LMSContext";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function HolidayManager() {
  const { holidays, addHoliday, deleteHoliday, currentUser, weekendDays, toggleWeekendDay } = useLMS();
  const [newDate, setNewDate] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"Public" | "Company" | "Optional">("Public");

  if (currentUser?.role !== "HR" && currentUser?.role !== "Director") {
      return (
          <div className="p-8 text-center text-gray-500">
              Only HR can access this section.
          </div>
      );
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newName) return;
    addHoliday(newName, newDate, newType);
    setNewName("");
    setNewDate("");
  };

  // Sort: Future first, then Past (or simple date desc)
  const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      
      {/* Weekend Configuration */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
            Weekend Configuration
        </h3>
        <p className="text-xs text-gray-500 mb-4">Select the days that are considered weekends/weekly offs.</p>
        <div className="flex flex-wrap gap-2">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((dayName, index) => {
                const isWeekend = weekendDays.includes(index);
                return (
                    <button
                        key={dayName}
                        onClick={() => toggleWeekendDay(index)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            isWeekend 
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        {dayName}
                    </button>
                );
            })}
        </div>
      </div>

      {/* Add New Holiday Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Add New Holiday</h3>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Holiday Name</label>
                <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Independence Day"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                />
            </div>
            <div className="w-full md:w-auto">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                <input 
                    type="date" 
                    value={newDate} 
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                />
            </div>
            <div className="w-full md:w-auto">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                <select 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                    <option value="Public">Public</option>
                    <option value="Company">Company</option>
                    <option value="Optional">Optional</option>
                </select>
            </div>
            <button 
                type="submit"
                className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2"
            >
                <Plus size={16} /> Add
            </button>
        </form>
      </div>

      {/* Holiday List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Holiday Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {sortedHolidays.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No holidays added yet.</td>
                    </tr>
                ) : (
                    sortedHolidays.map((holiday) => (
                        <tr key={holiday.id} className="hover:bg-gray-50/50">
                             <td className="px-6 py-3 font-medium text-gray-900">{formatDate(holiday.date)}</td>
                             <td className="px-6 py-3 text-gray-700">{holiday.name}</td>
                             <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                    holiday.type === 'Public' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    holiday.type === 'Company' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                    {holiday.type}
                                </span>
                             </td>
                             <td className="px-6 py-3 text-right">
                                <button 
                                    onClick={() => deleteHoliday(holiday.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

    </div>
  );
}
