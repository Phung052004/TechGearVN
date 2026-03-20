import { apiClient } from "./apiClient";

/**
 * Upload image to server
 * Server sẽ tự động chọn giữa Cloudinary hoặc MongoDB dựa trên config
 * @param {File} file - Image file
 * @param {string} storage - "cloudinary" hoặc "mongodb" (optional)
 * @returns {Promise} { url, publicId, originalName }
 */
export async function uploadImage(file, storage = "cloudinary") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("storage", storage);

  try {
    const response = await apiClient.post("/images/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const data = response.data?.data || response.data;
    return {
      url: data.url,
      publicId: data.publicId,
      originalName: data.originalName,
      storage: data.storage || storage,
    };
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || error?.message || "Upload ảnh lỗi",
    );
  }
}

/**
 * Delete image from server
 * @param {string} publicId - Image public ID (Cloudinary) or MongoDB ID
 * @param {string} storage - "cloudinary" hoặc "mongodb"
 */
export async function deleteImage(publicId, storage = "cloudinary") {
  try {
    await apiClient.delete("/images/delete", {
      data: { publicId, storage },
    });
    return true;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || error?.message || "Xóa ảnh lỗi",
    );
  }
}
