import React, { useRef, useState } from "react";
import { IoCloudUploadOutline, IoClose, IoCheckmark } from "react-icons/io5";
import { imageService } from "../../services";

export default function ImageUpload({
  value = null,
  onChange,
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB
  storageType = "cloudinary", // "cloudinary" hoặc "mongodb"
}) {
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storage, setStorage] = useState(storageType);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file
    if (file.size > maxSize) {
      setError(`File quá lớn. Tối đa ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    // Kiểm tra tipe file
    if (!file.type.startsWith("image/")) {
      setError("Chỉ hỗ trợ file ảnh");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await imageService.uploadImage(file, storage);
      onChange?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (!value?.publicId) {
      onChange?.(null);
      return;
    }

    setIsLoading(true);
    try {
      await imageService.deleteImage(value.publicId, storage);
      onChange?.(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Storage Type Selector */}
      <div className="mb-4 flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="storage"
            value="cloudinary"
            checked={storage === "cloudinary"}
            onChange={(e) => setStorage(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            ☁️ Cloudinary
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="storage"
            value="mongodb"
            checked={storage === "mongodb"}
            onChange={(e) => setStorage(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">💾 MongoDB</span>
        </label>
      </div>

      {/* Image Preview */}
      {value?.url ? (
        <div className="relative mb-4">
          <img
            src={value.url}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={isLoading || disabled}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 disabled:bg-gray-400 transition-colors"
            title="Xóa ảnh"
          >
            <IoClose size={20} />
          </button>
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-25 rounded-lg flex items-center justify-center">
              <div className="text-white text-sm">Đang xóa...</div>
            </div>
          )}
          {!isLoading && (
            <div className="absolute bottom-2 right-2 bg-green-600 text-white rounded-full p-1">
              <IoCheckmark size={16} />
            </div>
          )}
        </div>
      ) : (
        /* Upload Area */
        <div
          className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-600 hover:bg-red-50 transition-all"
          onClick={() => !disabled && !isLoading && inputRef.current?.click()}
        >
          <IoCloudUploadOutline
            size={40}
            className="mx-auto text-gray-400 mb-3"
          />
          <p className="text-gray-700 font-semibold">
            {isLoading ? "Đang upload..." : "Nhấp để chọn ảnh"}
          </p>
          <p className="text-sm text-gray-500 mt-1">Hoặc kéo thả ảnh vào đây</p>
          <p className="text-xs text-gray-400 mt-2">
            {storage === "cloudinary"
              ? "☁️ Lưu trên Cloudinary"
              : "💾 Lưu trên MongoDB"}
          </p>
          <p className="text-xs text-gray-400">
            Tối đa {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* File Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || isLoading}
        style={{ display: "none" }}
      />
    </div>
  );
}
