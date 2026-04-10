"use client";

import { ButtonHTMLAttributes } from "react";
import { useRipple } from "@/shared/hooks/useRipple";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
    loading?: boolean;
    loadingText?: string;
}

const variantClasses: Record<Variant, string> = {
    primary:   "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:shadow-md hover:shadow-blue-200 dark:hover:shadow-blue-900 disabled:bg-blue-400",
    secondary: "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50",
    danger:    "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white hover:shadow-md hover:shadow-red-200 dark:hover:shadow-red-900 disabled:bg-red-400",
    ghost:     "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
};

export function Button({
    variant = "primary",
    size = "md",
    className = "",
    fullWidth = false,
    loading = false,
    loadingText,
    disabled,
    children,
    onClick,
    ...props
}: ButtonProps) {
    const { ref, trigger } = useRipple<HTMLButtonElement>();

    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            onClick={(e) => { trigger(e); onClick?.(e); }}
            {...props}
            className={[
                "ripple relative inline-flex items-center justify-center font-medium rounded-lg",
                "active:scale-[0.98] transition-all duration-200 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed",
                variantClasses[variant],
                sizeClasses[size],
                fullWidth ? "w-full" : "",
                className,
            ].join(" ")}
        >
            {loading ? (
                <>
                    <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {loadingText ?? children}
                </>
            ) : children}
        </button>
    );
}
