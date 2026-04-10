import { NextRequest, NextResponse } from "next/server";

/** Cookie httpOnly que el backend setea al hacer login */
const SESSION_COOKIE = "access_token";

/** Rutas que no requieren sesión */
const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    const { pathname } = request.nextUrl;

    const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

    // Con sesión activa en /login → redirigir al dashboard
    if (isPublic && session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Sin sesión en ruta protegida → redirigir al login
    if (!isPublic && !session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
