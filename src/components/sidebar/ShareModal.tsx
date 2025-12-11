import React from "react";
import { Share2, Copy, X, Check } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    shareUrl: string;
    copied: boolean;
    onClose: () => void;
    onCopy: () => void;
}

export default function ShareModal({
    isOpen,
    shareUrl,
    copied,
    onClose,
    onCopy
}: ShareModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 shadow-2xl max-w-md w-full relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-full text-purple-400">
                        <Share2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Share Project</h3>
                        <p className="text-gray-400 text-sm">Anyone with this link can view this project.</p>
                    </div>
                </div>

                <div className="relative mb-6">
                    <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        onClick={(e) => e.currentTarget.select()}
                        className="w-full bg-black/50 border border-gray-700 rounded-lg py-3 px-4 pr-12 text-gray-300 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                        onClick={onCopy}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'hover:bg-gray-700 text-gray-400 hover:text-white'
                            }`}
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
