import React, { useState, useRef } from "react";
import { IoClose, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { FaFacebookMessenger } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import { Link } from "react-router-dom";
import ChatWidget from "./ChatWidget";

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expanded, setExpanded] = useState(false); // show mini bubbles
  const bubbleRef = useRef(null);

  const handleMessageReceived = (message) => {
    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  const handleToggleChat = () => {
    // open internal chat window
    setIsOpen((prev) => !prev);
    setExpanded(false);
    if (!isOpen) setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handlePrimaryClick = () => {
    // Toggle expanded cluster of mini bubbles
    setExpanded((s) => !s);
    // close chat window if open
    if (isOpen) setIsOpen(false);
  };

  const openMessenger = () =>
    window.open("https://m.me/TechGearVietnam", "_blank");
  const openZalo = () => window.open("https://zalo.me/0986552233", "_blank");
  const goBuildPc = () => {
    // navigate via link
    window.location.href = "/build-pc";
  };
  const openStaffChat = () => {
    setIsOpen(true);
    setExpanded(false);
    setUnreadCount(0);
  };

  return (
    <div ref={bubbleRef} className="fixed bottom-8 right-8 z-50 font-sans">
      {/* Chat Window - Modal/Sheet Style */}
      {isOpen && (
        <div className="fixed inset-0 md:absolute md:inset-auto md:bottom-24 md:right-0 md:w-96 md:h-[500px] md:rounded-3xl md:shadow-2xl md:border md:border-gray-200 bg-white flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-red-600 text-white p-4 flex flex-col gap-2 rounded-t-3xl md:rounded-t-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">💬 Chat hỗ trợ</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="hover:bg-red-700 rounded-full p-1 transition-colors"
                  title="Đóng"
                >
                  <IoClose size={20} />
                </button>
              </div>
            </div>

            {/* Channel shortcuts */}
            <div className="flex items-center gap-3">
              <a
                href="https://m.me/TechGearVietnam"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-800 px-2 py-1 rounded-full text-sm"
                title="Mở Messenger"
              >
                <FaFacebookMessenger className="text-[#0084FF]" />
                <span className="hidden md:inline">Messenger</span>
              </a>

              <a
                href="https://zalo.me/0986552233"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-800 px-2 py-1 rounded-full text-sm"
                title="Mở Zalo"
              >
                <SiZalo className="text-[#0068FF]" />
                <span className="hidden md:inline">Zalo</span>
              </a>

              <Link
                to="/build-pc"
                className="inline-flex items-center gap-2 bg-white text-gray-800 px-2 py-1 rounded-full text-sm"
                title="Tư vấn build PC"
              >
                <span className="font-bold">⚙️</span>
                <span className="hidden md:inline">Build PC</span>
              </Link>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <ChatWidget onMessageReceived={handleMessageReceived} />
          </div>
        </div>
      )}

      {/* Backdrop for mobile - click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden"
          onClick={handleClose}
          style={{ zIndex: -1 }}
        />
      )}

      {/* Floating Chat Cluster */}
      <div className="relative flex items-end justify-end">
        {/* Mini bubbles - show when expanded */}
        {expanded && (
          <div className="absolute bottom-24 right-0 flex flex-col items-end gap-3 mb-2 animate-fadeIn">
            <button
              onClick={openMessenger}
              className="w-12 h-12 bg-[#0084FF] rounded-full shadow-lg flex items-center justify-center text-white transition-transform transform hover:scale-110"
              title="Messenger"
            >
              <FaFacebookMessenger />
            </button>

            <button
              onClick={openZalo}
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden border border-blue-100 transition-transform transform hover:scale-110"
              title="Zalo"
            >
              <SiZalo className="text-[#0068FF]" />
            </button>

            <button
              onClick={goBuildPc}
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white transition-transform transform hover:scale-110"
              title="Build PC"
            >
              <span className="text-lg">⚙️</span>
            </button>

            <button
              onClick={openStaffChat}
              className="w-12 h-12 bg-red-600 rounded-full shadow-lg flex items-center justify-center text-white transition-transform transform hover:scale-110"
              title="Chat với nhân viên"
            >
              <IoChatbubbleEllipsesOutline />
            </button>
          </div>
        )}

        {/* Primary bubble */}
        <button
          onClick={handlePrimaryClick}
          className="relative w-16 h-16 rounded-full bg-red-600 text-white shadow-2xl hover:shadow-3xl hover:bg-red-700 transition-all duration-300 flex items-center justify-center flex-shrink-0"
          title={expanded ? "Đóng các kênh" : "Mở các kênh chat"}
        >
          {expanded ? (
            <IoClose size={28} />
          ) : (
            <IoChatbubbleEllipsesOutline size={28} />
          )}
          {unreadCount > 0 && !expanded && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
