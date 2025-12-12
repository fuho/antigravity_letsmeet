"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useStore } from "@/store/useStore";

interface RequestCounts {
    [url: string]: number;
}

interface LogEntry {
    type: "log" | "warn" | "error";
    args: any[];
    timestamp: number;
}

interface DebugContextType {
    requestCounts: RequestCounts;
    logs: LogEntry[];
    clearLogs: () => void;
    clearRequests: () => void;
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
    const [requestCounts, setRequestCounts] = useState<RequestCounts>({});
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // We use refs to avoid dependency cycles in interceptors
    const requestCountsRef = useRef<RequestCounts>({});

    // Only enable if env var is set
    const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === "true";

    useEffect(() => {
        if (!isDebugEnabled) return;

        // --- Fetch Interceptor ---
        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

            // Parse URL and count segments
            try {
                // Determine base URL if it's relative
                const fullUrl = new URL(url, window.location.origin);
                const segments: string[] = [];

                // 1. Protocol (e.g., "https://")
                segments.push(fullUrl.protocol + "//");

                // 2. Origin (e.g., "https://api.example.com")
                if (fullUrl.origin !== "null") {
                    segments.push(fullUrl.origin);
                }

                // 3. Recursive Path segments
                // e.g. /v2/isochrones/driving -> /v2, /v2/isochrones, /v2/isochrones/driving
                const pathParts = fullUrl.pathname.split('/').filter(p => p);
                let currentPath = fullUrl.origin;
                for (const part of pathParts) {
                    currentPath = `${currentPath}/${part}`;
                    segments.push(currentPath);
                }

                // Also add exact full URL if query params exist (or just to be safe as the leaf)
                if (fullUrl.href !== currentPath) {
                    segments.push(fullUrl.href);
                }

                // Update counts
                const newCounts = { ...requestCountsRef.current };
                for (const segment of segments) {
                    newCounts[segment] = (newCounts[segment] || 0) + 1;
                }
                requestCountsRef.current = newCounts;
                setRequestCounts(newCounts); // Trigger re-render

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
        requestCountsRef.current = {};
        setRequestCounts({});
    };

    if (!isDebugEnabled) {
        return <>{children}</>;
    }

    return (
        <DebugContext.Provider value={{ requestCounts, logs, clearLogs, clearRequests }}>
            {children}
        </DebugContext.Provider>
    );
};
