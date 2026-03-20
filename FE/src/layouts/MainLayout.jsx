import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HeaderMain from "../components/layout/HeaderMain";
import Footer from "../components/layout/Footer";
import ChatBubble from "../components/chat/ChatBubble";

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <HeaderMain />
      {/* Header giả lập (Sẽ code đẹp sau) */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto font-bold">TechGear Header</div>
      </header>

      {/* Nội dung trang thay đổi ở đây */}
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>

      <Footer />

      {/* Chat Bubble Widget */}
      <ChatBubble />
    </div>
  );
};

export default MainLayout;
