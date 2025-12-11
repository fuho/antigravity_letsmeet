import React from "react";

interface DeleteModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function DeleteModal({ isOpen, onCancel, onConfirm }: DeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-2xl max-w-sm w-full">
                <h3 className="text-lg font-bold text-white mb-2">Remove Location?</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Are you sure you want to remove this location from your project?
                </p>
                <div className="flex space-x-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}
