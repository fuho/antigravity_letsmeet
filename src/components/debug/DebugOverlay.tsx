"use client";

import React, { useState } from "react";
import { useDebug } from "./DebugContext";
import { useStore } from "@/store/useStore";
import { ChevronDown, ChevronUp, Trash2, Activity, Terminal, Database } from "lucide-react";

export default function DebugOverlay() {
    // Hidden if env var not set (hook handles it, but component needs conditional render too check logic)
    // Actually the Provider just renders children if disabled.
    // So we can check generic env var here or just rely on context not throwing? 
    // The hook throws if not in provider. Let's assume it's safe if env is checked.
    if (process.env.NEXT_PUBLIC_DEBUG !== "true") return null;

    return <DebugOverlayContent />;
}

function DebugOverlayContent() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"requests" | "logs" | "state">("requests");
    const { requestCounts, logs, clearLogs, clearRequests } = useDebug();
    const storeState = useStore();

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out font-mono ${isOpen ? "translate-y-0" : "-translate-y-[calc(100%-24px)]"
                }`}
            style={{ height: "60vh" }} // occupies 60% of screen when open
        >
            {/* Main Panel Background */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md border-b-2 border-green-500/50 text-green-400 shadow-2xl flex flex-col">

                {/* Header / Tabs */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-green-900/50 bg-black/50">
                    <div className="flex space-x-4">
                        <TabButton
                            active={activeTab === "requests"}
                            onClick={() => setActiveTab("requests")}
                            icon={<Activity size={14} />}
                            label={`Requests (${Object.keys(requestCounts).length})`}
                        />
                        <TabButton
                            active={activeTab === "logs"}
                            onClick={() => setActiveTab("logs")}
                            icon={<Terminal size={14} />}
                            label={`Logs (${logs.length})`}
                        />
                        <TabButton
                            active={activeTab === "state"}
                            onClick={() => setActiveTab("state")}
                            icon={<Database size={14} />}
                            label="State"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                                if (activeTab === "logs") clearLogs();
                                if (activeTab === "requests") clearRequests();
                            }}
                            className="p-1 hover:text-red-400 transition-colors"
                            title="Clear"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {activeTab === "requests" && (
                        <div className="space-y-1 text-xs">
                            {/* Sort by count descending */}
                            {Object.entries(requestCounts)
                                .sort(([, a], [, b]) => b - a)
                                .map(([url, count]) => (
                                    <div key={url} className="flex items-start hover:bg-white/5 p-1 rounded">
                                        <span className={`font-bold mr-3 w-8 text-right ${count > 10 ? 'text-red-500' : 'text-green-500'}`}>
                                            {count}
                                        </span>
                                        <span className="break-all">{url}</span>
                                    </div>
                                ))}
                            {Object.keys(requestCounts).length === 0 && (
                                <div className="text-gray-500 italic">No requests captured yet.</div>
                            )}
                        </div>
                    )}

                    {activeTab === "logs" && (
                        <div className="space-y-1 text-xs font-mono">
                            {logs.map((log, i) => (
                                <div key={i} className={`flex ${log.type === 'error' ? 'text-red-400' :
                                        log.type === 'warn' ? 'text-yellow-400' : 'text-gray-300'
                                    } border-b border-gray-800/50 pb-1 mb-1`}>
                                    <span className="text-gray-600 mr-2 shrink-0">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                    <div className="break-all whitespace-pre-wrap">
                                        {log.args.map(arg =>
                                            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                                        ).join(' ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "state" && (
                        <pre className="text-xs text-blue-300 whitespace-pre-wrap">
                            {JSON.stringify(
                                {
                                    ...storeState,
                                    // Exclude complex objects if needed, or functions
                                    // Functions usually don't serialize, so JSON.stringify is fine
                                },
                                (key, value) => {
                                    if (typeof value === 'function') return '[Function]';
                                    return value;
                                },
                                2
                            )}
                        </pre>
                    )}
                </div>

                {/* Pull Handle */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/90 border-b-2 border-r-2 border-l-2 border-green-500/50 rounded-b-lg flex items-center justify-center cursor-pointer hover:bg-green-900/20 transition-colors shadow-lg"
                >
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span className="ml-2 text-[10px] tracking-widest uppercase font-bold">Debug</span>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-3 py-1 rounded text-xs font-bold transition-all ${active
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
