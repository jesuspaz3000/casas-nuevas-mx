"use client";

import { useState } from "react";
import { useUsers } from "@/features/users/hooks/useUsers";
import { User } from "@/features/users/types/users.types";
import { DataTable, Column } from "@/shared/components/dataTable";
import { Button } from "@/shared/components/Button";
import { UserCreateDialog } from "@/features/users/components/UserCreate";
import { UserEditDialog } from "@/features/users/components/UserEdit";
import { UserDeleteDialog } from "@/features/users/components/UserDelete";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PeopleIcon from "@mui/icons-material/People";

const roleBadge: Record<string, string> = {
    ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    AGENT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

const roleLabel: Record<string, string> = {
    ADMIN: "Administrador",
    AGENT: "Agente",
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function Users() {
    const {
        users, isLoading, error,
        total, page, totalPages, pageSize, setPage, setPageSize,
        search, setSearch,
        refetch, remove,
    } = useUsers();

    const [createOpen, setCreateOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDelete = async () => {
        if (!deleteUser) return;
        setDeleteLoading(true);
        try {
            await remove(deleteUser.id);
            setDeleteUser(null);
        } catch {
            // remove ya llama a refetch si tiene éxito
        } finally {
            setDeleteLoading(false);
        }
    };

    const columns: Column<User>[] = [
        {
            key: "index",
            header: "#",
            headerClassName: "w-12",
            className: "text-gray-400 dark:text-gray-500 font-medium tabular-nums",
            render: (_, i) => (page - 1) * pageSize + i + 1,
        },
        {
            key: "name",
            header: "Nombre",
            render: (u) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                            {u.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                        </span>
                    </div>
                    <span className="font-medium text-gray-800 dark:text-white whitespace-nowrap">
                        {u.name}
                    </span>
                </div>
            ),
        },
        {
            key: "email",
            header: "Correo",
            className: "text-gray-500 dark:text-gray-400",
            render: (u) => u.email,
        },
        {
            key: "role",
            header: "Rol",
            render: (u) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role] ?? ""}`}>
                    {roleLabel[u.role] ?? u.role}
                </span>
            ),
        },
        {
            key: "createdAt",
            header: "Creado",
            className: "text-gray-500 dark:text-gray-400 whitespace-nowrap",
            render: (u) => formatDate(u.createdAt),
        },
        {
            key: "actions",
            header: "Acciones",
            headerClassName: "text-right",
            className: "text-right",
            render: (u) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => setEditUser(u)}
                        title="Editar usuario"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                    >
                        <EditIcon sx={{ fontSize: 17 }} />
                    </button>
                    <button
                        onClick={() => setDeleteUser(u)}
                        title="Eliminar usuario"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                    >
                        <DeleteOutlinedIcon sx={{ fontSize: 17 }} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="flex flex-col gap-6">
                {/* Encabezado del módulo */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 flex-shrink-0">
                        <ManageAccountsIcon sx={{ fontSize: 22, color: "white" }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            Gestión de usuarios
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Administra los usuarios y roles del sistema
                        </p>
                    </div>
                </div>

                {/* Barra de búsqueda + botón crear */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <SearchIcon
                            sx={{ fontSize: 18 }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => setCreateOpen(true)}
                    >
                        <PersonAddIcon sx={{ fontSize: 17 }} />
                        Nuevo usuario
                    </Button>
                </div>

                {/* Error */}
                {error && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                        {error}
                    </div>
                )}

                {/* Tabla */}
                <DataTable<User>
                    columns={columns}
                    data={users}
                    keyExtractor={(u) => u.id}
                    isLoading={isLoading}
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={pageSize}
                    pageSizeOptions={[5, 10, 25, 50]}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    emptyMessage={search ? `Sin resultados para "${search}"` : "No hay usuarios registrados"}
                    emptyIcon={<PeopleIcon sx={{ fontSize: 48 }} />}
                />
            </div>

            {/* Dialogs */}
            <UserCreateDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={refetch}
            />
            <UserEditDialog
                open={editUser !== null}
                user={editUser}
                onClose={() => setEditUser(null)}
                onUpdated={refetch}
            />
            <UserDeleteDialog
                open={deleteUser !== null}
                loading={deleteLoading}
                user={deleteUser}
                onConfirm={handleDelete}
                onCancel={() => setDeleteUser(null)}
            />
        </>
    );
}
