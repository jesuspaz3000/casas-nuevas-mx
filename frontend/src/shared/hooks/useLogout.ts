"use client";

import { useState } from "react";
import { AuthService } from "@/features/auth/services/auth.service";

export function useLogout() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const requestLogout = () => setDialogOpen(true);
    const cancelLogout  = () => setDialogOpen(false);

    const confirmLogout = async () => {
        setLoading(true);
        try {
            await AuthService.logout();
            window.location.href = "/login";
        } finally {
            setLoading(false);
            setDialogOpen(false);
        }
    };

    return { dialogOpen, loading, requestLogout, cancelLogout, confirmLogout };
}
