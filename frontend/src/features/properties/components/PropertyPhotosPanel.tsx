"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/shared/components/Button";
import { PropertiesService } from "@/features/properties/services/properties.service";
import type { PropertyPhoto } from "@/features/properties/types/properties.types";
import { resolveMediaUrl } from "@/shared/utils/mediaUrl";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ZoomInIcon from "@mui/icons-material/ZoomIn";

/** Altura fija del recuadro; la imagen encaja con object-contain (sin estirar). */
const PHOTO_THUMB_BOX =
    "relative h-44 sm:h-48 w-full shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center";
const PHOTO_THUMB_IMG = "max-h-full max-w-full object-contain";

/** Portada en modo borrador (edición hasta guardar). */
export type DraftCoverSelection =
    | { kind: "server"; id: string }
    | { kind: "pending"; file: File }
    | null;

export interface PropertyPhotosPanelProps {
    /** `null` en creación: solo cola local hasta guardar la propiedad. */
    propertyId: string | null;
    serverPhotos: PropertyPhoto[];
    pendingFiles: File[];
    /** Usar forma funcional al agregar/quitar para evitar estado obsoleto. */
    onPendingFilesChange: Dispatch<SetStateAction<File[]>>;
    disabled?: boolean;
    onServerPhotosUpdated?: () => void;
    /**
     * En edición: no llama al API al subir/quitar/portada; el padre persiste al guardar.
     */
    deferredSave?: boolean;
    draftCover?: DraftCoverSelection;
    onDraftCoverChange?: (cover: DraftCoverSelection) => void;
    /** Quitar foto existente del listado local (el DELETE va al guardar). */
    onRemoveServerPhoto?: (photoId: string) => void;
}

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada"
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                aria-label="Cerrar vista ampliada"
            >
                <CloseIcon sx={{ fontSize: 28 }} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt=""
                className="max-h-[min(90vh,900px)] max-w-full w-auto object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

