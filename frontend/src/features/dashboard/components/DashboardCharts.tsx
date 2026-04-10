"use client";

import { useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { axisClasses } from "@mui/x-charts/ChartsAxis";
import { legendClasses } from "@mui/x-charts/ChartsLegend";
import type { MonthlyChartPoint } from "@/features/dashboard/types/dashboard.types";
import { useIsDarkMode } from "@/shared/hooks/useIsDarkMode";

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
                                <div className="w-full min-w-0">
                                    <BarChart
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
                                        height={260}
                                        margin={{ left: 40, right: 12, top: 8, bottom: 36 }}
                                        sx={(t) => chartAxisSx(t)}
                                    />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                    Ingresos por mes
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Suma del monto de cierre (contrato: venta o reserva; catálogo: precio de propiedad vendida sin contrato) en MXN
                                </p>
                                <div className="w-full min-w-0">
                                    <LineChart
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
                                        height={260}
                                        margin={{ left: 52, right: 12, top: 8, bottom: 36 }}
                                        sx={(t) => chartAxisSx(t)}
                                    />
                                </div>
                            </div>
                        </>
                    </ThemeProvider>
                )}
            </div>
        </section>
    );
}
