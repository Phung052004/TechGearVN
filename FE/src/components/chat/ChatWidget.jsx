import React, { useEffect, useState, useRef } from "react";
import { IoSend } from "react-icons/io5";
import { useAuth } from "../../context";
import { chatService } from "../../services";
import { apiClient } from "../../services/apiClient";

export default function ChatWidget({ onMessageReceived }) {
  const { user, isAuthenticated } = useAuth();

  // Force re-check on component mount or when user changes
  const [triggerRecheck, setTriggerRecheck] = useState(0);

  useEffect(() => {
    if (user) {
      // Reset trigger to force re-initialization
      setTriggerRecheck((prev) => prev + 1);
    }
  }, [user]);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat room and fetch messages
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setError("Vui lòng đăng nhập để sử dụng chat");
      return;
    }

    const initializeChat = async () => {
      try {
        setError(null);

        // Get or create room
        const room = await apiClient.get("/chat/rooms/me");
        const roomData = room.data?.data || room.data;

        if (!roomData || !roomData._id) {
          throw new Error("Không thể tạo phòng chat");
        }

        setRoomId(roomData._id);

        // Fetch messages
        const messagesData = await chatService.getMessages(roomData._id);
        const messagesList = messagesData?.messages || messagesData || [];
        setMessages(Array.isArray(messagesList) ? messagesList : []);
      } catch (err) {
        console.error("Chat initialization error:", err);
        setError(
          err.response?.data?.message ||
            "Không thể kết nối chat. Vui lòng thử lại.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    initializeChat();

    // Poll for new messages every 3 seconds
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(initializeChat, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isAuthenticated, triggerRecheck]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !roomId) {
      return;
    }

    try {
      const trimmedMessage = newMessage.trim();
      setNewMessage(""); // Clear input immediately
      setIsLoading(true);

      // Send message
      const sent = await chatService.sendMessage(roomId, {
        message: trimmedMessage,
      });

      // Add to messages
      setMessages((prev) => [...prev, sent]);
      onMessageReceived?.(sent);
    } catch (err) {
      console.error("Send message error:", err);
      setNewMessage(trimmedMessage); // Restore message on error
      setError("Gửi tin nhắn lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Vui lòng đăng nhập để sử dụng chat
          </p>
          <a
            href="/login"
            className="text-red-600 font-semibold hover:underline"
          >
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-red-600 text-white p-4 border-b">
        <h3 className="font-bold text-lg">Tư vấn sản phẩm</h3>
        <p className="text-xs text-red-100">Chat với nhân viên hỗ trợ</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
            {error}
          </div>
        )}

        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Đang tải...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Chưa có tin nhắn</p>
              <p className="text-xs text-gray-500">
                Hãy gửi tin nhắn đầu tiên của bạn
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => {
              const isOwn = msg.sender?._id === user._id;
              return (
                <div
                  key={msg._id || index}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwn
                        ? "bg-red-600 text-white rounded-br-none"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-red-100" : "text-gray-500"
                      }`}
                    >
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 bg-white"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
            disabled={isLoading || !roomId}
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim() || !roomId}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            <IoSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
