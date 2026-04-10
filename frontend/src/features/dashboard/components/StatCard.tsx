import { SvgIconComponent } from "@mui/icons-material";

interface StatCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    Icon: SvgIconComponent;
    color?: "blue" | "green" | "yellow" | "red" | "purple";
}

const colorMap = {
    blue:   { bg: "bg-blue-100 dark:bg-blue-900/30",   icon: "text-blue-600 dark:text-blue-400" },
    green:  { bg: "bg-green-100 dark:bg-green-900/30", icon: "text-green-600 dark:text-green-400" },
    yellow: { bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: "text-yellow-600 dark:text-yellow-400" },
    red:    { bg: "bg-red-100 dark:bg-red-900/30",     icon: "text-red-600 dark:text-red-400" },
    purple: { bg: "bg-purple-100 dark:bg-purple-900/30", icon: "text-purple-600 dark:text-purple-400" },
};

export function StatCard({ label, value, subtitle, Icon, color = "blue" }: StatCardProps) {
    const colors = colorMap[color];

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl ${colors.bg}`}>
                <Icon className={colors.icon} sx={{ fontSize: 22 }} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
                {subtitle && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
