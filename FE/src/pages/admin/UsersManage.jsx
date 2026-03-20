import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { userAdminService } from "../../services";

const ROLES = ["CUSTOMER", "STAFF", "DELIVERY", "ADMIN"];

function Badge({ children, tone = "gray" }) {
  const map = {
    gray: "bg-gray-50 text-gray-700 border-gray-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
  };
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-extrabold rounded-full border ${map[tone] || map.gray}`}
    >
      {children}
    </span>
  );
}

export default function UsersManage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20; // rows per page

  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "STAFF",
  });

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((u) => {
      const email = String(u?.email || "").toLowerCase();
      const name = String(u?.fullName || "").toLowerCase();
      return email.includes(keyword) || name.includes(keyword);
    });
  }, [users, q]);

  async function load() {
    try {
      setLoading(true);
      const list = await userAdminService.listUsers({
        q: q.trim() || undefined,
        role: filterRole || undefined,
      });
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole]);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [q, filterRole]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      const created = await userAdminService.createUser(createForm);
      toast.success(`Đã tạo user: ${created?.email || ""}`);
      setCreateForm({ fullName: "", email: "", password: "", role: "STAFF" });
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Tạo user thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock(u) {
    try {
      setSaving(true);
      const next = await userAdminService.setBlocked(u._id, !u?.isBlocked);
      toast.success(next?.isBlocked ? "Đã khóa" : "Đã mở khóa");
      setUsers((rows) => rows.map((x) => (x._id === next._id ? next : x)));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(u, role) {
    try {
      setSaving(true);
      const next = await userAdminService.setRole(u._id, role);
      toast.success("Đã cập nhật role");
      setUsers((rows) => rows.map((x) => (x._id === next._id ? next : x)));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật role thất bại");
    } finally {
      setSaving(false);
    }
  }

  // pagination derived
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold text-gray-900">Users</div>
          <div className="text-sm text-gray-600">
            Tạo staff • đổi role • khóa/mở khóa
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
          <div className="font-extrabold text-gray-900">Tạo user nhanh</div>
          <form className="mt-3 space-y-3" onSubmit={handleCreate}>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Họ tên"
              value={createForm.fullName}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, fullName: e.target.value }))
              }
            />
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Email"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, email: e.target.value }))
              }
            />
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Mật khẩu (>= 6 ký tự)"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, password: e.target.value }))
              }
            />
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={createForm.role}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, role: e.target.value }))
              }
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white font-extrabold"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Tạo user"}
            </button>
            <div className="text-xs text-gray-500">
              User tạo qua Admin được set `isVerified=true` để đăng nhập ngay.
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="font-extrabold text-gray-900">Danh sách users</div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <input
                className="w-full md:w-[260px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Tìm theo email / họ tên"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
              />
              <select
                className="w-full md:w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">Tất cả role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold"
                onClick={load}
                disabled={loading}
              >
                Lọc
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-extrabold">Email</th>
                  <th className="text-left px-3 py-2 font-extrabold">Họ tên</th>
                  <th className="text-left px-3 py-2 font-extrabold">Role</th>
                  <th className="text-left px-3 py-2 font-extrabold">
                    Trạng thái
                  </th>
                  <th className="text-right px-3 py-2 font-extrabold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={5}>
                      Đang tải...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3" colSpan={5}>
                      Không có users
                    </td>
                  </tr>
                ) : (
                  pageItems.map((u) => (
                    <tr key={u?._id} className="border-t">
                      <td className="px-3 py-2 font-bold">{u?.email}</td>
                      <td className="px-3 py-2">{u?.fullName}</td>
                      <td className="px-3 py-2">
                        <select
                          className="border border-gray-200 rounded-lg px-2 py-1 bg-white"
                          value={u?.role || "CUSTOMER"}
                          onChange={(e) => changeRole(u, e.target.value)}
                          disabled={saving}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        {u?.isBlocked ? (
                          <Badge tone="red">BLOCKED</Badge>
                        ) : (
                          <Badge tone="green">ACTIVE</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border ${
                            u?.isBlocked
                              ? "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                              : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
                          }`}
                          onClick={() => toggleBlock(u)}
                          disabled={saving}
                        >
                          {u?.isBlocked ? "Mở khóa" : "Khóa"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {filtered.length > pageSize && (
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị{" "}
                {Math.min(filtered.length, page * pageSize) -
                  (page - 1) * pageSize}{" "}
                / {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded border text-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <span className="text-sm">
                  {page} / {totalPages}
                </span>
                <button
                  className="px-3 py-1 rounded border text-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500">
            Lưu ý: user bị khóa sẽ không đăng nhập được và token cũ sẽ bị chặn.
          </div>
        </div>
      </div>
    </div>
  );
}
