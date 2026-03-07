"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: "text-red-500 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    button: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: "text-amber-500 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    icon: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
  },
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}) => {
  const config = variantConfig[variant];

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="max-w-md p-6 lg:p-8"
    >
      <div className="text-center">
        {/* Icon */}
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${config.iconBg}`}
        >
          <AlertTriangle className={`h-7 w-7 ${config.icon}`} />
        </div>

        {/* Title */}
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>

        {/* Message */}
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${config.button}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
