/**
 * Convierte el valor de `<input type="datetime-local">` (o string similar) al formato que espera el API:
 * `yyyy-MM-ddTHH:mm:ss` **sin zona horaria** (hora local “de negocio”).
 *
 * No usar `Date#toISOString()`: convierte a UTC y desplaza la hora respecto a lo que eligió el usuario.
 */
export function localDatetimeInputToApi(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) {
        const m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?/.exec(trimmed);
        if (m) return m[2] ? trimmed.slice(0, 19) : `${m[1]}:00`;
        return trimmed;
    }
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${mo}-${da}T${h}:${mi}:00`;
}
