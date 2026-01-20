"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div
      className={`relative ${className}`}
      ref={containerRef}
    >
      {/* Trigger Button */}
      <div
        className={`w-full px-3 py-2 text-left bg-white border rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
          disabled
            ? "bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200"
            : isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            } else {
              setSearch(""); // Reset search on close? Optional.
            }
          }
        }}
      >
        <span
          className={`block truncate ${
            !selectedOption ? "text-gray-500" : "text-gray-900"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
            {selectedOption && !disabled && (
                <div onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                }} className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={14} />
                </div>
            )}
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50 sticky top-0">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-center text-gray-500">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-indigo-50 transition-colors ${
                    value === option.value
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check size={14} className="text-indigo-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
