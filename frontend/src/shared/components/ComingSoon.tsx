import { SvgIconComponent } from "@mui/icons-material";
import BuildIcon from "@mui/icons-material/Build";

interface ComingSoonProps {
    title: string;
    description?: string;
    Icon?: SvgIconComponent;
}

export function ComingSoon({ title, description, Icon = BuildIcon }: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center h-72 text-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                <Icon sx={{ fontSize: 32 }} className="text-blue-500 dark:text-blue-400" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {description ?? "Módulo en construcción — próximamente disponible."}
                </p>
            </div>
        </div>
    );
}
