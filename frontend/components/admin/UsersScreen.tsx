"use client";

import { PaginatedResponse, UserListItem } from "@/types/admin";
import { FormEvent, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ActionButton, EmptyState, MaterialIcon, Modal, SearchPill, StatusBadge, SurfaceCard, TableCell, TableRow, TableWrapper, Toast } from "./primitives";
import { useRemoteData } from "./useRemoteData";

const initialUsers: PaginatedResponse<UserListItem> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
};

const blankForm = {
  name: "",
  email: "",
  password: "",
  role: "USER",
};

export function UsersScreen() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "USER" });
  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderPortal(document.getElementById("header-actions"));
  }, []);
  
  // Fetch all users for stats (no search filter)
  const { data: totalData, setData: setTotalData } = useRemoteData<PaginatedResponse<UserListItem>>(
    `/api/users`,
    initialUsers,
  );
  
  // Fetch filtered users for table display
  const { data, setData } = useRemoteData<PaginatedResponse<UserListItem>>(
    `/api/users?search=${encodeURIComponent(search)}`,
    initialUsers,
  );

  async function submitUser(event: FormEvent) {
    event.preventDefault();
    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
    };
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      setToast(error?.message ?? error?.error ?? "Failed to create user");
      setTimeout(() => setToast(null), 3500);
      return;
    }
    const user = (await response.json()) as UserListItem;
    setData({ ...data, items: [user, ...data.items], total: data.total + 1 });
    setTotalData({ ...totalData, items: [user, ...totalData.items], total: totalData.total + 1 });
    setForm(blankForm);
    setShowCreate(false);
    setToast("User created successfully");
    setTimeout(() => setToast(null), 2500);
  }

  async function updateStatus(id: string, status: UserListItem["status"]) {
    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as UserListItem;
    setData({
      ...data,
      items: data.items.map((item) => (item.id === updated.id ? updated : item)),
    });
    setTotalData({
      ...totalData,
      items: totalData.items.map((item) => (item.id === updated.id ? updated : item)),
    });
    setToast("User updated");
    setTimeout(() => setToast(null), 2500);
  }

  async function removeUser(id: string) {
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setData({
      ...data,
      items: data.items.filter((item) => item.id !== id),
      total: Math.max(0, data.total - 1),
    });
    setTotalData({
      ...totalData,
      items: totalData.items.filter((item) => item.id !== id),
      total: Math.max(0, totalData.total - 1),
    });
    setToast("User removed");
    setTimeout(() => setToast(null), 2500);
  }

  function openEditModal(user: UserListItem) {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setShowEdit(true);
  }

  async function submitEditUser(event: FormEvent) {
    event.preventDefault();
    if (!editingUser) return;
    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
    };
    const response = await fetch(`/api/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      setToast(error?.message ?? error?.error ?? "Failed to update user");
      setTimeout(() => setToast(null), 3500);
      return;
    }
    const updated = (await response.json()) as UserListItem;
    setData({
      ...data,
      items: data.items.map((item) => (item.id === updated.id ? updated : item)),
    });
    setTotalData({
      ...totalData,
      items: totalData.items.map((item) => (item.id === updated.id ? updated : item)),
    });
    setEditingUser(null);
    setEditForm({ name: "", email: "", role: "USER" });
    setShowEdit(false);
    setToast("User updated successfully");
    setTimeout(() => setToast(null), 2500);
  }

  const developers = totalData.items.filter((item) => item.role === "DEVELOPER").length;
  const activeUsers = totalData.items.filter((item) => item.status === "ACTIVE").length;
  const suspendedUsers = totalData.items.filter((item) => item.status !== "ACTIVE").length;

  return (
    <div className="space-y-6">
      {headerPortal ? createPortal(
        <ActionButton onClick={() => setShowCreate(true)}>
          <MaterialIcon>person_add</MaterialIcon>
          Create User
        </ActionButton>,
        headerPortal
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <SurfaceCard className="flex items-center justify-between p-6">
          <div>
            <p className="mb-1 text-[12px] uppercase tracking-[0.08em] text-outline">Total Users</p>
            <h3 className="text-[32px] font-semibold text-on-surface">{totalData.total}</h3>
          </div>
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <MaterialIcon>group</MaterialIcon>
          </div>
        </SurfaceCard>
        <SurfaceCard className="flex items-center justify-between p-6">
          <div>
            <p className="mb-1 text-[12px] uppercase tracking-[0.08em] text-outline">Developers</p>
            <h3 className="text-[32px] font-semibold text-on-surface">{developers}</h3>
          </div>
          <div className="rounded-full bg-tertiary/10 p-3 text-tertiary">
            <MaterialIcon>code</MaterialIcon>
          </div>
        </SurfaceCard>
        <SurfaceCard className="flex items-center justify-between p-6">
          <div>
            <p className="mb-1 text-[12px] uppercase tracking-[0.08em] text-outline">Active Now</p>
            <h3 className="text-[32px] font-semibold text-on-surface">{activeUsers}</h3>
          </div>
          <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
            <MaterialIcon>bolt</MaterialIcon>
          </div>
        </SurfaceCard>
        <SurfaceCard className="flex items-center justify-between p-6">
          <div>
            <p className="mb-1 text-[12px] uppercase tracking-[0.08em] text-outline">Suspended</p>
            <h3 className="text-[32px] font-semibold text-on-surface">{suspendedUsers}</h3>
          </div>
          <div className="rounded-full bg-error/10 p-3 text-error">
            <MaterialIcon>block</MaterialIcon>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="overflow-hidden flex flex-col min-h-[calc(100vh-16rem)]">
        <div className="flex items-center justify-between px-6 py-4">
          <SearchPill
            value={search}
            onChange={setSearch}
            placeholder="Search users..."
            className="w-full max-w-xs"
          />
        </div>

        {data.items.length === 0 ? (
          <EmptyState
            className="flex-1"
            title="No users found"
            description="Your summary counts stay the same. Try another search term or clear the filter to see user results."
          />
        ) : (
          <TableWrapper columns={["Name", "Email", "Role", "Status", "Created At", "Actions"]}>
            {data.items.map((user) => {
              const initials = user.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();
              const roleTone =
                user.role === "DEVELOPER"
                  ? "bg-secondary-container text-on-secondary-container"
                  : user.role === "USER"
                    ? "bg-surface-container-high text-on-surface-variant"
                    : "bg-tertiary-container text-on-tertiary-container";

              return (
                <TableRow key={user.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-[14px] font-bold text-on-primary-container">
                        {initials}
                      </div>
                      <span className="text-[16px] font-medium text-on-surface">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[14px] text-on-surface-variant">{user.email}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${roleTone}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge value={user.status} />
                  </TableCell>
                  <TableCell className="text-[14px] text-on-surface-variant">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container-low hover:text-primary"
                        onClick={() => openEditModal(user)}
                      >
                        <MaterialIcon>edit_square</MaterialIcon>
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-outline transition-colors hover:bg-error-container/20 hover:text-error"
                        onClick={() =>
                          updateStatus(
                            user.id,
                            user.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                          )
                        }
                      >
                        <MaterialIcon>{user.status === "ACTIVE" ? "block" : "check_circle"}</MaterialIcon>
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-outline transition-colors hover:bg-error-container/20 hover:text-error"
                        onClick={() => removeUser(user.id)}
                      >
                        <MaterialIcon>delete</MaterialIcon>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableWrapper>
        )}

      </SurfaceCard>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New User">
        <form className="space-y-6" onSubmit={submitUser}>
          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-outline">
              Full Name
            </label>
            <input
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Alex Thompson"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-outline">
              Email Address
            </label>
            <input
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="alex@company.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-outline">
                User Role
              </label>
              <select
                className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="USER">USER</option>
                <option value="DEVELOPER">DEVELOPER</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-outline">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              className="flex-1 rounded-xl border border-outline-variant px-6 py-3 text-[14px] font-medium hover:bg-surface-container-low"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary px-6 py-3 text-[14px] font-semibold text-on-primary shadow-md hover:opacity-95"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit User">
        <form className="space-y-6" onSubmit={submitEditUser}>
          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-outline">
              Full Name
            </label>
            <input
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Alex Thompson"
              value={editForm.name}
              onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-outline">
              Email Address
            </label>
            <input
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="alex@company.com"
              value={editForm.email}
              onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-outline">
              User Role
            </label>
            <select
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={editForm.role}
              onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}
            >
              <option value="USER">USER</option>
              <option value="DEVELOPER">DEVELOPER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              className="flex-1 rounded-xl border border-outline-variant px-6 py-3 text-[14px] font-medium hover:bg-surface-container-low"
              onClick={() => setShowEdit(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary px-6 py-3 text-[14px] font-semibold text-on-primary shadow-md hover:opacity-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
