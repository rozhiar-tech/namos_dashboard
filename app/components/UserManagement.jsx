"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../apiClient";

const ROLE_FILTERS = [
  { value: "all", label: "All users" },
  { value: "rider", label: "Riders" },
  { value: "driver", label: "Drivers" },
  { value: "owner", label: "Owners" },
  { value: "owner_driver", label: "Owner drivers" },
];

const ROLE_BADGE_CLASS = {
  rider: "bg-sky-100 text-sky-700",
  driver: "bg-emerald-100 text-emerald-700",
  owner: "bg-indigo-100 text-indigo-700",
  owner_driver: "bg-amber-100 text-amber-700",
  admin: "bg-rose-100 text-rose-700",
};

const EMPTY_PASSWORD_FORM = {
  newPassword: "",
  confirmPassword: "",
};

function buildEditForm(user = {}) {
  return {
    fullName: user.fullName ?? user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    age: user.age ?? "",
    homeAddress: user.homeAddress ?? "",
    city: user.city ?? "",
    country: user.country ?? "",
    zipCode: user.zipCode ?? "",
    profileType: user.profileType ?? "",
    companyName: user.companyName ?? "",
  };
}

export default function UserManagement() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(buildEditForm());
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (roleFilter !== "all") {
        params.set("role", roleFilter);
      }

      const payload = await apiRequest(`/admin/users?${params.toString()}`);
      const list = Array.isArray(payload?.users) ? payload.users : [];
      setUsers(list);

      const nextPagination = payload?.pagination ?? {};
      setPagination({
        total: Number(nextPagination.total) || list.length,
        page: Number(nextPagination.page) || page,
        limit: Number(nextPagination.limit) || limit,
        totalPages: Number(nextPagination.totalPages) || 1,
      });
    } catch (loadError) {
      console.error("Failed to load users:", loadError);
      setUsers([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 1 }));
      setError(loadError?.message ?? "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshKey]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      [
        user.id,
        user.fullName,
        user.name,
        user.email,
        user.phone,
        user.role,
        user.city,
        user.country,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(term))
    );
  }, [users, search]);

  const visibleStart = users.length
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const visibleEnd = users.length ? visibleStart + users.length - 1 : 0;

  const handleStartEdit = (user) => {
    setStatusMessage(null);
    setEditingUser(user);
    setEditForm(buildEditForm(user));
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm(buildEditForm());
    setEditSubmitting(false);
  };

  const handleEditInput = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitEdit = async (event) => {
    event.preventDefault();
    if (!editingUser?.id) return;

    setEditSubmitting(true);
    setStatusMessage(null);
    try {
      const payload = { ...editForm };
      if (payload.age === "") {
        delete payload.age;
      } else {
        payload.age = Number(payload.age);
      }
      if (!payload.profileType) {
        delete payload.profileType;
      }

      const result = await apiRequest(`/admin/users/${editingUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setStatusMessage({
        type: "success",
        text: result?.message ?? `User #${editingUser.id} updated successfully.`,
      });
      handleCancelEdit();
      setRefreshKey((prev) => prev + 1);
    } catch (submitError) {
      setStatusMessage({
        type: "error",
        text: submitError?.message ?? "Unable to update user.",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleStartPasswordReset = (user) => {
    setStatusMessage(null);
    setPasswordUser(user);
    setPasswordForm(EMPTY_PASSWORD_FORM);
  };

  const handleCancelPasswordReset = () => {
    setPasswordUser(null);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordSubmitting(false);
  };

  const handlePasswordInput = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPasswordReset = async (event) => {
    event.preventDefault();
    if (!passwordUser?.id) return;

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setStatusMessage({
        type: "error",
        text: "Please fill in both password fields.",
      });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    setPasswordSubmitting(true);
    setStatusMessage(null);
    try {
      const result = await apiRequest(
        `/admin/users/${passwordUser.id}/reset-password`,
        {
          method: "POST",
          body: JSON.stringify({ newPassword: passwordForm.newPassword }),
        }
      );

      setStatusMessage({
        type: "success",
        text:
          result?.message ??
          `Password for user #${passwordUser.id} updated successfully.`,
      });
      handleCancelPasswordReset();
    } catch (submitError) {
      setStatusMessage({
        type: "error",
        text: submitError?.message ?? "Unable to reset password.",
      });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        <div>
          <p className="text-lg font-semibold text-slate-900">User management</p>
          <p className="text-xs text-slate-500">
            Browse and manage riders, drivers, owners, and owner drivers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((prev) => prev + 1)}
          className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
        >
          Refresh users
        </button>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {ROLE_FILTERS.map((role) => {
            const isActive = roleFilter === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => {
                  setRoleFilter(role.value);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {role.label}
              </button>
            );
          })}
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by id, name, email, phone, city…"
          className="w-full md:w-96 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
        />
      </div>

      {statusMessage && (
        <div
          className={`mb-4 rounded-2xl border px-3 py-2 text-sm ${
            statusMessage.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
              <th className="py-2">User</th>
              <th className="py-2">Role</th>
              <th className="py-2">Contact</th>
              <th className="py-2">Location</th>
              <th className="py-2">Created</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const role = user.role ?? "unknown";
              const badgeClass =
                ROLE_BADGE_CLASS[role] ?? "bg-slate-100 text-slate-700";
              const location = [user.city, user.country]
                .filter(Boolean)
                .join(", ");
              return (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="py-3">
                    <div className="font-semibold text-slate-900">
                      {user.fullName ?? user.name ?? "Unnamed"}
                    </div>
                    <p className="text-xs text-slate-500">#{user.id}</p>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                    >
                      {role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-700">
                    <p>{user.phone ?? "No phone"}</p>
                    <p className="text-xs text-slate-500">
                      {user.email ?? "No email"}
                    </p>
                  </td>
                  <td className="py-3 text-slate-700">{location || "—"}</td>
                  <td className="py-3 text-slate-700">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(user)}
                        className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartPasswordReset(user)}
                        className="rounded-xl border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        Reset password
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filteredUsers.length && !loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                  No users match this filter.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                  Loading users…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-slate-500">
          Showing {visibleStart}-{visibleEnd} of {pagination.total}
          {search.trim() ? " (search applied to current page)" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={loading || page <= 1}
            className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((prev) => Math.min(pagination.totalPages || 1, prev + 1))
            }
            disabled={loading || page >= (pagination.totalPages || 1)}
            className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>

      {editingUser && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-3">
            Edit user #{editingUser.id}
          </p>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label="Full name"
                name="fullName"
                value={editForm.fullName}
                onChange={handleEditInput}
                required
              />
              <TextInput
                label="Email"
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleEditInput}
                required
              />
              <TextInput
                label="Phone"
                name="phone"
                value={editForm.phone}
                onChange={handleEditInput}
                required
              />
              <TextInput
                label="Age"
                name="age"
                type="number"
                value={editForm.age}
                onChange={handleEditInput}
              />
              <TextInput
                label="Home address"
                name="homeAddress"
                value={editForm.homeAddress}
                onChange={handleEditInput}
              />
              <TextInput
                label="City"
                name="city"
                value={editForm.city}
                onChange={handleEditInput}
              />
              <TextInput
                label="Country"
                name="country"
                value={editForm.country}
                onChange={handleEditInput}
              />
              <TextInput
                label="ZIP code"
                name="zipCode"
                value={editForm.zipCode}
                onChange={handleEditInput}
              />
              <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
                Profile type
                <select
                  name="profileType"
                  value={editForm.profileType}
                  onChange={handleEditInput}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
                >
                  <option value="">Unchanged</option>
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </label>
              <TextInput
                label="Company name"
                name="companyName"
                value={editForm.companyName}
                onChange={handleEditInput}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={editSubmitting}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {editSubmitting ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {passwordUser && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-3">
            Reset password for user #{passwordUser.id}
          </p>
          <form onSubmit={handleSubmitPasswordReset} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput
                label="New password"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordInput}
                required
              />
              <TextInput
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordInput}
                required
              />
            </div>
            <p className="text-xs text-slate-500">
              Password must include uppercase, lowercase, number, special
              character, and be at least 8 characters.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {passwordSubmitting ? "Updating…" : "Update password"}
              </button>
              <button
                type="button"
                onClick={handleCancelPasswordReset}
                className="rounded-xl border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function TextInput(props) {
  const { label, ...rest } = props;
  return (
    <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
      {label}
      <input
        {...rest}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
      />
    </label>
  );
}
