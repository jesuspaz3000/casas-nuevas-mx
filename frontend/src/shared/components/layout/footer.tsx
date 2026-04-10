export function Footer() {
    return (
        <footer className="flex items-center justify-center px-6 h-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} Casas Nuevas MX · Desarrollado por The Yisus
            </p>
        </footer>
    );
}
