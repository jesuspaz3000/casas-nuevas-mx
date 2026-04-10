/**
 * Rutas guardadas en BD: `/uploads/...` (relativas al contexto de Spring).
 * Con `server.servlet.context-path: /api` la URL pública es
 * `{NEXT_PUBLIC_APP_URL}/uploads/...`, p. ej. `http://localhost:8080/api/uploads/...`.
 *
 * `NEXT_PUBLIC_APP_URL` debe coincidir con el `baseURL` de axios (misma base del API).
 */
export function resolveMediaUrl(path: string | undefined | null): string {
    if (path == null || path === "") return "";
    if (/^https?:\/\//i.test(path)) return path;
    const apiBase = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8080/api").replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBase}${normalizedPath}`;
}
