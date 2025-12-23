"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "../apiClient";
import useTranslation from "../hooks/useTranslation";

const EMPTY_PROMO = {
  name: "",
  image: "",
  link: "",
  isActive: true,
  displayOrder: 0,
  startDate: "",
  endDate: "",
  targetAudience: "all",
};

export default function PromoManagement() {
  const { t } = useTranslation();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [form, setForm] = useState(EMPTY_PROMO);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/admin/advertisements");
      setPromos(data?.advertisements || []);
    } catch (err) {
      console.error("Failed to fetch promos:", err);
      setPromos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      if (imageFile) {
        // Upload with file
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("name", form.name);
        formData.append("link", form.link);
        formData.append("isActive", form.isActive);
        formData.append("displayOrder", form.displayOrder);
        if (form.startDate) formData.append("startDate", form.startDate);
        if (form.endDate) formData.append("endDate", form.endDate);
        formData.append("targetAudience", form.targetAudience);

        if (editingPromo) {
          await apiRequest(`/admin/advertisements/${editingPromo.id}`, {
            method: "PUT",
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
          });
        } else {
          await apiRequest("/admin/advertisements", {
            method: "POST",
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
          });
        }
      } else {
        // Upload with URL
        const payload = {
          name: form.name,
          image: form.image,
          link: form.link,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
          targetAudience: form.targetAudience,
        };
        if (form.startDate) payload.startDate = form.startDate;
        if (form.endDate) payload.endDate = form.endDate;

        if (editingPromo) {
          await apiRequest(`/admin/advertisements/${editingPromo.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else {
          await apiRequest("/admin/advertisements", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }
      }

      setMessage({ type: "success", text: editingPromo ? "Promo updated" : "Promo created" });
      setShowForm(false);
      setEditingPromo(null);
      setForm(EMPTY_PROMO);
      setImageFile(null);
      fetchPromos();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to save promo" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      name: promo.name || "",
      image: promo.image || "",
      link: promo.link || "",
      isActive: promo.isActive ?? true,
      displayOrder: promo.displayOrder || 0,
      startDate: promo.startDate ? promo.startDate.split("T")[0] : "",
      endDate: promo.endDate ? promo.endDate.split("T")[0] : "",
      targetAudience: promo.targetAudience || "all",
    });
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(t("promo.deleteConfirm"))) return;

    try {
      await apiRequest(`/admin/advertisements/${id}`, { method: "DELETE" });
      fetchPromos();
    } catch (error) {
      alert(error.message || "Failed to delete promo");
    }
  };

  const activePromos = promos.filter((p) => p.isActive);
  const inactivePromos = promos.filter((p) => !p.isActive);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t("promo.title")}</h3>
            <p className="text-xs text-slate-500">Manage promotional advertisements</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingPromo(null);
                setForm(EMPTY_PROMO);
                setImageFile(null);
              }
            }}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {showForm ? t("common.cancel") : t("promo.createPromo")}
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-sm ${
              message.type === "error"
                ? "bg-rose-50 border border-rose-200 text-rose-600"
                : "bg-emerald-50 border border-emerald-200 text-emerald-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-2xl space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label={t("promo.name")}
                name="name"
                value={form.name}
                onChange={handleInput}
                required
              />
              <TextInput
                label={t("promo.link")}
                name="link"
                type="url"
                value={form.link}
                onChange={handleInput}
                required
              />
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
                  {t("promo.uploadImage")}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <TextInput
                label={t("promo.imageUrl")}
                name="image"
                type="url"
                value={form.image}
                onChange={handleInput}
                placeholder="Or enter image URL"
                disabled={!!imageFile}
              />
              {form.image && !imageFile && (
                <div className="md:col-span-2">
                  <img src={form.image} alt="Preview" className="max-w-xs h-32 object-cover rounded-xl" />
                </div>
              )}
              <SelectInput
                label={t("promo.targetAudience")}
                name="targetAudience"
                value={form.targetAudience}
                onChange={handleInput}
                options={[
                  { value: "all", label: t("promo.all") },
                  { value: "riders", label: t("promo.riders") },
                  { value: "drivers", label: t("promo.drivers") },
                  { value: "owners", label: t("promo.owners") },
                ]}
              />
              <TextInput
                label={t("promo.displayOrder")}
                name="displayOrder"
                type="number"
                value={form.displayOrder}
                onChange={handleInput}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInput}
                  className="rounded border-slate-300"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  {t("promo.isActive")}
                </label>
              </div>
              <TextInput
                label={t("promo.startDate")}
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleInput}
              />
              <TextInput
                label={t("promo.endDate")}
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={handleInput}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? t("common.loading") : editingPromo ? t("common.save") : t("common.create")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPromo(null);
                  setForm(EMPTY_PROMO);
                  setImageFile(null);
                }}
                className="rounded-2xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : (
          <div className="space-y-6">
            {activePromos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{t("promo.activePromos")}</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activePromos.map((promo) => (
                    <PromoCard key={promo.id} promo={promo} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}
            {inactivePromos.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{t("promo.inactivePromos")}</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inactivePromos.map((promo) => (
                    <PromoCard key={promo.id} promo={promo} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}
            {promos.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">{t("promo.noPromos")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PromoCard({ promo, onEdit, onDelete }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition">
      {promo.image && (
        <img
          src={promo.image}
          alt={promo.name}
          className="w-full h-32 object-cover rounded-xl mb-3"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      )}
      <div className="space-y-2">
        <h5 className="font-semibold text-slate-900">{promo.name}</h5>
        <p className="text-xs text-slate-500 truncate">{promo.link}</p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{t("promo.targetAudience")}: {promo.targetAudience}</span>
          <span>{t("promo.clickCount")}: {promo.clickCount || 0}</span>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onEdit(promo)}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50"
          >
            {t("common.edit")}
          </button>
          <button
            onClick={() => onDelete(promo.id)}
            className="flex-1 rounded-xl border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            {t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextInput({ label, ...props }) {
  return (
    <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
      {label}
      <input
        {...props}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:bg-slate-100"
      />
    </label>
  );
}

function SelectInput({ label, options, ...props }) {
  return (
    <label className="text-xs font-semibold text-slate-500 tracking-wide flex flex-col gap-1">
      {label}
      <select
        {...props}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

