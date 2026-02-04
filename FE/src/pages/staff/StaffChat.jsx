import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { chatService } from "../../services";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

export default function StaffChat() {
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const openRooms = useMemo(
    () => rooms.filter((r) => r.status === "OPEN"),
    [rooms],
  );

  async function loadRooms() {
    try {
      setLoadingRooms(true);
      const res = await chatService.listRooms();
      setRooms(res || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được phòng chat");
    } finally {
      setLoadingRooms(false);
    }
  }

  async function loadMessages(roomId) {
    try {
      setLoadingMessages(true);
      const res = await chatService.getMessages(roomId);
      setMessages(res?.messages || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được tin nhắn");
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (!activeRoom?._id) return;
    loadMessages(activeRoom._id);
  }, [activeRoom?._id]);

  async function send() {
    if (!activeRoom?._id) return;
    const content = text.trim();
    if (!content) return;

    try {
      setSending(true);
      await chatService.sendMessage(activeRoom._id, { message: content });
      setText("");
      await loadMessages(activeRoom._id);
      await loadRooms();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gửi thất bại");
    } finally {
      setSending(false);
    }
  }

  async function closeRoom() {
    if (!activeRoom?._id) return;
    try {
      await chatService.closeRoom(activeRoom._id);
      toast.success("Đã đóng room");
      setActiveRoom(null);
      setMessages([]);
      await loadRooms();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Đóng room thất bại");
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold text-gray-900">Chat</div>
            <div className="text-sm text-gray-600">Hỗ trợ khách hàng</div>
          </div>
          <button
            type="button"
            className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-bold"
            onClick={loadRooms}
            disabled={loadingRooms}
          >
            Tải lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-extrabold text-gray-900">Phòng đang mở</div>
            <div className="text-sm text-gray-600 mt-1">
              {openRooms.length} phòng
            </div>
          </div>
          <div className="max-h-[70vh] overflow-auto">
            {loadingRooms ? (
              <div className="p-4 text-gray-600">Đang tải...</div>
            ) : openRooms.length === 0 ? (
              <div className="p-4 text-gray-600">Không có room mở.</div>
            ) : (
              openRooms.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  className={
                    activeRoom?._id === r._id
                      ? "w-full text-left px-4 py-3 border-b bg-blue-50"
                      : "w-full text-left px-4 py-3 border-b hover:bg-gray-50"
                  }
                  onClick={() => setActiveRoom(r)}
                >
                  <div className="font-extrabold text-gray-900">
                    {r?.user?.fullName || r?.user?.email || "Khách"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDate(r?.updatedAt || r?.createdAt)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          {!activeRoom ? (
            <div className="text-gray-600">Chọn 1 phòng để chat.</div>
          ) : (
            <div className="flex flex-col h-[70vh]">
              <div className="flex items-center justify-between gap-3 border-b pb-3">
                <div className="min-w-0">
                  <div className="font-extrabold text-gray-900">
                    {activeRoom?.user?.fullName ||
                      activeRoom?.user?.email ||
                      "Khách"}
                  </div>
                  <div className="text-xs text-gray-600">
                    Room: {activeRoom._id}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 font-bold text-sm"
                  onClick={closeRoom}
                >
                  Đóng room
                </button>
              </div>

              <div className="flex-1 overflow-auto py-3 space-y-2">
                {loadingMessages ? (
                  <div className="text-gray-600">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="text-gray-600">Chưa có tin nhắn.</div>
                ) : (
                  messages.map((m) => {
                    const senderRole = m?.sender?.role;
                    const isStaff =
                      senderRole === "STAFF" || senderRole === "ADMIN";
                    return (
                      <div
                        key={m._id}
                        className={
                          isStaff ? "flex justify-end" : "flex justify-start"
                        }
                      >
                        <div
                          className={
                            isStaff
                              ? "max-w-[80%] bg-blue-600 text-white rounded-2xl px-3 py-2"
                              : "max-w-[80%] bg-gray-100 text-gray-900 rounded-2xl px-3 py-2"
                          }
                        >
                          <div className="text-sm font-bold whitespace-pre-wrap">
                            {m.message}
                          </div>
                          <div
                            className={
                              isStaff
                                ? "text-xs text-blue-100 mt-1"
                                : "text-xs text-gray-500 mt-1"
                            }
                          >
                            {formatDate(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t pt-3 flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  placeholder="Nhập tin nhắn..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  disabled={sending}
                />
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm"
                  onClick={send}
                  disabled={sending}
                >
                  Gửi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
