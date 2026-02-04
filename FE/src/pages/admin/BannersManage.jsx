import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { bannerService } from "../../services";

function normalize(v) {
  return String(v ?? "").trim();
}

export default function BannersManage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banners, setBanners] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    linkUrl: "",
    isActive: true,
  });

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return banners;
    return banners.filter((b) => {
      const title = String(b?.title || "").toLowerCase();
      const id = String(b?._id || "").toLowerCase();
      return title.includes(keyword) || id.includes(keyword);
    });
  }, [banners, q]);

  async function load() {
    try {
      setLoading(true);
      const list = await bannerService.getBanners();
      setBanners(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được banners");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function pick(b) {
    setSelected(b);
    setForm({
      title: b?.title ?? "",
      imageUrl: b?.imageUrl ?? b?.image ?? "",
      linkUrl: b?.linkUrl ?? b?.link ?? "",
      isActive: b?.isActive ?? true,
    });
  }

  function reset() {
    setSelected(null);
    setForm({ title: "", imageUrl: "", linkUrl: "", isActive: true });
  }

  async function save(e) {
    e.preventDefault();

    const payload = {
      title: normalize(form.title),
      imageUrl: normalize(form.imageUrl),
      linkUrl: normalize(form.linkUrl),
      isActive: Boolean(form.isActive),
    };

    if (!payload.title || !payload.imageUrl) {
      toast.info("Cần title và imageUrl");
      return;
    }

    try {
      setSaving(true);
      if (selected?._id) {
        const updated = await bannerService.updateBanner(selected._id, payload);
        toast.success("Đã cập nhật banner");
        setBanners((rows) =>
          rows.map((x) => (x._id === updated._id ? updated : x)),
        );
        setSelected(updated);
      } else {
        const created = await bannerService.createBanner(payload);
        toast.success("Đã tạo banner");
        setBanners((rows) => [created, ...rows]);
        pick(created);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lưu banner thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function remove(b) {
    if (!b?._id) return;
    const ok = window.confirm("Xóa banner này?");
    if (!ok) return;

    try {
      setSaving(true);
      await bannerService.deleteBanner(b._id);
      toast.success("Đã xóa banner");
      setBanners((rows) => rows.filter((x) => x._id !== b._id));
      if (selected?._id === b._id) reset();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xóa thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold text-gray-900">Banners</div>
          <div className="text-sm text-gray-600">
            Tạo/sửa/xóa banner trang chủ
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold"
          onClick={load}
          disabled={loading}
        >
          Tải lại
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="font-extrabold text-gray-900">
              {selected?._id ? "Chỉnh sửa" : "Tạo mới"}
            </div>
            {selected?._id ? (
              <button
                type="button"
                className="text-xs font-extrabold text-gray-600 hover:underline"
                onClick={reset}
              >
                Tạo banner khác
              </button>
            ) : null}
          </div>

          <form className="mt-3 space-y-3" onSubmit={save}>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Tiêu đề"
              value={form.title}
              onChange={(e) =>
                setForm((s) => ({ ...s, title: e.target.value }))
              }
            />
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Image URL"
              value={form.imageUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, imageUrl: e.target.value }))
              }
            />
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Link URL (optional)"
              value={form.linkUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, linkUrl: e.target.value }))
              }
            />
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(form.isActive)}
                onChange={(e) =>
                  setForm((s) => ({ ...s, isActive: e.target.checked }))
                }
              />
              Hiển thị (isActive)
            </label>

            <button
              type="submit"
              className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white font-extrabold"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>

            {selected?._id ? (
              <button
                type="button"
                className="w-full px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-extrabold border border-rose-100"
                onClick={() => remove(selected)}
                disabled={saving}
              >
                Xóa
              </button>
            ) : null}
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="font-extrabold text-gray-900">
              Danh sách banners
            </div>
            <input
              className="w-full md:w-[260px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Tìm theo title / id"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-extrabold">Title</th>
                  <th className="text-left px-3 py-2 font-extrabold">Active</th>
                  <th className="text-right px-3 py-2 font-extrabold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      Đang tải...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={3}>
                      Không có banners
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b?._id} className="border-t">
                      <td className="px-3 py-2 font-bold">{b?.title}</td>
                      <td className="px-3 py-2">
                        {String(b?.isActive ?? true)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg text-xs font-extrabold border border-gray-200 hover:bg-gray-50"
                          onClick={() => pick(b)}
                          disabled={saving}
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
