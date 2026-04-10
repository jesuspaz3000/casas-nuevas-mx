"use client";

import { useEffect, useState } from "react";
import { useRipple } from "@/shared/hooks/useRipple";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);
    const { ref, trigger } = useRipple<HTMLButtonElement>();

    useEffect(() => {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("theme-mode="))
            ?.split("=")[1];
        const dark = cookie ? cookie === "dark" : true;
        setIsDark(dark);
        applyTheme(dark);
    }, []);

    const applyTheme = (dark: boolean) => {
        if (dark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        document.cookie = `theme-mode=${dark ? "dark" : "light"}; path=/; max-age=31536000`;
    };

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        applyTheme(next);
    };

    return (
        <button
            ref={ref}
            onClick={(e) => { trigger(e); toggle(); }}
            aria-label="Cambiar tema"
            className="ripple p-3 rounded-xl text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        >
            {isDark
                ? <LightModeIcon sx={{ fontSize: 24 }} />
                : <DarkModeIcon sx={{ fontSize: 24 }} />
            }
        </button>
    );
}
