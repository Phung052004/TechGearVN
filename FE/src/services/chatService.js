import { apiClient } from "./apiClient";

function unwrap(payload) {
  if (payload && typeof payload === "object") {
    if (Object.prototype.hasOwnProperty.call(payload, "data"))
      return payload.data;
    if (Object.prototype.hasOwnProperty.call(payload, "result"))
      return payload.result;
  }
  return payload;
}

export async function listRooms() {
  const { data } = await apiClient.get("/chat/rooms");
  return unwrap(data);
}

export async function closeRoom(roomId) {
  const { data } = await apiClient.put(`/chat/rooms/${roomId}/close`);
  return unwrap(data);
}

export async function getMessages(roomId) {
  const { data } = await apiClient.get(`/chat/rooms/${roomId}/messages`);
  return unwrap(data);
}

export async function sendMessage(roomId, payload) {
  const { data } = await apiClient.post(
    `/chat/rooms/${roomId}/messages`,
    payload,
  );
  return unwrap(data);
}
