"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { axisClasses } from "@mui/x-charts/ChartsAxis";
import { legendClasses } from "@mui/x-charts/ChartsLegend";
import type { MonthlyChartPoint } from "@/features/dashboard/types/dashboard.types";
import { useIsDarkMode } from "@/shared/hooks/useIsDarkMode";

/** Tras soltar el sidebar la transición CSS suele durar ~200–300ms; un debounce evita re-render del chart en cada frame. */
const CHART_CONTAINER_RESIZE_DEBOUNCE_MS = 160;

function useContainerWidth() {
    const [width, setWidth] = useState<number>(0);
    const observerRef = useRef<ResizeObserver | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Callback ref: se dispara cuando el nodo monta/desmonta,
    // incluso si el div está condicionalmente renderizado.
    const ref = useCallback((node: HTMLDivElement | null) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        if (!node) return;
        const initial = node.getBoundingClientRect().width;
        if (initial > 0) setWidth(initial);

        observerRef.current = new ResizeObserver(([entry]) => {
            const w = entry.contentRect.width;
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                debounceTimerRef.current = null;
                if (w > 0) setWidth(w);
            }, CHART_CONTAINER_RESIZE_DEBOUNCE_MS);
        });
        observerRef.current.observe(node);
    }, []);

    useEffect(
        () => () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            observerRef.current?.disconnect();
        },
        []
    );

    return { ref, width };
}

interface Props {
    data: MonthlyChartPoint[];
    isLoading: boolean;
}

function ChartSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 h-[300px] animate-pulse">
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-40 mb-4" />
            <div className="h-[220px] bg-gray-50 dark:bg-gray-800/50 rounded-xl" />
        </div>
    );
}

/** Ejes y leyenda leen `palette` desde `useTheme()`; sin ThemeProvider MUI queda en modo claro y el texto sale oscuro sobre fondo oscuro de Tailwind. */
function useChartsMuiTheme(isDark: boolean) {
    return useMemo(
        () =>
            createTheme({
                palette: {
                    mode: isDark ? "dark" : "light",
                    ...(isDark
                        ? {
                              background: { default: "#111827", paper: "#111827" },
                              divider: "#374151",
                          }
                        : {
                              background: { default: "#ffffff", paper: "#ffffff" },
                          }),
                },
            }),
        [isDark]
    );
}

function chartAxisSx(theme: Theme) {
    const line = theme.palette.mode === "dark" ? "#9ca3af" : "#6b7280";
    const text = theme.palette.text.primary;
    return {
        width: "100%",
        [`& .${axisClasses.tickLabel}`]: { fill: text },
        [`& .${axisClasses.label}`]: { fill: text },
        [`& .${axisClasses.line}`]: { stroke: line },
        [`& .${axisClasses.tick}`]: { stroke: line },
        [`& .${legendClasses.label}`]: { fill: text },
    } as const;
}

export function DashboardCharts({ data, isLoading }: Props) {
    const isDark = useIsDarkMode();
    const muiTheme = useChartsMuiTheme(isDark);
    const chartThemeMode = isDark ? "dark" : "light";

    const { ref: barRef, width: barWidth } = useContainerWidth();
    const { ref: lineRef, width: lineWidth } = useContainerWidth();

    const isMobile = barWidth < 500;
    const isTablet = barWidth >= 500 && barWidth < 700;

    const barMargin = isMobile
        ? { left: 0,  right: 4,  top: 32, bottom: 30 }
        : isTablet
        ? { left: 20, right: 8,  top: 32, bottom: 30 }
        : { left: 40, right: 16, top: 8,  bottom: 36 };

    const lineMargin = isMobile
        ? { left: 0,  right: 4,  top: 32, bottom: 30 }
        : isTablet
        ? { left: 30, right: 8,  top: 32, bottom: 30 }
        : { left: 52, right: 16, top: 8,  bottom: 36 };

    const dataset = data.map((d) => ({
        label: d.label,
        signedContracts: d.signedContracts,
        revenue: Number(d.revenue),
    }));

    return (
        <section>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                Tendencia (últimos 6 meses)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {isLoading ? (
                    <>
                        <ChartSkeleton />
                        <ChartSkeleton />
                    </>
                ) : (
                    <ThemeProvider theme={muiTheme}>
                        <>
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                    Contratos firmados
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Por mes: cierre de contrato firmado (fecha de actualización) o propiedad marcada vendida sin contrato firmado
                                </p>
                                <div ref={barRef} className="w-full min-w-0 overflow-hidden">
                                    {barWidth > 0 && <BarChart
                                        theme={chartThemeMode}
                                        dataset={dataset}
                                        xAxis={[{ scaleType: "band", dataKey: "label" }]}
                                        series={[
                                            {
                                                dataKey: "signedContracts",
                                                label: "Firmados",
                                                color: "#3b82f6",
                                            },
                                        ]}
                                        width={barWidth}
                                        height={260}
                                        margin={barMargin}
                                        sx={(t) => chartAxisSx(t)}
                                    />}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                    Ingresos por mes
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Suma del monto de cierre (contrato: venta o reserva; catálogo: precio de propiedad vendida sin contrato) en MXN
                                </p>
                                <div ref={lineRef} className="w-full min-w-0 overflow-hidden">
                                    {lineWidth > 0 && <LineChart
                                        theme={chartThemeMode}
                                        dataset={dataset}
                                        xAxis={[{ scaleType: "band", dataKey: "label" }]}
                                        series={[
                                            {
                                                dataKey: "revenue",
                                                label: "MXN",
                                                color: "#22c55e",
                                                showMark: true,
                                                curve: "linear",
                                            },
                                        ]}
                                        width={lineWidth}
                                        height={260}
                                        margin={lineMargin}
                                        sx={(t) => chartAxisSx(t)}
                                    />}
                                </div>
                            </div>
                        </>
                    </ThemeProvider>
                )}
            </div>
        </section>
    );
}
