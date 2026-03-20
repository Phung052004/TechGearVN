import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { warrantyService } from "../../services";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN");
}

function StatusPill({ value }) {
  const map = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-100",
    RECEIVED_PRODUCT: "bg-blue-50 text-blue-700 border-blue-100",
    PROCESSING: "bg-purple-50 text-purple-700 border-purple-100",
    COMPLETED: "bg-green-50 text-green-700 border-green-100",
    REJECTED: "bg-red-50 text-red-700 border-red-100",
  };
  const cls = map[value] || "bg-gray-50 text-gray-700 border-gray-100";
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${cls}`}
    >
      {value}
    </span>
  );
}

export default function WarrantyManagement() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "",
    resolution: "",
    staffNote: "",
  });

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const res = await warrantyService.getAllClaims();
      setClaims(Array.isArray(res) ? res : []);
    } catch (error) {
      toast.error("Lỗi tải yêu cầu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = filter
    ? claims.filter((c) => c.status === filter)
    : claims;

  const handleSelectClaim = (claim) => {
    setSelected(claim);
    setUpdateData({
      status: claim.status,
      resolution: claim.resolution || "",
      staffNote: claim.staffNote || "",
    });
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!selected) return;

    try {
      setUpdating(true);
      await warrantyService.updateClaim(selected._id, updateData);
      toast.success("Cập nhật yêu cầu thành công!");
      loadClaims();
      setSelected(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  const statuses = [
    "PENDING",
    "RECEIVED_PRODUCT",
    "PROCESSING",
    "COMPLETED",
    "REJECTED",
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Quản Lý Yêu Cầu Bảo Hành</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter("")}
            className={`px-4 py-2 rounded whitespace-nowrap ${
              filter === ""
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            Tất Cả ({claims.length})
          </button>
          {statuses.map((status) => {
            const count = claims.filter((c) => c.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded whitespace-nowrap ${
                  filter === status
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border"
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        {/* Claims Table */}
        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : filteredClaims.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">Không có yêu cầu nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Ngày Tạo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Khách Hàng
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Lý Do
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Giải Pháp
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredClaims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {claim.user?.fullName || "N/A"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {claim.user?.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{claim.reason}</td>
                    <td className="px-6 py-4 text-sm">
                      <StatusPill value={claim.status} />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {claim.resolution ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                          {claim.resolution === "REPAIR"
                            ? "Sửa Chữa"
                            : claim.resolution === "REPLACE"
                              ? "Thay Thế"
                              : "Hoàn Tiền"}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSelectClaim(claim)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Chi Tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail & Update Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Chi Tiết Yêu Cầu</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Customer Info */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">Thông Tin Khách Hàng</h3>
                  <p className="text-sm">
                    <span className="font-semibold">Tên:</span>{" "}
                    {selected.user?.fullName}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Email:</span>{" "}
                    {selected.user?.email}
                  </p>
                </div>

                {/* Claim Details */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">Chi Tiết Yêu Cầu</h3>
                  <p className="text-sm">
                    <span className="font-semibold">ID:</span> {selected._id}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Lý Do:</span>{" "}
                    {selected.reason}
                  </p>
                  {selected.productSerialNumber && (
                    <p className="text-sm">
                      <span className="font-semibold">S/N:</span>{" "}
                      {selected.productSerialNumber}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-semibold">Ngày Tạo:</span>{" "}
                    {formatDate(selected.createdAt)}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Trạng Thái
                  </label>
                  <select
                    name="status"
                    value={updateData.status}
                    onChange={handleUpdateChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Giải Pháp
                  </label>
                  <select
                    name="resolution"
                    value={updateData.resolution}
                    onChange={handleUpdateChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Chọn giải pháp --</option>
                    <option value="REPAIR">Sửa Chữa</option>
                    <option value="REPLACE">Thay Thế</option>
                    <option value="REFUND">Hoàn Tiền</option>
                  </select>
                </div>

                {/* Staff Note */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Ghi Chú
                  </label>
                  <textarea
                    name="staffNote"
                    value={updateData.staffNote}
                    onChange={handleUpdateChange}
                    placeholder="Nhập ghi chú cho khách hàng..."
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                    rows="4"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-semibold"
                >
                  {updating ? "Đang cập nhật..." : "Cập Nhật"}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
