"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Footer } from "./footer";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar
                open={sidebarOpen}
                collapsed={collapsed}
                onClose={() => setSidebarOpen(false)}
                onToggleCollapse={() => setCollapsed((v) => !v)}
            />
            <div className="flex flex-col flex-1 min-w-0">
                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    onToggleCollapse={() => setCollapsed((v) => !v)}
                    collapsed={collapsed}
                />
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}
