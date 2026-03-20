import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { IoClose, IoCloudUploadOutline } from "react-icons/io5";
import { productService } from "../../services";

export default function ProductImageUpload({ productId, onImagesUpdated }) {
  const [images, setImages] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load existing images
  useEffect(() => {
    if (!productId) return;

    const loadImages = async () => {
      try {
        setLoading(true);
        const product = await productService.getProductDetail(productId);
        setImages(product?.images || []);
        setThumbnail(product?.thumbnail || null);
      } catch (err) {
        console.error("Load images error:", err);
        toast.error("Không tải được hình ảnh");
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [productId]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      const newImages = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("productId", productId);

        const uploaded = await productService.uploadProductImage(formData);
        newImages.push(uploaded.url || uploaded);
      }

      setImages((prev) => [...prev, ...newImages]);
      toast.success(`Đã upload ${newImages.length} ảnh`);
      onImagesUpdated?.(newImages);
      e.target.value = ""; // Reset input
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Lỗi upload ảnh",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSetThumbnail = async (imageUrl) => {
    try {
      setThumbnail(imageUrl);
      await productService.updateProductThumbnail(productId, imageUrl);
      toast.success("Đã set thumbnail");
    } catch (err) {
      toast.error("Lỗi set thumbnail");
      setThumbnail(thumbnail); // Revert
    }
  };

  const handleRemoveImage = async (imageUrl) => {
    try {
      await productService.deleteProductImage(productId, imageUrl);
      setImages((prev) => prev.filter((img) => img !== imageUrl));
      if (thumbnail === imageUrl) {
        setThumbnail(null);
      }
      toast.success("Đã xóa ảnh");
    } catch (err) {
      toast.error("Lỗi xóa ảnh");
    }
  };

  if (!productId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        Chọn sản phẩm trước khi upload ảnh
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="imageInput"
        />
        <label
          htmlFor="imageInput"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <IoCloudUploadOutline size={32} className="text-gray-400" />
          <div className="font-semibold text-gray-600">
            {uploading ? "Đang upload..." : "Click để chọn hoặc kéo thả ảnh"}
          </div>
          <div className="text-xs text-gray-500">
            Hỗ trợ PNG, JPG, WebP. Max 5MB/ảnh
          </div>
        </label>
      </div>

      {/* Thumbnails */}
      <div>
        <div className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>Ảnh thumbnail (ảnh chính)</span>
          {thumbnail && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              Đã set
            </span>
          )}
        </div>
        {thumbnail ? (
          <div className="relative inline-block">
            <img
              src={thumbnail}
              alt="Thumbnail"
              className="w-32 h-32 object-cover rounded-lg border-2 border-purple-300"
            />
          </div>
        ) : (
          <div className="text-sm text-gray-500">Chưa chọn ảnh thumbnail</div>
        )}
      </div>

      {/* All Images */}
      <div>
        <div className="font-semibold text-gray-700 mb-3">
          Ảnh chi tiết ({images.length})
        </div>
        {loading ? (
          <div className="text-gray-600">Đang tải...</div>
        ) : images.length === 0 ? (
          <div className="text-sm text-gray-500">Chưa có ảnh nào</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={img}
                  alt={`Product ${idx}`}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleSetThumbnail(img)}
                    className={`p-2 rounded ${
                      thumbnail === img
                        ? "bg-purple-600 text-white"
                        : "bg-white text-gray-700 hover:bg-purple-50"
                    }`}
                    title="Set làm thumbnail"
                  >
                    ⭐
                  </button>
                  <button
                    onClick={() => handleRemoveImage(img)}
                    className="p-2 rounded bg-red-600 text-white hover:bg-red-700"
                    title="Xóa ảnh"
                  >
                    <IoClose size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