export function PropertyPhotosPanel({
    propertyId,
    serverPhotos,
    pendingFiles,
    onPendingFilesChange,
    disabled,
    onServerPhotosUpdated,
    deferredSave = false,
    draftCover = null,
    onDraftCoverChange,
    onRemoveServerPhoto,
}: PropertyPhotosPanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const closeLightbox = useCallback(() => setLightboxSrc(null), []);

    const pendingPreviews = useMemo(
        () => pendingFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
        [pendingFiles],
    );

    useEffect(() => {
        return () => {
            pendingPreviews.forEach(({ url }) => URL.revokeObjectURL(url));
        };
    }, [pendingPreviews]);

    const sortedServer = useMemo(
        () => [...serverPhotos].sort((a, b) => a.sortOrder - b.sortOrder),
        [serverPhotos],
    );

    const pickFiles = () => inputRef.current?.click();

    const onInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
        // Copiar archivos ANTES de limpiar el input: en varios navegadores el FileList queda vacío tras value="".
        const arr = e.target.files?.length ? Array.from(e.target.files) : [];
        e.target.value = "";
        if (!arr.length) return;
        if (!propertyId || deferredSave) {
            onPendingFilesChange((prev) => [...prev, ...arr]);
            setError(null);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await PropertiesService.addPhotos(propertyId, arr);
            onServerPhotosUpdated?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudieron subir las fotos.");
        } finally {
            setBusy(false);
        }
    };

    const removePending = (file: File) => {
        onPendingFilesChange((prev) => prev.filter((f) => f !== file));
    };

    const removeServer = async (photoId: string) => {
        if (deferredSave) {
            onRemoveServerPhoto?.(photoId);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await PropertiesService.deletePhoto(photoId);
            onServerPhotosUpdated?.();
        } catch {
            setError("No se pudo eliminar la foto.");
        } finally {
            setBusy(false);
        }
    };

    const setCoverServer = async (photoId: string) => {
        if (deferredSave) {
            onDraftCoverChange?.({ kind: "server", id: photoId });
            return;
        }
        if (!propertyId) return;
        setBusy(true);
        setError(null);
        try {
            await PropertiesService.setCoverPhoto(propertyId, photoId);
            onServerPhotosUpdated?.();
        } catch {
            setError("No se pudo actualizar la portada.");
        } finally {
            setBusy(false);
        }
    };

    const setCoverPending = (file: File) => {
        if (deferredSave) {
            onDraftCoverChange?.({ kind: "pending", file });
            return;
        }
    };

    const isCoverServer = (ph: PropertyPhoto) =>
        deferredSave
            ? draftCover?.kind === "server" && draftCover.id === ph.id
            : ph.isCover;

    const isCoverPending = (file: File) =>
        deferredSave ? draftCover?.kind === "pending" && draftCover.file === file : false;

    const hasAny = sortedServer.length > 0 || pendingPreviews.length > 0;

    return (
        <div className="flex flex-col gap-4">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onInputChange}
            />

            <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" size="sm" onClick={pickFiles} disabled={disabled || busy}>
                    <AddPhotoAlternateIcon sx={{ fontSize: 18 }} />
                    {propertyId && !deferredSave ? "Subir imágenes" : "Agregar imágenes"}
                </Button>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-md leading-snug">
                    {!propertyId
                        ? "Se subirán al crear la propiedad. Puedes quitarlas de la cola antes de guardar."
                        : deferredSave
                          ? "Los cambios de fotos (subir, quitar, portada) se aplican al pulsar «Guardar cambios»."
                          : "Las imágenes se guardan al instante. Usa la lupa para ampliar."}
                </p>
            </div>

            {error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                    {error}
                </div>
            )}

            {!hasAny && (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/40 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Ninguna imagen aún. Pulsa &quot;{propertyId && !deferredSave ? "Subir" : "Agregar"} imágenes&quot; para elegir archivos.
                </div>
            )}

            {hasAny && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sortedServer.map((ph) => {
                        const src = resolveMediaUrl(ph.url);
                        return (
                            <li
                                key={ph.id}
                                className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className={PHOTO_THUMB_BOX}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt="" className={PHOTO_THUMB_IMG} loading="lazy" />
                                    {isCoverServer(ph) && (
                                        <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500 text-white shadow">
                                            Portada
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        title="Ampliar imagen"
                                        onClick={() => setLightboxSrc(src)}
                                        className="absolute top-2 right-2 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer opacity-90"
                                    >
                                        <ZoomInIcon sx={{ fontSize: 22 }} />
                                    </button>
                                </div>
                                <div className="flex gap-1 p-2 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        type="button"
                                        title={isCoverServer(ph) ? "Ya es portada" : "Usar como portada"}
                                        disabled={disabled || busy || isCoverServer(ph)}
                                        onClick={() => setCoverServer(ph.id)}
                                        className="flex-1 flex items-center justify-center py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-amber-600 dark:text-amber-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 cursor-pointer"
                                    >
                                        {isCoverServer(ph) ? <StarIcon sx={{ fontSize: 20 }} /> : <StarBorderIcon sx={{ fontSize: 20 }} />}
                                    </button>
                                    <button
                                        type="button"
                                        title="Eliminar"
                                        disabled={disabled || busy}
                                        onClick={() => removeServer(ph.id)}
                                        className="flex-1 flex items-center justify-center py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 cursor-pointer"
                                    >
                                        <DeleteOutlinedIcon sx={{ fontSize: 20 }} />
                                    </button>
                                </div>
                            </li>
                        );
                    })}

                    {pendingPreviews.map(({ file, url }) => (
                        <li
                            key={url}
                            className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm overflow-hidden flex flex-col"
                        >
                            <div className={PHOTO_THUMB_BOX}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="" className={PHOTO_THUMB_IMG} />
                                <div className="absolute top-2 left-2 z-[1] flex flex-col items-start gap-1 pointer-events-none">
                                    {isCoverPending(file) && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500 text-white shadow">
                                            Portada
                                        </span>
                                    )}
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-600 text-white shadow">
                                        Pendiente de subir
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    title="Ampliar imagen"
                                    onClick={() => setLightboxSrc(url)}
                                    className="absolute top-2 right-2 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
                                >
                                    <ZoomInIcon sx={{ fontSize: 22 }} />
                                </button>
                            </div>
                            <div className="p-2 border-t border-blue-100 dark:border-blue-900/40">
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate px-1 mb-2" title={file.name}>
                                    {file.name}
                                </p>
                                {deferredSave ? (
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            title={isCoverPending(file) ? "Ya es portada" : "Usar como portada"}
                                            disabled={disabled || busy || isCoverPending(file)}
                                            onClick={() => setCoverPending(file)}
                                            className="flex-1 flex items-center justify-center py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-amber-600 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                                        >
                                            {isCoverPending(file) ? <StarIcon sx={{ fontSize: 20 }} /> : <StarBorderIcon sx={{ fontSize: 20 }} />}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={disabled || busy}
                                            onClick={() => removePending(file)}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                                        >
                                            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                                            Quitar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={disabled || busy}
                                        onClick={() => removePending(file)}
                                        className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                                    >
                                        <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                                        Quitar de la cola
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={closeLightbox} />}
        </div>
    );
}
