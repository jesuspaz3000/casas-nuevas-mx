"use client";

import { ReactNode } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Select } from "@/shared/components/Select";

export interface Column<T> {
    key: string;
    header: string;
    headerClassName?: string;
    className?: string;
    render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T extends object> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T) => string;
    isLoading?: boolean;
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    emptyMessage?: string;
    emptyIcon?: ReactNode;
    renderCard?: (row: T, index: number) => ReactNode;
}

function SkeletonRow({ cols }: { cols: number }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </td>
            ))}
        </tr>
    );
}

export function DataTable<T extends object>({
    columns,
    data,
    keyExtractor,
    isLoading = false,
    page,
    totalPages,
    total,
    pageSize,
    pageSizeOptions = [5, 10, 25, 50],
    onPageChange,
    onPageSizeChange,
    emptyMessage = "No hay registros",
    emptyIcon,
    renderCard,
}: DataTableProps<T>) {
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    const navBtn = (disabled: boolean, onClick: () => void, icon: ReactNode) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={[
                "flex items-center justify-center w-7 h-7 rounded transition-colors",
                disabled
                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
            ].join(" ")}
        >
            {icon}
        </button>
    );

    const pagination = (
        <div className="flex items-center justify-end gap-4 px-4 py-2.5 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
                <span>Filas:</span>
                <Select
                    size="sm"
                    value={String(pageSize)}
                    onChange={(v) => onPageSizeChange?.(Number(v))}
                    disabled={!onPageSizeChange}
                    options={pageSizeOptions.map((s) => ({ value: String(s), label: String(s) }))}
                />
            </div>
            <span className="tabular-nums">
                {total === 0 ? "0–0 de 0" : `${from}–${to} de ${total}`}
            </span>
            <div className="flex items-center gap-0.5">
                {navBtn(page === 1 || isLoading, () => onPageChange(page - 1), <ChevronLeftIcon sx={{ fontSize: 18 }} />)}
                {navBtn(page === totalPages || isLoading || total === 0, () => onPageChange(page + 1), <ChevronRightIcon sx={{ fontSize: 18 }} />)}
            </div>
        </div>
    );

    const empty = (
        <div className="py-16 text-center bg-white dark:bg-gray-900">
            <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-600">
                {emptyIcon && <div className="opacity-40">{emptyIcon}</div>}
                <p className="text-sm">{emptyMessage}</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

            {/* ── Vista tarjetas — móvil y tablet (cuando se provee renderCard) ── */}
            {renderCard && (
                <div className="lg:hidden">
                    {isLoading ? (
                        <div className="bg-white dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-4 animate-pulse flex gap-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />
                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : data.length === 0 ? empty : (
                        <div className="bg-white dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                            {data.map((row, index) => (
                                <div key={keyExtractor(row)} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {renderCard(row, index)}
                                </div>
                            ))}
                        </div>
                    )}
                    {pagination}
                </div>
            )}

            {/* ── Vista tabla — solo desktop lg+ (siempre si no hay renderCard) ── */}
            <div className={renderCard ? "hidden lg:flex lg:flex-col" : "flex flex-col"}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={[
                                            "px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap",
                                            col.headerClassName ?? "",
                                        ].join(" ")}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                            {isLoading ? (
                                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                                    <SkeletonRow key={i} cols={columns.length} />
                                ))
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length}>{empty}</td>
                                </tr>
                            ) : (
                                data.map((row, index) => (
                                    <tr
                                        key={keyExtractor(row)}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={[
                                                    "px-4 py-3 text-gray-700 dark:text-gray-300",
                                                    col.className ?? "",
                                                ].join(" ")}
                                            >
                                                {col.render(row, index)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {pagination}
            </div>
        </div>
    );
}
