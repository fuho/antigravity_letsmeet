"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDebug, RequestNode } from "./DebugContext";
import { useStore } from "@/store/useStore";
import { ChevronDown, ChevronUp, Trash2, Activity, Terminal, Database, ChevronRight } from "lucide-react";

export default function DebugOverlay() {
    if (process.env.NEXT_PUBLIC_DEBUG !== "true") return null;
    return <DebugOverlayContent />;
}

function DebugOverlayContent() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"requests" | "logs" | "state">("requests");
    const { requestTree, logs, clearLogs, clearRequests, requestCountTotal } = useDebug();
    const storeState = useStore();

    // --- Animation State ---
    const [requestFlash, setRequestFlash] = useState(false);
    const [logFlash, setLogFlash] = useState(false);

    // Track previous values to trigger flash
    const prevRequestCount = useRef(requestCountTotal);
    const prevLogCount = useRef(logs.length);

    // Resizable Height state (default to 60vh ~ 400px or so, lets say 400)
    const [height, setHeight] = useState(400);

    useEffect(() => {
        if (requestCountTotal > prevRequestCount.current) {
            setRequestFlash(true);
            const timer = setTimeout(() => setRequestFlash(false), 800);
            return () => clearTimeout(timer);
        }
        prevRequestCount.current = requestCountTotal;
    }, [requestCountTotal]);

    useEffect(() => {
        if (logs.length > prevLogCount.current) {
            setLogFlash(true);
            const timer = setTimeout(() => setLogFlash(false), 800);
            return () => clearTimeout(timer);
        }
        prevLogCount.current = logs.length;
    }, [logs.length]);

    return (
        <>
            {/* Top-Left Toggle & Summary (Visible when closed, merged into header when open? No, requirements say handle stays.) */}
            {/* Requirement: "handle ... should be all the way in the left top corner and stay there" */}
            <div className={`fixed top-0 left-0 z-[60] flex items-center bg-black/90 text-white rounded-br-lg border-b border-r border-gray-800 shadow-xl overflow-hidden transition-all duration-300 ${isOpen ? 'w-full rounded-none border-b-green-900/50' : 'w-auto'}`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex flex-col items-center justify-center w-12 h-12 hover:bg-white/10 transition-colors border-r border-gray-800"
                >
                    <div className="font-black text-[10px] tracking-widest text-green-500">DBG</div>
                    {isOpen ? <ChevronUp size={14} className="mt-1 text-gray-400" /> : <ChevronDown size={14} className="mt-1 text-gray-400" />}
                </button>

                {/* Summaries (Tabs when open, minimized stats when closed?) */}
                {/* Requirement: "In closed state it should show the tab names... summaries should be tab labels" */}
                <div className="flex px-2 space-x-1">
                    <TabButton
                        active={activeTab === "requests"}
                        onClick={() => { setActiveTab("requests"); if (!isOpen) setIsOpen(true); }}
                        label={`REQ: ${requestCountTotal}`}
                        flash={requestFlash}
                        icon={<Activity size={12} />}
                    />
                    <TabButton
                        active={activeTab === "logs"}
                        onClick={() => { setActiveTab("logs"); if (!isOpen) setIsOpen(true); }}
                        label={`LOG: ${logs.length}`}
                        flash={logFlash}
                        icon={<Terminal size={12} />}
                    />
                    <TabButton
                        active={activeTab === "state"}
                        onClick={() => { setActiveTab("state"); if (!isOpen) setIsOpen(true); }}
                        label="STATE"
                        icon={<Database size={12} />}
                    />
                </div>

                {isOpen && (
                    <div className="ml-auto flex items-center px-4">
                        <button
                            onClick={() => {
                                if (activeTab === "logs") clearLogs();
                                if (activeTab === "requests") clearRequests();
                            }}
                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                            title="Clear Current Tab"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Overlay */}
            <div
                className={`fixed top-12 left-0 right-0 bg-black/60 backdrop-blur-sm z-[55] transition-transform duration-300 ease-in-out border-b border-green-500/20 shadow-2xl flex flex-col ${isOpen ? "translate-y-0" : "-translate-y-[150%]" // Move up out of view
                    }`}
                style={{ height: height }}
            >
                <div className="flex-1 overflow-auto p-4 custom-scrollbar font-mono text-xs">

                    {activeTab === "requests" && (
                        <div className="space-y-1">
                            <RequestTreeView node={requestTree} label="Requests" isRoot />
                        </div>
                    )}

                    {activeTab === "logs" && (
                        <div className="space-y-1">
                            {logs.length === 0 && <div className="text-gray-500 italic">No logs captured.</div>}
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
                        <pre className="text-blue-300 whitespace-pre-wrap">
                            {JSON.stringify(storeState, (key, value) => (typeof value === 'function' ? '[Function]' : value), 2)}
                        </pre>
                    )}
                </div>

                {/* Resize Handle */}
                <div
                    className="h-2 w-full bg-green-500/10 hover:bg-green-500/30 cursor-ns-resize flex items-center justify-center transition-colors"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const startY = e.clientY;
                        const startHeight = height;

                        const handleMouseMove = (mm: MouseEvent) => {
                            const newHeight = startHeight + (mm.clientY - startY);
                            // Min height 100px, Max height 90vh
                            setHeight(Math.max(100, Math.min(window.innerHeight * 0.9, newHeight)));
                        };

                        const handleMouseUp = () => {
                            window.removeEventListener('mousemove', handleMouseMove);
                            window.removeEventListener('mouseup', handleMouseUp);
                        };

                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                    }}
                >
                    <div className="w-10 h-1 bg-green-500/20 rounded-full" />
                </div>
            </div>
        </>
    );
}

