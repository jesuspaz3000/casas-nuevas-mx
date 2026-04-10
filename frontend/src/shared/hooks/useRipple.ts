"use client";

import { useCallback, useRef } from "react";

export function useRipple<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    const trigger = useCallback((e: React.MouseEvent<T>) => {
        const el = ref.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top  - size / 2;

        const wave = document.createElement("span");
        wave.className = "ripple-wave";
        wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;

        el.appendChild(wave);
        wave.addEventListener("animationend", () => wave.remove());
    }, []);

    return { ref, trigger };
}
