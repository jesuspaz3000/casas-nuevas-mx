"use client";

import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { DashboardCharts } from "@/features/dashboard/components/DashboardCharts";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

function formatMXN(value: number) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(value);
}

function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-start gap-4 shadow-sm animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-24" />
                <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded w-16" />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { stats, isLoading, error } = useDashboard();

    if (error) {
        return (
            <div className="flex items-center justify-center h-48 text-sm text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Resumen general de tu actividad</p>
            </div>

            {/* Totales */}
            <section>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                    Totales
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : stats ? (
                        <>
                            <StatCard label="Propiedades" value={stats.totalProperties} subtitle={`${stats.availableProperties} disponibles`} Icon={HomeWorkIcon} color="blue" />
                            <StatCard label="Vendidas" value={stats.soldProperties} subtitle="propiedades cerradas" Icon={CheckCircleOutlinedIcon} color="green" />
                            <StatCard label="Clientes" value={stats.totalClients} subtitle={`${stats.activeClients} activos`} Icon={PeopleIcon} color="purple" />
                            <StatCard label="Citas" value={stats.totalAppointments} subtitle={`${stats.pendingAppointments} pendientes`} Icon={CalendarMonthIcon} color="yellow" />
                            <StatCard label="Contratos" value={stats.totalContracts} subtitle={`${stats.signedContracts} firmados`} Icon={DescriptionIcon} color="blue" />
                            <StatCard label="Ventas totales" value={formatMXN(stats.totalSalesAmount)} subtitle="en contratos firmados" Icon={AttachMoneyIcon} color="green" />
                        </>
                    ) : null}
                </div>
            </section>

            {/* Mes actual */}
            <section>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                    Este mes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : stats ? (
                        <>
                            <StatCard label="Contratos firmados" value={stats.monthlySignedContracts} Icon={DescriptionIcon} color="blue" />
                            <StatCard label="Ingresos del mes" value={formatMXN(stats.monthlyRevenue)} Icon={AttachMoneyIcon} color="green" />
                            <StatCard label="Nuevos clientes" value={stats.monthlyNewClients} Icon={PersonAddIcon} color="purple" />
                            <StatCard label="Citas agendadas" value={stats.monthlyAppointments} Icon={HourglassEmptyIcon} color="yellow" />
                        </>
                    ) : null}
                </div>
            </section>

            <DashboardCharts data={stats?.monthlySeries ?? []} isLoading={isLoading} />
        </div>
    );
}
