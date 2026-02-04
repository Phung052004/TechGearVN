import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { settingsService } from "../../services";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  const [form, setForm] = useState({
    shippingFee: 0,
    footer: {
      aboutText: "",
      addressesText: "",
      hotline: "",
      email: "",
      companyLine1: "",
      companyLine2: "",
    },
  });

  async function load() {
    try {
      setLoading(true);
      const s = await settingsService.getSettings();
      setSettings(s);

      const addresses = Array.isArray(s?.footer?.addresses)
        ? s.footer.addresses
        : [];

      setForm({
        shippingFee: Number(s?.shippingFee || 0),
        footer: {
          aboutText: s?.footer?.aboutText ?? "",
          addressesText: addresses.join("\n"),
          hotline: s?.footer?.hotline ?? "",
          email: s?.footer?.email ?? "",
          companyLine1: s?.footer?.companyLine1 ?? "",
          companyLine2: s?.footer?.companyLine2 ?? "",
        },
      });

      return s;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được settings");
      setSettings(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();

    const addresses = String(form.footer.addressesText || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      shippingFee: Number(form.shippingFee || 0),
      footer: {
        aboutText: form.footer.aboutText,
        addresses,
        hotline: form.footer.hotline,
        email: form.footer.email,
        companyLine1: form.footer.companyLine1,
        companyLine2: form.footer.companyLine2,
      },
    };

    try {
      setSaving(true);
      const saved = await settingsService.updateSettings(payload);
      toast.success("Đã lưu settings");
      setSettings(saved);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lưu settings thất bại");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold text-gray-900">Settings</div>
          <div className="text-sm text-gray-600">
            Phí ship mặc định + nội dung Footer
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold"
          onClick={load}
        >
          Tải lại
        </button>
      </div>

      <form className="space-y-4" onSubmit={save}>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="font-extrabold text-gray-900">Checkout</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm font-bold text-gray-700">
              Shipping fee (VND)
              <input
                type="number"
                min={0}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.shippingFee}
                onChange={(e) =>
                  setForm((s) => ({ ...s, shippingFee: e.target.value }))
                }
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="font-extrabold text-gray-900">Footer</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm font-bold text-gray-700">
              About text
              <textarea
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[90px]"
                value={form.footer.aboutText}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    footer: { ...s.footer, aboutText: e.target.value },
                  }))
                }
              />
            </label>

            <label className="text-sm font-bold text-gray-700">
              Addresses (mỗi dòng 1 địa chỉ)
              <textarea
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[90px]"
                value={form.footer.addressesText}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    footer: { ...s.footer, addressesText: e.target.value },
                  }))
                }
              />
            </label>

            <label className="text-sm font-bold text-gray-700">
              Hotline
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.footer.hotline}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    footer: { ...s.footer, hotline: e.target.value },
                  }))
                }
              />
            </label>

            <label className="text-sm font-bold text-gray-700">
              Email
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.footer.email}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    footer: { ...s.footer, email: e.target.value },
                  }))
                }
              />
            </label>

            <label className="text-sm font-bold text-gray-700">
              Company line 1
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.footer.companyLine1}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    footer: { ...s.footer, companyLine1: e.target.value },
                  }))
                }
              />
            </label>

            <label className="text-sm font-bold text-gray-700">
              Company line 2
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.footer.companyLine2}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    footer: { ...s.footer, companyLine2: e.target.value },
                  }))
                }
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-extrabold"
          disabled={saving}
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>

        <div className="text-xs text-gray-500">
          Current key: {settings?.key || "default"}
        </div>
      </form>
    </div>
  );
}
