import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { HydrationProvider } from "@/providers/HydrationProvider";

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-roboto',
});

export const metadata: Metadata = {
    title: "Casas Nuevas MX",
    description: "Panel de gestión de propiedades y agentes",
};

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const cookieStore = await cookies();
    const rawMode = cookieStore.get("theme-mode")?.value;
    const initialMode = rawMode === "light" ? "light" : "dark";
    return (
        <html lang="es" className={initialMode}>
            <body className={roboto.variable} suppressHydrationWarning>
                <HydrationProvider>
                    {children}
                </HydrationProvider>
            </body>
        </html>
    );
}
