import { apiClient } from "./apiClient";

function unwrapCommonEnvelope(payload, depth = 0) {
  if (depth > 4) return payload;
  if (payload == null) return payload;

  // Many APIs wrap the real payload inside a top-level key.
  if (typeof payload === "object" && !Array.isArray(payload)) {
    if (Object.prototype.hasOwnProperty.call(payload, "data")) {
      return unwrapCommonEnvelope(payload.data, depth + 1);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "result")) {
      return unwrapCommonEnvelope(payload.result, depth + 1);
    }
  }

  return payload;
}

function normalizeProductList(payload) {
  const unwrapped = unwrapCommonEnvelope(payload);
  if (Array.isArray(unwrapped)) return unwrapped;

  if (unwrapped && typeof unwrapped === "object") {
    if (Array.isArray(unwrapped.products)) return unwrapped.products;
    if (Array.isArray(unwrapped.items)) return unwrapped.items;
    if (Array.isArray(unwrapped.rows)) return unwrapped.rows;
    if (unwrapped.data) return normalizeProductList(unwrapped.data);
  }

  return [];
}

function normalizeProduct(payload) {
  const unwrapped = unwrapCommonEnvelope(payload);
  if (unwrapped && typeof unwrapped === "object" && !Array.isArray(unwrapped)) {
    if (unwrapped.product) return unwrapped.product;
    if (unwrapped.item) return unwrapped.item;
  }
  return unwrapped;
}

function normalizeProductFields(product) {
  if (!product || typeof product !== "object" || Array.isArray(product)) {
    return product;
  }

  const image = product.image ?? product.thumbnail;
  const thumbnail = product.thumbnail ?? product.image;
  const oldPrice = product.oldPrice ?? product.originalPrice;
  const originalPrice = product.originalPrice ?? product.oldPrice;
  const countInStock = product.countInStock ?? product.stockQuantity;
  const stockQuantity = product.stockQuantity ?? product.countInStock;

  return {
    ...product,
    image,
    thumbnail,
    oldPrice,
    originalPrice,
    countInStock,
    stockQuantity,
  };
}

export async function getProducts(params) {
  const { data } = await apiClient.get("/products", { params });
  return normalizeProductList(data).map(normalizeProductFields);
}

export async function getProductById(productId) {
  const { data } = await apiClient.get(`/products/${productId}`);
  return normalizeProductFields(normalizeProduct(data));
}

function normalizeSpecsList(payload) {
  const unwrapped = unwrapCommonEnvelope(payload);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (unwrapped && typeof unwrapped === "object") {
    if (Array.isArray(unwrapped.specs)) return unwrapped.specs;
    if (Array.isArray(unwrapped.items)) return unwrapped.items;
    if (Array.isArray(unwrapped.rows)) return unwrapped.rows;
  }
  return [];
}

export async function getProductSpecs(productId) {
  const { data } = await apiClient.get(`/products/${productId}/specs`);
  return normalizeSpecsList(data);
}

export async function replaceProductSpecs(productId, specs) {
  const { data } = await apiClient.put(`/products/${productId}/specs`, {
    specs: Array.isArray(specs) ? specs : [],
  });
  return normalizeSpecsList(data);
}

export async function createProduct(payload) {
  const { data } = await apiClient.post("/products", payload);
  return normalizeProductFields(normalizeProduct(data));
}

export async function updateProduct(productId, payload) {
  const { data } = await apiClient.put(`/products/${productId}`, payload);
  return normalizeProductFields(normalizeProduct(data));
}

export async function getAllProducts() {
  return getProducts({ includeInactive: true });
}

export async function uploadProductImage(formData) {
  const { data } = await apiClient.post("/products/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapCommonEnvelope(data);
}

export async function deleteProductImage(productId, imageUrl) {
  const { data } = await apiClient.delete(`/products/${productId}/images`, {
    data: { imageUrl },
  });
  return normalizeProductFields(normalizeProduct(data));
}

export async function updateProductThumbnail(productId, thumbnailUrl) {
  const { data } = await apiClient.put(`/products/${productId}/thumbnail`, {
    thumbnailUrl,
  });
  return normalizeProductFields(normalizeProduct(data));
}

export async function getProductDetail(productId) {
  return getProductById(productId);
}
