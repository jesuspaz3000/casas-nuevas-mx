"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
    const root = document.documentElement;
    const observer = new MutationObserver(() => onStoreChange());
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
}

function getSnapshot(): boolean {
    return document.documentElement.classList.contains("dark");
}

function getServerSnapshot(): boolean {
    return false;
}

/** Alineado con `ThemeToggle` / clase `dark` en `<html>`. */
export function useIsDarkMode(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
