"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export function HydrationProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        useAuthStore.persist.rehydrate();
    }, []);

    return <>{children}</>;
}
