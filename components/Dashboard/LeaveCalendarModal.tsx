"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

interface LeaveCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
}

export default function LeaveCalendarModal({
  isOpen,
  onClose,
  startDate,
  endDate,
}: LeaveCalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (isOpen && startDate) {
      setCurrentMonth(parseISO(startDate));
    }
  }, [isOpen, startDate]);

  if (!isOpen) return null;

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding for the first day of the month
  const startDayOfWeek = getDay(monthStart); // 0 (Sun) - 6 (Sat)
  const paddingDays = Array.from({ length: startDayOfWeek });

  const isSelected = (date: Date) => {
    return isWithinInterval(date, { start, end });
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
          <h3 className="font-bold text-gray-900">Leave Duration</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Calendar Nav */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-lg font-bold text-gray-800">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="text-xs font-bold text-gray-400 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {daysInMonth.map((day) => {
              const selected = isSelected(day);
              const isStart = isSameDay(day, start);
              const isEnd = isSameDay(day, end);
              const isCurrent = isToday(day);

              let bgClass = "bg-transparent";
              let textClass = "text-gray-700";

              if (selected) {
                bgClass = "bg-indigo-100";
                textClass = "text-indigo-700 font-medium";
                if (isStart) {
                  bgClass = "bg-indigo-600 text-white rounded-l-md shadow-sm";
                  textClass = "text-white font-bold";
                }
                if (isEnd) {
                  bgClass = "bg-indigo-600 text-white rounded-r-md shadow-sm";
                  textClass = "text-white font-bold";
                }
                if (isStart && isEnd) {
                  bgClass = "bg-indigo-600 text-white rounded-md shadow-sm";
                }
              } else if (isCurrent) {
                textClass =
                  "text-indigo-600 font-bold bg-indigo-50 rounded-full";
              }

              return (
                <div
                  key={day.toISOString()}
                  className={`h-10 flex items-center justify-center text-sm transition-all relative ${bgClass} ${textClass} ${
                    !selected && !isCurrent
                      ? "hover:bg-gray-50 rounded-full"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-500">
            Selected:{" "}
            <span className="font-medium text-gray-900">
              {format(start, "MMM do")}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-900">
              {format(end, "MMM do, yyyy")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
