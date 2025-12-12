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

    useEffect(() => {
        if (!isDebugEnabled) return;

        // --- Fetch Interceptor ---
        const originalInfo = console.info;
        // We aren't intercepting console.info but original fetch...

        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

            try {
                const fullUrl = new URL(url, window.location.origin);

                // Parse segments: Protocol -> Host -> Path parts...
                const segments: string[] = [];
                segments.push(fullUrl.protocol); // "https:"
                segments.push(fullUrl.host);     // "api.mapbox.com"

                // Path parts
                const pathParts = fullUrl.pathname.split('/').filter(p => p);
                segments.push(...pathParts);

                // Update Tree
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

                // Create a deep copy or just mutate and set new reference? 
                // Mutating ref and then triggering update is safer for concurrent requests
                // But we need to be careful about state immutability for React.
                // For debug overlay, full deep clone on every request might be expensive if tree is huge.
                // Let's try to be somewhat immutable or just use force update pattern via requestCountTotal.

                const currentRoot = requestTreeRef.current;
                // Mutate the ref's tree directly
                updateNode(currentRoot, 0);

                // Update state to trigger render
                setRequestTree({ ...currentRoot });
                setRequestCountTotal(prev => prev + 1);

            } catch (e) {
                console.error("Failed to parse URL for debug stats", e);
            }

            return originalFetch(input, init);
        };

        // --- Console Interceptor ---
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const addLog = (type: "log" | "warn" | "error", args: any[]) => {
            setLogs(prev => [...prev.slice(-99), { type, args, timestamp: Date.now() }]);
        };

        console.log = (...args) => {
            addLog("log", args);
            originalLog(...args);
        };
        console.warn = (...args) => {
            addLog("warn", args);
            originalWarn(...args);
        };
        console.error = (...args) => {
            addLog("error", args);
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
