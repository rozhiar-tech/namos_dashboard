"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";

const INITIAL_FORM = {
  phone: "",
  password: "",
};

export default function LoginPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { login, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
    }
  }, [loading, user, router]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(form.phone.trim(), form.password);
      router.replace("/admin");
    } catch (err) {
      setError(err?.message ?? "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-slate-900">
            Namo admin login
          </p>
          <p className="text-sm text-slate-500">
            Sign in with your admin phone number and password.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Phone number
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={onChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={onChange}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
              required
            />
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-[11px] text-slate-400 text-center uppercase">
          Fleet operations access only
        </p>
      </div>
    </div>
  );
}
