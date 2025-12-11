import React from "react";

interface UpdateModalProps {
    isOpen: boolean;
    projectName: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function UpdateModal({
    isOpen,
    projectName,
    onCancel,
    onConfirm
}: UpdateModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 shadow-2xl max-w-md w-full">
                <h3 className="text-lg font-bold text-white mb-2">Update Project?</h3>
                <p className="text-gray-400 text-sm mb-6">
                    This will overwrite the existing project <span className="text-purple-300 font-medium">"{projectName}"</span> with your current changes.
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
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
                    >
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
}
