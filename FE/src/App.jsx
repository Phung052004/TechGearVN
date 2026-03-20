import { Routes, Route } from "react-router-dom";

import Register from "./pages/auth/Register";
// Import Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

// Import Pages (Đảm bảo đường dẫn đúng với file bạn vừa tạo)
import HomePage from "./pages/user/HomePage";
import ProductDetailPage from "./pages/user/ProductDetailPage";
import ProductsPage from "./pages/user/ProductsPage";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import VerifyRegister from "./pages/auth/VerifyRegister";
import BuildPcPage from "./pages/user/BuildPcPage";
import Dashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";
import UsersManage from "./pages/admin/UsersManage";
import BannersManage from "./pages/admin/BannersManage";
import SettingsPage from "./pages/admin/SettingsPage";
import Profile from "./pages/user/Profile";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import PaymentResult from "./pages/user/PaymentResult";
import ProductManage from "./pages/admin/ProductManage";
import WarrantyPage from "./pages/WarrantyPage";

import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOrders from "./pages/staff/StaffOrders";
import StaffProducts from "./pages/staff/StaffProducts";
import StaffWarranty from "./pages/staff/StaffWarranty";
import StaffReviews from "./pages/staff/StaffReviews";
import StaffChat from "./pages/staff/StaffChat";
import StaffVouchers from "./pages/staff/StaffVouchers";

function App() {
  return (
    <Routes>
      {/* --- KHU VỰC PUBLIC (Khách hàng) --- */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="payment-result" element={<PaymentResult />} />
        <Route path="profile" element={<Profile />} />
        <Route path="warranty" element={<WarrantyPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="verify-register" element={<VerifyRegister />} />
        <Route path="build-pc" element={<BuildPcPage />} />
      </Route>

      {/* --- KHU VỰC ADMIN (Cần quyền Admin) --- */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />

        {/* Reuse Staff operational pages for Admin */}
        <Route path="orders" element={<StaffOrders />} />
        <Route path="products" element={<StaffProducts />} />

        <Route path="users" element={<UsersManage />} />

        <Route path="marketing">
          <Route path="vouchers" element={<StaffVouchers />} />
          <Route path="banners" element={<BannersManage />} />
        </Route>

        <Route path="settings" element={<SettingsPage />} />

        {/* Existing admin spec editor */}
        <Route path="products/specs" element={<ProductManage />} />
      </Route>

      {/* --- KHU VỰC STAFF (Nhân viên vận hành) --- */}
      <Route path="/staff" element={<StaffLayout />}>
        <Route index element={<StaffDashboard />} />
        <Route path="orders" element={<StaffOrders />} />
        <Route path="products" element={<StaffProducts />} />
        <Route path="warranty" element={<StaffWarranty />} />
        <Route path="reviews" element={<StaffReviews />} />
        <Route path="chat" element={<StaffChat />} />
        <Route path="vouchers" element={<StaffVouchers />} />
      </Route>

      {/* Trang 404 Not Found */}
      <Route
        path="*"
        element={
          <div className="flex h-screen justify-center items-center text-red-500 font-bold text-3xl">
            404 - Không tìm thấy trang
          </div>
        }
      />
    </Routes>
  );
}

export default App;
