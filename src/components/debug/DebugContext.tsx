"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useStore } from "@/store/useStore";

export interface RequestNode {
    count: number;
    children: Record<string, RequestNode>;
}

interface LogEntry {
    type: "log" | "warn" | "error";
    args: any[];
    timestamp: number;
}

interface DebugContextType {
    requestTree: RequestNode;
    logs: LogEntry[];
    clearLogs: () => void;
    clearRequests: () => void;
    // Counter for reactivity (since deep object mutation might not trigger simple equality checks if we're not careful, but we'll return a new root object)
    requestCountTotal: number;
}

const DebugContext = createContext<DebugContextType | null>(null);

export const useDebug = () => {
    const context = useContext(DebugContext);
    if (!context) {
        throw new Error("useDebug must be used within a DebugProvider");
    }
    return context;
};

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Root node for the request tree
    const [requestTree, setRequestTree] = useState<RequestNode>({ count: 0, children: {} });
    const [requestCountTotal, setRequestCountTotal] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // We use refs to avoid dependency cycles in interceptors and keep track of current state
    const requestTreeRef = useRef<RequestNode>({ count: 0, children: {} });

    // Only enable if env var is set
    const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === "true";

    // Batching Refs
    const pendingLogs = useRef<LogEntry[]>([]);
    const pendingRequests = useRef<string[]>([]); // Store URLs to process

    // Flush updates periodically to avoid "update while rendering" and improve perf
    useEffect(() => {
        if (!isDebugEnabled) return;

        const interval = setInterval(() => {
            let hasUpdates = false;

            // Process Logs
            if (pendingLogs.current.length > 0) {
                const newLogs = pendingLogs.current;
                pendingLogs.current = [];
                setLogs(prev => [...prev, ...newLogs].slice(-100)); // Keep last 100
                hasUpdates = true;
            }

            // Process Requests
            if (pendingRequests.current.length > 0) {
                const urls = pendingRequests.current;
                pendingRequests.current = [];

                const currentRoot = requestTreeRef.current; // Work with current tree
                let addedCount = 0;

                urls.forEach(url => {
                    try {
                        const fullUrl = new URL(url, window.location.origin);
                        const segments: string[] = [];
                        segments.push(fullUrl.protocol);
                        segments.push(fullUrl.host);
                        segments.push(...fullUrl.pathname.split('/').filter(p => p));

                        const updateNode = (node: RequestNode, segmentIndex: number) => {
                            node.count++;
                            if (segmentIndex < segments.length) {
                                const segment = segments[segmentIndex];
                                if (!node.children[segment]) {
                                    node.children[segment] = { count: 0, children: {} };
                                }
                                updateNode(node.children[segment], segmentIndex + 1);
                            }
                        };
                        updateNode(currentRoot, 0);
                        addedCount++;
                    } catch (e) {
                        // ignore parse errors
                    }
                });

                if (addedCount > 0) {
                    setRequestTree({ ...currentRoot });
                    setRequestCountTotal(prev => prev + addedCount);
                    hasUpdates = true;
                }
            }

        }, 200); // Flush every 200ms

        return () => clearInterval(interval);
    }, [isDebugEnabled]);

    useEffect(() => {
        if (!isDebugEnabled) return;

        // --- Fetch Interceptor ---
        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
            pendingRequests.current.push(url);
            return originalFetch(input, init);
        };

        // --- Console Interceptor ---
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const queueLog = (type: "log" | "warn" | "error", args: any[]) => {
            pendingLogs.current.push({ type, args, timestamp: Date.now() });
        };

        console.log = (...args) => {
            queueLog("log", args);
            originalLog(...args);
        };
        console.warn = (...args) => {
            queueLog("warn", args);
            originalWarn(...args);
        };
        console.error = (...args) => {
            queueLog("error", args);
            originalError(...args);
        };

        return () => {
            window.fetch = originalFetch;
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        };
    }, [isDebugEnabled]);

    const clearLogs = () => setLogs([]);
    const clearRequests = () => {
        requestTreeRef.current = { count: 0, children: {} };
        setRequestTree({ count: 0, children: {} });
        setRequestCountTotal(0);
    };

    if (!isDebugEnabled) {
        return <>{children}</>;
    }

    return (
        <DebugContext.Provider value={{ requestTree, logs, clearLogs, clearRequests, requestCountTotal }}>
            {children}
        </DebugContext.Provider>
    );
};