// Recursive Tree Component
function RequestTreeView({ node, label, isRoot = false }: { node: RequestNode, label: string, isRoot?: boolean }) {
    const [expanded, setExpanded] = useState(isRoot); // Expand root by default?
    const childrenKeys = Object.keys(node.children).sort();
    const hasChildren = childrenKeys.length > 0;

    // Animation for count changes
    const [flash, setFlash] = useState(false);
    const prevCount = useRef(node.count);

    useEffect(() => {
        if (node.count > prevCount.current) {
            setFlash(true);
            const timer = setTimeout(() => setFlash(false), 800);
            return () => clearTimeout(timer);
        }
        prevCount.current = node.count;
    }, [node.count]);

    // Don't render "root" wrapper if purely virtual, but for now we follow structure
    // If it's root, we just render children
    if (isRoot) {
        if (!hasChildren) return <div className="text-gray-500 italic">No requests captured yet.</div>;
        return (
            <div className="pl-0">
                {childrenKeys.map(key => (
                    <RequestTreeView key={key} node={node.children[key]} label={key} />
                ))}
            </div>
        );
    }

    return (
        <div className="ml-2 border-l border-gray-800/50 pl-2">
            <div
                className="flex items-center cursor-pointer hover:bg-white/5 py-0.5 rounded select-none group"
                onClick={() => setExpanded(!expanded)}
            >
                <div className={`w-4 h-4 flex items-center justify-center mr-1 transition-transform ${expanded ? 'rotate-90' : ''}`}>
                    {hasChildren ? <ChevronRight size={12} className="text-gray-500 group-hover:text-gray-300" /> : <div className="w-1 h-1 bg-gray-700 rounded-full" />}
                </div>

                <span className={`font-bold mr-2 text-right tabular-nums min-w-[24px] transition-all duration-300 ${flash ? 'text-green-400 scale-125' :
                    node.count > 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                    {node.count}
                </span>

                <span className={hasChildren ? "text-gray-200" : "text-gray-400"}>
                    {label}
                </span>
            </div>

            {expanded && hasChildren && (
                <div className="animate-in slide-in-from-left-1 duration-100">
                    {childrenKeys.map(key => (
                        <RequestTreeView key={key} node={node.children[key]} label={key} />
                    ))}
                </div>
            )}
        </div>
    );
}

function TabButton({ active, onClick, icon, label, flash }: { active: boolean, onClick: () => void, icon?: React.ReactNode, label: string, flash?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-3 py-2 rounded text-xs font-bold transition-all duration-300 ${flash ? "bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.6)]" :
                active
                    ? 'bg-green-900/40 text-green-300 border border-green-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
        >
            {icon && <span className={flash ? "text-black" : ""}>{icon}</span>}
            <span>{label}</span>
        </button>
    );
}
