import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { warrantyService } from "../services";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function StatusBadge({ status }) {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    RECEIVED_PRODUCT: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  const color = colors[status] || "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${color}`}
    >
      {status}
    </span>
  );
}

export default function WarrantyPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    orderItemId: "",
    productSerialNumber: "",
    reason: "",
    imageProof: [],
  });
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Load warranty claims
  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const res = await warrantyService.getMyClaims();
      setClaims(Array.isArray(res) ? res : []);
    } catch (error) {
      toast.error("Lỗi tải yêu cầu bảo hành");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    // TODO: Upload to backend or storage service
    // For now, just store file names
    setFormData((prev) => ({
      ...prev,
      imageProof: [...prev.imageProof, ...files.map((f) => f.name)],
    }));
    toast.success(`Đã thêm ${files.length} ảnh`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.orderItemId || !formData.reason) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      await warrantyService.createClaim(formData);
      toast.success("Tạo yêu cầu bảo hành thành công!");
      setShowModal(false);
      setFormData({
        orderItemId: "",
        productSerialNumber: "",
        reason: "",
        imageProof: [],
      });
      loadClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi tạo yêu cầu");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Bảo Hành & Đổi Trả</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            + Tạo Yêu Cầu Mới
          </button>
        </div>

        {/* Claims List */}
        {loading ? (
          <div className="text-center py-12">
            <p>Đang tải...</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">Chưa có yêu cầu bảo hành nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const product = claim?.order?.items?.find(
                (it) =>
                  it?.product === claim?.orderItemId ||
                  it?.productName === claim?.orderItemId,
              );
              return (
                <div
                  key={claim._id}
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition"
                  onClick={() => setSelectedClaim(claim)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">
                        ID: {String(claim._id).slice(-6).toUpperCase()}
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {product?.productName ||
                          claim?.orderItemId ||
                          "Sản phẩm không xác định"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Lý do: {claim.reason}
                      </p>
                      {claim.productSerialNumber && (
                        <p className="text-sm text-gray-600">
                          S/N: {claim.productSerialNumber}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Ngày yêu cầu: {formatDate(claim.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>

                  {/* Resolution Badge */}
                  {claim.resolution && (
                    <div className="mt-3">
                      <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded text-sm">
                        {claim.resolution === "REPAIR"
                          ? "Sửa Chữa"
                          : claim.resolution === "REPLACE"
                            ? "Thay Thế"
                            : "Hoàn Tiền"}
                      </span>
                    </div>
                  )}

                  {/* Staff Note */}
                  {claim.staffNote && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                      <p className="text-sm font-semibold text-gray-700">
                        Ghi chú từ nhân viên:
                      </p>
                      <p className="text-sm text-gray-600">{claim.staffNote}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedClaim && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  Chi Tiết Yêu Cầu Bảo Hành
                </h2>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Thông tin sản phẩm */}
                {(() => {
                  const product = selectedClaim?.order?.items?.find(
                    (it) =>
                      it?.product === selectedClaim?.orderItemId ||
                      it?.productName === selectedClaim?.orderItemId,
                  );
                  return (
                    <div className="pb-4 border-b border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Thông tin sản phẩm
                      </label>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">Tên:</span>
                          <span className="font-bold text-gray-900">
                            {" "}
                            {product?.productName ||
                              selectedClaim?.orderItemId ||
                              "-"}
                          </span>
                        </div>
                        {product ? (
                          <>
                            <div>
                              <span className="text-gray-600">Số lượng:</span>
                              <span className="font-bold text-gray-900">
                                {" "}
                                {product?.quantity}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Giá:</span>
                              <span className="font-bold text-gray-900">
                                {" "}
                                {product?.price?.toLocaleString("vi-VN")} ₫
                              </span>
                            </div>
                          </>
                        ) : null}
                        <div>
                          <span className="text-gray-600">Số seri:</span>
                          <span className="font-bold text-gray-900">
                            {" "}
                            {selectedClaim?.productSerialNumber || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Lý do và mô tả */}
                <div className="pb-4 border-b border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Lý do yêu cầu
                  </label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedClaim.reason}
                  </p>
                  {selectedClaim.description && (
                    <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                      {selectedClaim.description}
                    </p>
                  )}
                </div>

                {/* Hình ảnh */}
                {selectedClaim?.imageProof &&
                  selectedClaim?.imageProof?.length > 0 && (
                    <div className="pb-4 border-b border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Hình ảnh chứng minh
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedClaim?.imageProof?.map((img, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700"
                          >
                            {typeof img === "string"
                              ? img.split("/").pop()
                              : `Ảnh ${idx + 1}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Trạng thái */}
                <div className="pb-4 border-b border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700">
                    Trạng Thái
                  </label>
                  <StatusBadge status={selectedClaim.status} />
                </div>

                {/* Giải pháp */}
                {selectedClaim.resolution && (
                  <div className="pb-4 border-b border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700">
                      Giải Pháp Xử Lý
                    </label>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {selectedClaim.resolution === "REPAIR"
                        ? "Sửa Chữa"
                        : selectedClaim.resolution === "REPLACE"
                          ? "Thay Thế"
                          : "Hoàn Tiền"}
                    </p>
                  </div>
                )}

                {/* Ghi chú */}
                {selectedClaim.staffNote && (
                  <div className="pb-4 border-b border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700">
                      Ghi Chú Từ Nhân Viên
                    </label>
                    <p className="text-sm text-gray-600 mt-1 p-2 bg-blue-50 rounded">
                      {selectedClaim.staffNote}
                    </p>
                  </div>
                )}

                {/* Ngày */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Ngày Tạo
                  </label>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedClaim.createdAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClaim(null)}
                className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Create Claim Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-6">Tạo Yêu Cầu Bảo Hành</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Order Item ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mã Đơn Hàng/Sản Phẩm <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="orderItemId"
                    value={formData.orderItemId}
                    onChange={handleChange}
                    placeholder="Nhập ID sản phẩm từ đơn hàng"
                    className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Số Seri Sản Phẩm
                  </label>
                  <input
                    type="text"
                    name="productSerialNumber"
                    value={formData.productSerialNumber}
                    onChange={handleChange}
                    placeholder="Ví dụ: SN-12345"
                    className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Lý Do Bảo Hành <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-red-500"
                  >
                    <option value="">-- Chọn lý do --</option>
                    <option value="BROKEN">Bị hỏng/Lỗi kỹ thuật</option>
                    <option value="DEFECTIVE">Lỗi nhà sản xuất</option>
                    <option value="NOT_WORKING">Không hoạt động</option>
                    <option value="PHYSICAL_DAMAGE">Hư hỏng vật lý</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                {/* Custom Reason */}
                {formData.reason === "OTHER" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Mô Tả Chi Tiết
                    </label>
                    <textarea
                      name="customReason"
                      placeholder="Mô tả chi tiết vấn đề của bạn"
                      className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-red-500"
                      rows="3"
                    />
                  </div>
                )}

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ảnh Chứng Minh ({formData.imageProof.length})
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-red-500">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageInput"
                    />
                    <label htmlFor="imageInput" className="cursor-pointer">
                      <p className="text-sm text-gray-600">
                        Chọn ảnh hoặc kéo thả
                      </p>
                    </label>
                  </div>
                  {formData.imageProof.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {formData.imageProof.map((img, idx) => (
                        <p key={idx}>✓ {img}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold"
                  >
                    Tạo Yêu Cầu
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
