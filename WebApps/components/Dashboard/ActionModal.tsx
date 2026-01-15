"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "danger" | "success" | "info" | "warning";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (data?: string) => void | Promise<void>;
  inputRequired?: boolean;
  showInput?: boolean;
  inputPlaceholder?: string;
  isLoading?: boolean;
}

export default function ActionModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  inputRequired = false,
  showInput = false, // New prop
  inputPlaceholder = "",
  isLoading = false,
}: ActionModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive effective visibility
  const shouldShowInput = showInput || inputRequired;

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (inputRequired && !inputValue.trim()) {
      return; // Prevent empty input if required
    }

    setIsSubmitting(true);
    try {
      await onConfirm(shouldShowInput ? inputValue : undefined);
      onClose();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  // ...
  // In render:
  // Change inputRequired && to shouldShowInput &&

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 ring-red-300";
      case "success":
        return "bg-green-600 hover:bg-green-700 ring-green-300";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 ring-yellow-300";
      default:
        return "bg-blue-600 hover:bg-blue-700 ring-blue-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-gray-500/75 transition-opacity"
        onClick={onClose}
      />

      <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div
              className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                type === "danger"
                  ? "bg-red-100"
                  : type === "success"
                  ? "bg-green-100"
                  : type === "warning"
                  ? "bg-yellow-100"
                  : "bg-blue-100"
              }`}
            >
              {getIcon()}
            </div>

            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>

              {(showInput || inputRequired) && (
                <div className="mt-4">
                  <textarea
                    rows={3}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder={inputPlaceholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:ml-3 sm:w-auto ${getButtonClass()} disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={handleConfirm}
            disabled={isSubmitting || (isLoading && isSubmitting)}
          >
            {isSubmitting ? "Processing..." : confirmLabel}
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
