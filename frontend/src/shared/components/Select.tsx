"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    disabled?: boolean;
    size?: "sm" | "md";
    className?: string;
}

/** Dispara el efecto ripple sobre el elemento clicado */
function fireRipple(e: React.MouseEvent<HTMLElement>, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const diameter = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - diameter / 2;
    const y = e.clientY - rect.top - diameter / 2;

    const wave = document.createElement("span");
    wave.className = "ripple-wave";
    wave.style.cssText = `width:${diameter}px;height:${diameter}px;left:${x}px;top:${y}px`;
    el.appendChild(wave);
    wave.addEventListener("animationend", () => wave.remove(), { once: true });
}

interface DropdownPos { top: number; left: number; width: number; }

export function Select({ value, onChange, options, disabled = false, size = "md", className = "" }: SelectProps) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);

    const selected = options.find((o) => o.value === value);

    // Calcular posición del dropdown en coordenadas de ventana
    useLayoutEffect(() => {
        if (!open || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
        });
    }, [open]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                // También comprobar si el clic fue dentro del dropdown portal
                const portal = document.getElementById("select-portal-active");
                if (portal && portal.contains(e.target as Node)) return;
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Cerrar con Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    // Cerrar al hacer scroll
    useEffect(() => {
        if (!open) return;
        const handler = () => setOpen(false);
        window.addEventListener("scroll", handler, true);
        return () => window.removeEventListener("scroll", handler, true);
    }, [open]);

    const handleTrigger = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        fireRipple(e, e.currentTarget);
        setOpen((v) => !v);
    };

    const handleSelect = (e: React.MouseEvent<HTMLDivElement>, optValue: string) => {
        fireRipple(e, e.currentTarget);
        onChange(optValue);
        setOpen(false);
    };

    /* ── estilos por tamaño ── */
    const triggerSm = "h-7 px-2.5 text-xs gap-1 rounded-md";
    const triggerMd = "h-10 px-4 text-sm gap-2 rounded-xl";
    const optionSm  = "px-3 py-1.5 text-xs";
    const optionMd  = "px-4 py-2.5 text-sm";

    const dropdown = open ? (
        <div
            id="select-portal-active"
            style={{ position: "absolute", top: pos.top, left: pos.left, minWidth: pos.width, zIndex: 9999 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden"
        >
            {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                    <div
                        key={opt.value}
                        onClick={(e) => handleSelect(e, opt.value)}
                        className={[
                            "ripple relative flex items-center cursor-pointer transition-colors select-none",
                            size === "sm" ? optionSm : optionMd,
                            isActive
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50",
                        ].join(" ")}
                    >
                        {opt.label}
                    </div>
                );
            })}
        </div>
    ) : null;

    return (
        <div className={`relative ${className}`}>
            {/* Trigger */}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleTrigger}
                disabled={disabled}
                className={[
                    "ripple w-full flex items-center justify-between border transition-all",
                    "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
                    "text-gray-900 dark:text-white",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    size === "sm" ? triggerSm : triggerMd,
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                ].join(" ")}
            >
                <span className={size === "sm" ? "text-gray-700 dark:text-gray-300" : ""}>
                    {selected?.label ?? "Seleccionar"}
                </span>
                <KeyboardArrowDownIcon
                    sx={{ fontSize: size === "sm" ? 16 : 18 }}
                    className={[
                        "text-gray-400 flex-shrink-0 transition-transform duration-200",
                        open ? "rotate-180" : "",
                    ].join(" ")}
                />
            </button>

            {/* Dropdown renderizado en portal para escapar de overflow-hidden */}
            {typeof document !== "undefined" && createPortal(dropdown, document.body)}
        </div>
    );
}
