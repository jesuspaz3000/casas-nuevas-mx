import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/features/auth/types/auth.types";

export interface AuthState {
    user: User | null;
    _hasHydrated: boolean;

    setHasHydrated: (value: boolean) => void;
    setSession: (user: User) => void;
    clearSession: () => void;

    isAdmin: () => boolean;
    isAgent: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            _hasHydrated: false,

            setHasHydrated: (value) => set({ _hasHydrated: value }),

            setSession: (user) => set({ user }),

            clearSession: () => set({ user: null }),

            isAdmin: () => get().user?.role === "ADMIN",
            isAgent: () => get().user?.role === "AGENT",
        }),
        {
            name: "auth-store",
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
            partialize: (state) => ({ user: state.user }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
